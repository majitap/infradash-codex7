import { z } from "zod";
import {
  dailyPipelines,
  recentPipelines,
  runnerCounts,
  runnerCapacity,
  runnerBusy,
  avgQueueSeconds,
  runners as sampleRunners,
} from "./mock-data";

const count = z.number().int().nonnegative().max(1_000_000_000);
const text = z.string().min(1).max(160);
export const runnerDetailSchema = z.object({
  id: count,
  name: text,
  description: z.string().max(240).default(""),
  status: z.enum(["online", "offline", "paused", "unknown"]),
  executor: text.nullable().default(null),
  version: text.nullable().default(null),
  os: text.nullable().default(null),
  arch: text.nullable().default(null),
  ipAddress: text.nullable().default(null),
  tags: z.array(text).max(100).default([]),
  concurrent: count.nullable().default(null),
  jobsRunning: count.nullable().default(null),
  jobsLast24h: count.nullable().default(null),
  jobsLast7d: z.array(count).max(7).default([]),
  cpuLoad: z.number().min(0).max(100).nullable().default(null),
  memUsed: z.number().min(0).max(100).nullable().default(null),
  lastContact: z.string().datetime({ offset: true }).nullable().default(null),
  note: z.string().max(240).default(""),
});
export type RunnerDetail = z.infer<typeof runnerDetailSchema>;
export const dashboardSchema = z
  .object({
    schemaVersion: z.literal(1),
    source: z.enum(["live", "demo"]),
    collectedAt: z.string().datetime({ offset: true }),
    workspace: text,
    license: z.object({ used: count, total: count }).nullable(),
    health: z.enum(["healthy", "degraded", "down", "unknown"]),
    daily: z
      .array(
        z.object({
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .refine(
              (v) =>
                !Number.isNaN(Date.parse(v)) &&
                new Date(v).toISOString().slice(0, 10) === v,
            ),
          success: count,
          failed: count,
          canceled: count,
        }),
      )
      .min(1)
      .max(366)
      .refine(
        (rows) => rows.every((r, i) => !i || r.date > rows[i - 1].date),
        "날짜는 중복 없이 오름차순이어야 합니다.",
      ),
    runners: z.object({
      online: count,
      offline: count,
      paused: count,
      capacity: count.nullable(),
      busy: count.nullable(),
    }),
    runnerDetails: z
      .array(runnerDetailSchema)
      .max(1000)
      .default([])
      .refine(
        (rows) => new Set(rows.map((r) => r.id)).size === rows.length,
        "러너 ID는 중복될 수 없습니다.",
      ),
    queueSeconds: z.number().nonnegative().max(86400).nullable(),
    pipelines: z
      .array(
        z.object({
          id: count,
          project: text,
          ref: text,
          status: z.enum([
            "success",
            "failed",
            "running",
            "pending",
            "canceled",
          ]),
          durationSeconds: z.number().nonnegative().nullable(),
          startedAt: z.string().datetime({ offset: true }).nullable(),
        }),
      )
      .max(1000),
    services: z
      .array(
        z.object({
          id: text,
          name: text,
          role: text,
          state: z.enum(["healthy", "degraded", "down", "unknown"]),
          detail: z.string().max(240),
          cpu: z.number().min(0).max(100).optional(),
          memory: z.number().min(0).max(100).optional(),
          latencyMs: z.number().nonnegative().optional(),
        }),
      )
      .max(20)
      .refine((rows) => new Set(rows.map((r) => r.id)).size === rows.length),
    alerts: z
      .array(
        z.object({
          id: text,
          title: text,
          detail: z.string().max(240),
          severity: z.enum(["critical", "warning", "info"]),
        }),
      )
      .max(100)
      .refine(
        (rows) => new Set(rows.map((r) => r.id)).size === rows.length,
        "신호 ID는 중복될 수 없습니다.",
      ),
    connections: z
      .array(z.object({ from: text, to: text }))
      .max(100)
      .default([]),
  })
  .refine(
    (data) =>
      data.connections.every(
        (edge) =>
          edge.from !== edge.to &&
          data.services.some((s) => s.id === edge.from) &&
          data.services.some((s) => s.id === edge.to),
      ),
    "연결선의 양 끝은 수집된 구성 요소여야 합니다.",
  );
