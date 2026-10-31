import type { DashboardSnapshot } from "./dashboard";
export type RelayService = DashboardSnapshot["services"][number];
export type RelayPipeline = DashboardSnapshot["pipelines"][number];
export const stateName = {
  healthy: "정상",
  degraded: "주의",
  down: "장애",
  unknown: "미확인",
};
export const pipelineName = {
  success: "성공",
  failed: "실패",
  running: "실행 중",
  pending: "대기",
  canceled: "취소",
};
export function formatDuration(value: number | null) {
  if (value === null) return "—";
  const s = Math.round(value);
  return s < 60 ? `${s}초` : `${Math.floor(s / 60)}분 ${s % 60}초`;
}
export function relativeTime(iso: string | null, reference: string) {
  if (!iso) return "미수집";
  const minutes = Math.max(
    0,
    Math.floor((Date.parse(reference) - Date.parse(iso)) / 60000),
  );
  return minutes < 1
    ? "방금"
    : minutes < 60
      ? `${minutes}분 전`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)}시간 전`
        : `${Math.floor(minutes / 1440)}일 전`;
}
export function deliveryStats(pipelines: RelayPipeline[]) {
  const durations = pipelines
    .filter((p) => p.status === "success" && p.durationSeconds !== null)
    .map((p) => p.durationSeconds!)
    .sort((a, b) => a - b);
  const mid = Math.floor(durations.length / 2);
  return {
    running: pipelines.filter((p) => p.status === "running").length,
    failed: pipelines.filter((p) => p.status === "failed").length,
    median: !durations.length
      ? null
      : durations.length % 2
        ? durations[mid]
        : (durations[mid - 1] + durations[mid]) / 2,
    projects: new Set(pipelines.map((p) => p.project)).size,
  };
}
export function filterPipelines(
  pipelines: RelayPipeline[],
  query: string,
  status: string,
) {
  const term = query.trim().toLocaleLowerCase();
  return pipelines.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      (!term ||
        `${p.project} ${p.ref} ${p.id}`.toLocaleLowerCase().includes(term)),
  );
}
export function servicePositions(services: RelayService[]) {
  if (services.length <= 8) {
    const positions = [
      [90, 182],
      [282, 182],
      [486, 104],
      [486, 264],
      [700, 86],
      [700, 182],
      [700, 294],
      [282, 324],
    ];
    return services.map((service, i) => ({
      ...service,
      x: positions[i][0],
      y: positions[i][1],
    }));
  }
  return services.map((service, i) => ({
    ...service,
    x: 100 + (i % 4) * 200,
    y: 65 + Math.floor(i / 4) * 104,
  }));
}
export function runbookFor(severity: string) {
  return severity === "critical"
    ? [
        "서비스의 최근 오류 로그와 영향 범위를 확인합니다.",
        "직전 배포 시각과 오류 시작 시각을 비교합니다.",
        "담당자에게 대응 현황과 다음 확인 시점을 공유합니다.",
      ]
    : severity === "warning"
      ? [
          "변화 추이와 임계치 초과 시간을 확인합니다.",
          "관련 리소스의 현재 사용량과 여유 용량을 비교합니다.",
          "조치 범위와 예상 영향을 검토한 뒤 변경 계획을 세웁니다.",
        ]
      : [
          "제안의 근거와 실제 사용 현황을 확인합니다.",
          "비용 또는 성능 개선 효과를 검토합니다.",
          "담당자와 실행 시점을 정하고 결과를 기록합니다.",
        ];
}
export function signalReport(data: DashboardSnapshot, ids: string[]) {
  return [
    `# ${data.workspace} · 운영 신호`,
    `수집 시각: ${data.collectedAt}`,
    `데이터: ${data.source === "demo" ? "예시" : "실제 수집"}`,
    "",
    ...data.alerts.map(
      (a) => `- [${ids.includes(a.id) ? "x" : " "}] ${a.title}\n  ${a.detail}`,
    ),
  ].join("\n");
}

export function prioritizeSignals(alerts: DashboardSnapshot["alerts"]) {
  const rank = { critical: 0, warning: 1, info: 2 };
  return [...alerts].sort((a, b) => rank[a.severity] - rank[b.severity]);
}
