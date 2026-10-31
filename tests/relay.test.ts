import test from "node:test";
import assert from "node:assert/strict";
import { dashboardSchema, demoDashboard } from "../lib/dashboard";
import {
  deliveryStats,
  filterPipelines,
  formatDuration,
  prioritizeSignals,
} from "../lib/relay";

test("실행 소요 시간은 성공한 실행의 실제 중앙값이며 미수집 값은 제외한다", () => {
  const base = demoDashboard.pipelines[0];
  const pipelines = [
    { ...base, status: "success" as const, durationSeconds: 0 },
    { ...base, status: "success" as const, durationSeconds: 90 },
    { ...base, status: "success" as const, durationSeconds: 120 },
    { ...base, status: "success" as const, durationSeconds: 300 },
    { ...base, status: "success" as const, durationSeconds: null },
    { ...base, status: "failed" as const, durationSeconds: 900 },
  ];
  assert.equal(deliveryStats(pipelines).median, 105);
  assert.equal(deliveryStats(pipelines.slice(4)).median, null);
  assert.equal(formatDuration(59.8), "1분 0초");
  assert.equal(formatDuration(null), "—");
});

test("실행 검색과 상태 필터를 함께 적용하고 원본을 변경하지 않는다", () => {
  const results = filterPipelines(
    demoDashboard.pipelines,
    "MONITORING",
    "failed",
  );
  assert.ok(results.length > 0);
  assert.ok(
    results.every(
      (p) =>
        p.project.toLowerCase().includes("monitoring") && p.status === "failed",
    ),
  );
  assert.equal(
    filterPipelines(demoDashboard.pipelines, "존재하지않는이름", "all").length,
    0,
  );
  assert.equal(
    filterPipelines(demoDashboard.pipelines, "   ", "all").length,
    demoDashboard.pipelines.length,
  );
});

test("시스템 연결은 생략 시 비어 있고 미등록 구성 요소 또는 자기 연결은 거부한다", () => {
  const payload = { ...demoDashboard, connections: undefined };
  assert.deepEqual(dashboardSchema.parse(payload).connections, []);
  assert.equal(
    dashboardSchema.safeParse({
      ...payload,
      connections: [{ from: "gitlab", to: "missing" }],
    }).success,
    false,
  );
  assert.equal(
    dashboardSchema.safeParse({
      ...payload,
      connections: [{ from: "gitlab", to: "gitlab" }],
    }).success,
    false,
  );
  assert.equal(dashboardSchema.safeParse(demoDashboard).success, true);
  assert.equal(
    dashboardSchema.safeParse({
      ...demoDashboard,
      services: [{ ...demoDashboard.services[0], cpu: 101 }],
    }).success,
    false,
  );
});

test("신호의 입력 순서와 무관하게 심각한 항목을 우선하며 원본을 보존한다", () => {
  const alerts = [...demoDashboard.alerts].reverse();
  const before = structuredClone(alerts);
  assert.equal(prioritizeSignals(alerts)[0].severity, "critical");
  assert.deepEqual(alerts, before);
  assert.equal(dashboardSchema.safeParse({ ...demoDashboard, alerts: [alerts[0], alerts[0]] }).success, false);
});

test("기존 수집 파일은 러너 목록 없이 호환되며 잘못된 러너 지표와 중복 ID는 거부한다", () => {
  assert.deepEqual(dashboardSchema.parse({...demoDashboard,runnerDetails:undefined}).runnerDetails,[]);
  const runner = demoDashboard.runnerDetails[0];
  assert.equal(dashboardSchema.safeParse({...demoDashboard,runnerDetails:[runner,runner]}).success,false);
  assert.equal(dashboardSchema.safeParse({...demoDashboard,runnerDetails:[{...runner,cpuLoad:101}]}).success,false);
});
