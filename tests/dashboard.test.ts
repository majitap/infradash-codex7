import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dashboardSchema,
  demoDashboard,
  snapshotStale,
  summarizeDashboard,
  validateDataUrl,
} from "../lib/dashboard";
import { collectDashboard } from "../services/collector/dashboard";

test("개요 데이터는 날짜 중복, 잘못된 날짜, 음수와 빈 일별 데이터를 거부한다", () => {
  assert.equal(dashboardSchema.safeParse(demoDashboard).success, true);
  for (const daily of [
    [],
    [{ date: "2026-02-30", success: 1, failed: 0, canceled: 0 }],
    [demoDashboard.daily[0], demoDashboard.daily[0]],
    [{ ...demoDashboard.daily[0], success: -1 }],
  ])
    assert.equal(
      dashboardSchema.safeParse({ ...demoDashboard, daily }).success,
      false,
    );
});
test("실행이 없는 기간은 성공률을 임의로 만들지 않고 비교가 불가능함을 나타낸다", () => {
  const result = summarizeDashboard(
    {
      ...demoDashboard,
      daily: [{ date: "2026-11-01", success: 0, failed: 0, canceled: 0 }],
    },
    7,
  );
  assert.equal(result.rate, null);
  assert.equal(result.delta, null);
  assert.equal(result.total, 0);
});
test("조회 기간은 행 개수가 아니라 달력 날짜로 계산한다", () => {
  const result = summarizeDashboard(
    {
      ...demoDashboard,
      daily: [
        { date: "2026-10-01", success: 500, failed: 0, canceled: 0 },
        { date: "2026-11-01", success: 1, failed: 1, canceled: 0 },
      ],
    },
    7,
  );
  assert.equal(result.total, 2);
  assert.equal(result.rate, 50);
  assert.equal(result.delta, null);
});
test("오래되거나 미래인 수집 결과를 최신으로 표시하지 않는다", () => {
  const data = { ...demoDashboard, source: "live" as const };
  const time = Date.parse(data.collectedAt);
  assert.equal(snapshotStale(data, time), false);
  assert.equal(snapshotStale(data, time + 120001), true);
  assert.equal(snapshotStale(data, time - 31000), true);
});
test("수집 주소는 토큰 쿼리, 사용자 인증 정보, 외부 평문 연결을 거부한다", () => {
  for (const value of [
    "https://example.com/?token=secret",
    "https://user:pass@example.com/",
    "http://example.com/",
    "javascript:alert(1)",
  ])
    assert.throws(() => validateDataUrl(value));
  assert.equal(
    validateDataUrl("https://example.com/data"),
    "https://example.com/data",
  );
});
test("읽기 수집기는 지정한 프로젝트만 조회하고 러너 중복을 제거하며 미수집 값은 비워둔다", async () => {
  const calls: string[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    calls.push(url.pathname);
    assert.equal(init?.method, "GET");
    assert.equal(init?.redirect, "error");
    let value: unknown;
    if (/\/projects\/\d+$/.test(url.pathname))
      value = {
        id: Number(url.pathname.split("/").at(-1)),
        name: "테스트 프로젝트",
      };
    else if (url.pathname.endsWith("/runners"))
      value = [{ id: 7, paused: false, status: "online" }];
    else if (url.pathname.endsWith("/pipelines/42"))
      value = { duration: 25, started_at: "2026-11-01T01:00:00Z" };
    else if (url.pathname.endsWith("/pipelines"))
      value = [
        {
          id: 42,
          project_id: 1,
          status: "success",
          ref: "main",
          created_at: "2026-11-01T01:00:00Z",
        },
      ];
    else throw new Error("예상하지 못한 요청");
    return new Response(JSON.stringify(value), {
      headers: { "x-next-page": "", "Content-Type": "application/json" },
    });
  };
  const result = await collectDashboard(
    {
      baseUrl: "https://gitlab.example.com",
      token: "test-only",
      projectIds: ["1", "2"],
      workspace: "테스트",
    },
    fetcher,
    new Date("2026-11-01T02:00:00Z"),
  );
  assert.equal(result.runners.online, 1);
  assert.equal(result.runnerDetails.length, 1);
  assert.equal(result.runnerDetails[0].id, 7);
  assert.equal(result.runnerDetails[0].status, "online");
  assert.equal(result.runnerDetails[0].concurrent, null);
  assert.equal(result.runnerDetails[0].cpuLoad, null);
  assert.equal(result.runnerDetails[0].version, null);
  assert.equal(result.daily.at(-1)?.success, 2);
  assert.equal(result.license, null);
  assert.equal(result.queueSeconds, null);
  assert.equal(result.health, "unknown");
  assert.equal(result.source, "live");
  assert.ok(calls.every((p) => p.startsWith("/api/v4/projects/")));
});
test("권한 실패를 정상적인 빈 데이터로 대체하지 않는다", async () => {
  await assert.rejects(
    collectDashboard(
      {
        baseUrl: "https://gitlab.example.com",
        token: "test-only",
        projectIds: ["1"],
        workspace: "테스트",
      },
      async () => new Response("", { status: 403 }),
    ),
    /403/,
  );
});
