import { dashboardSchema, type DashboardSnapshot } from "../../lib/dashboard";

type ApiPipeline = {
  id: number;
  project_id: number;
  status: string;
  ref: string;
  created_at: string;
};
type ApiRunner = {
  id: number;
  paused: boolean;
  status: string;
  description?: string;
  name?: string | null;
};
export type DashboardCollectorConfig = {
  baseUrl: string;
  token: string;
  projectIds: string[];
  workspace: string;
  licenseToken?: string;
};
const kstDate = (iso: string) =>
  new Date(Date.parse(iso) + 9 * 3600000).toISOString().slice(0, 10);
/** Only explicitly configured projects are read; no writes or credential-bearing redirects. */
export async function collectDashboard(
  config: DashboardCollectorConfig,
  fetcher: typeof fetch = fetch,
  now = new Date(),
): Promise<DashboardSnapshot> {
  const base = new URL(config.baseUrl);
  if (
    base.protocol !== "https:" ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    !config.token ||
    !config.projectIds.length ||
    config.projectIds.length > 50
  )
    throw new Error("보안 연결 주소, 읽기 토큰, 조회할 프로젝트를 설정하세요.");
  const root = base.href.replace(/\/$/, "") + "/api/v4/";
  async function get<T>(
    path: string,
    token = config.token,
  ): Promise<{ value: T; next: string | null }> {
    const response = await fetcher(root + path, {
      method: "GET",
      headers: { "PRIVATE-TOKEN": token, Accept: "application/json" },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(
        `깃랩 조회 실패 (${response.status}). 주소, 조회 권한, 서버 응답을 확인하세요.`,
      );
    return {
      value: (await response.json()) as T,
      next: response.headers.get("x-next-page"),
    };
  }
  async function list<T>(path: string): Promise<T[]> {
    const items: T[] = [];
    for (let page = 1; page <= 100; page++) {
      const { value, next } = await get<T[]>(
        `${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
      );
      if (!Array.isArray(value))
        throw new Error("목록 응답 형식이 올바르지 않습니다.");
      items.push(...value);
      if (next === "" || (next === null && value.length < 100)) return items;
    }
    throw new Error(
      "조회 한도를 초과했습니다. 프로젝트 범위를 줄여주세요. 일부 데이터로 결과를 만들지 않습니다.",
    );
  }
  const today = kstDate(now.toISOString());
  const start = new Date(`${today}T00:00:00+09:00`);
  start.setUTCDate(start.getUTCDate() - 59);
  const daily = Array.from({ length: 60 }, (_, i) => ({
    date: kstDate(new Date(start.getTime() + i * 86400000).toISOString()),
    success: 0,
    failed: 0,
    canceled: 0,
  }));
  const days = new Map(daily.map((d) => [d.date, d]));
  const names = new Map<number, string>(),
    allPipelines: ApiPipeline[] = [],
    runnerMap = new Map<number, ApiRunner>();
  for (const projectId of [...new Set(config.projectIds)]) {
    const project = (
      await get<{ id: number; name: string }>(
        `projects/${encodeURIComponent(projectId)}`,
      )
    ).value;
    names.set(project.id, project.name);
    const pipes = await list<ApiPipeline>(
      `projects/${project.id}/pipelines?created_after=${encodeURIComponent(start.toISOString())}&order_by=id&sort=desc`,
    );
    for (const p of pipes) {
      const d = days.get(kstDate(p.created_at));
      if (!d) continue;
      if (
        p.status === "success" ||
        p.status === "failed" ||
        p.status === "canceled"
      )
        d[p.status]++;
      allPipelines.push({ ...p, project_id: project.id });
    }
    for (const runner of await list<ApiRunner>(
      `projects/${project.id}/runners`,
    ))
      runnerMap.set(runner.id, runner);
  }
  allPipelines.sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );
  const pipelines: DashboardSnapshot["pipelines"] = [];
  for (const p of allPipelines
    .filter((p) =>
      ["success", "failed", "running", "pending", "canceled"].includes(
        p.status,
      ),
    )
    .slice(0, 30)) {
    const detail = (
      await get<{ duration: number | null; started_at: string | null }>(
        `projects/${p.project_id}/pipelines/${p.id}`,
      )
    ).value;
    pipelines.push({
      id: p.id,
      project: names.get(p.project_id)!,
      ref: p.ref,
      status: p.status as DashboardSnapshot["pipelines"][number]["status"],
      durationSeconds: detail.duration ?? null,
      startedAt: detail.started_at ?? null,
    });
  }
  const runners = {
    online: 0,
    offline: 0,
    paused: 0,
    capacity: null,
    busy: null,
  };
  for (const runner of runnerMap.values()) {
    if (runner.paused) runners.paused++;
    else if (runner.status === "online") runners.online++;
    else runners.offline++;
  }
  let license: DashboardSnapshot["license"] = null;
  if (config.licenseToken) {
    const value = (
      await get<{ user_limit: number; active_users: number }>(
        "license",
        config.licenseToken,
      )
    ).value;
    license = { used: value.active_users, total: value.user_limit };
  }
  return dashboardSchema.parse({
    schemaVersion: 1,
    source: "live",
    collectedAt: now.toISOString(),
    workspace: config.workspace,
    license,
    health: "unknown",
    daily,
    runners,
    runnerDetails: [...runnerMap.values()].map((r) => ({
      id: r.id,
      name: r.description || r.name || `러너 ${r.id}`,
      description: r.description || "",
      status: r.paused
        ? "paused"
        : r.status === "online"
          ? "online"
          : "offline",
    })),
    queueSeconds: null,
    pipelines,
    services: [],
    alerts: [],
  });
}