export type DashboardSnapshot = z.infer<typeof dashboardSchema>;
export const demoDashboard: DashboardSnapshot = {
  schemaVersion: 1,
  source: "demo",
  collectedAt: "2026-10-31T01:12:00Z",
  workspace: "마지탭",
  license: { used: 950, total: 1000 },
  health: "unknown",
  daily: dailyPipelines,
  runners: { ...runnerCounts, capacity: runnerCapacity, busy: runnerBusy },
  runnerDetails: sampleRunners.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    status: r.status,
    executor: r.executor,
    version: r.version,
    os: r.os,
    arch: r.arch,
    ipAddress: r.ipAddress,
    tags: r.tags,
    concurrent: r.concurrent,
    jobsRunning: r.jobsRunning,
    jobsLast24h: r.jobsLast24h,
    jobsLast7d: r.jobsLast7d,
    cpuLoad: r.cpuLoad,
    memUsed: r.memUsed,
    lastContact: `${r.lastContact}+09:00`,
    note: r.note ?? "",
  })),
  queueSeconds: avgQueueSeconds,
  pipelines: recentPipelines.map(
    ({ id, project, ref, status, durationSeconds, startedAt }) => ({
      id,
      project,
      ref,
      status,
      durationSeconds,
      startedAt: `${startedAt}:00+09:00`,
    }),
  ),
  services: [
    {
      id: "edge",
      name: "클라우드플레어",
      role: "외부 진입점",
      state: "healthy",
      detail: "웹 방화벽과 캐시를 거쳐 외부 요청이 들어오는 관문입니다.",
      latencyMs: 14,
    },
    {
      id: "ingress",
      name: "인그레스",
      role: "트래픽 분배",
      state: "healthy",
      detail: "웹·저장소·레지스트리 요청을 분산하는 진입 계층입니다.",
      cpu: 18,
      memory: 34,
      latencyMs: 12,
    },
    {
      id: "gitlab",
      name: "깃랩 코어",
      role: "웹·응용 서비스",
      state: "healthy",
      detail:
        "프로젝트, 코드 리뷰와 파이프라인 요청을 처리합니다. 웹 서비스 파드 8개.",
      cpu: 46,
      memory: 68,
      latencyMs: 42,
    },
    {
      id: "queue",
      name: "사이드킥",
      role: "백그라운드 작업",
      state: "healthy",
      detail: "알림과 저장소 동기화, 비동기 작업을 처리합니다. 워커 파드 12개.",
      cpu: 58,
      memory: 72,
    },
    {
      id: "storage",
      name: "기탈리",
      role: "저장소 서비스",
      state: "degraded",
      detail:
        "샤드 02의 볼륨 사용률이 91%입니다. 대형 저장소와 보관 정책을 점검하세요.",
      cpu: 78,
      memory: 86,
      latencyMs: 64,
    },
    {
      id: "database",
      name: "포스트그레스",
      role: "주 노드·복제본",
      state: "healthy",
      detail: "메타데이터와 사용자 권한을 저장합니다. 주 노드 1대, 복제본 2대.",
      cpu: 44,
      memory: 76,
      latencyMs: 1.4,
    },
    {
      id: "runner",
      name: "러너 그룹",
      role: "빌드·작업 실행",
      state: "degraded",
      detail:
        "등록 12대 중 온라인 7대입니다. 오프라인 러너와 대기열을 점검하세요.",
      cpu: 82,
      memory: 88,
    },
    {
      id: "cache",
      name: "레디스",
      role: "캐시·세션",
      state: "healthy",
      detail: "세션과 작업 큐를 보관하는 캐시 계층입니다. 고가용성 노드 3개.",
      cpu: 28,
      memory: 52,
      latencyMs: 0.6,
    },
  ],
  connections: [
    {
      from: "edge",
      to: "ingress",
    },
    {
      from: "ingress",
      to: "gitlab",
    },
    {
      from: "ingress",
      to: "queue",
    },
    {
      from: "gitlab",
      to: "storage",
    },
    {
      from: "gitlab",
      to: "database",
    },
    {
      from: "gitlab",
      to: "cache",
    },
    {
      from: "queue",
      to: "runner",
    },
    {
      from: "queue",
      to: "cache",
    },
  ],
  alerts: [
    {
      id: "incident",
      title: "결제 서비스 응답 오류",
      detail: "장애 대응 중 · 복구 진행 상황을 확인하세요.",
      severity: "critical",
    },
    {
      id: "storage",
      title: "저장소 여유 공간 9%",
      detail: "기탈리 볼륨의 용량 점검이 필요합니다.",
      severity: "warning",
    },
    {
      id: "cost",
      title: "사용하지 않는 자원 정리",
      detail: "월 2,840달러 절감 가능 · 예시 추정치",
      severity: "info",
    },
  ],
};

export function summarizeDashboard(snapshot: DashboardSnapshot, range: number) {
  const last = snapshot.daily.at(-1)!;
  const end = Date.parse(last.date);
  const days = snapshot.daily.filter(
    (d) => Date.parse(d.date) > end - range * 86400000,
  );
  const prior = snapshot.daily.filter(
    (d) =>
      Date.parse(d.date) <= end - range * 86400000 &&
      Date.parse(d.date) > end - range * 2 * 86400000,
  );
  const sum = (rows: typeof days, key: "success" | "failed" | "canceled") =>
    rows.reduce((n, d) => n + d[key], 0);
  const rateFor = (rows: typeof days) => {
    const s = sum(rows, "success"),
      f = sum(rows, "failed");
    return s + f ? (s / (s + f)) * 100 : null;
  };
  const rate = rateFor(days),
    previousRate = rateFor(prior);
  return {
    days,
    prior,
    rate,
    delta:
      rate === null ||
      previousRate === null ||
      prior.length !== range ||
      days.length !== range
        ? null
        : rate - previousRate,
    total: sum(days, "success") + sum(days, "failed") + sum(days, "canceled"),
    success: sum(days, "success"),
    failed: sum(days, "failed"),
  };
}
export function snapshotStale(snapshot: DashboardSnapshot, now = Date.now()) {
  return (
    snapshot.source === "live" &&
    (now - Date.parse(snapshot.collectedAt) > 120000 ||
      Date.parse(snapshot.collectedAt) > now + 30000)
  );
}
export function validateDataUrl(value: string) {
  const url = new URL(value);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      ))
  )
    throw new Error("인증 정보가 없는 보안 연결 주소를 입력하세요.");
  return url.href;
}
