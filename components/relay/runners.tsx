"use client";
import { useState } from "react";
import {
  ArrowUpRight,
  Cpu,
  Search,
  Server,
  ShieldCheck,
  X,
} from "lucide-react";
import { useDashboard } from "@/components/overview/dashboard-provider";
import {
  PageTitle,
  SectionLabel,
  ExportButton,
  downloadText,
} from "./primitives";
import { relativeTime } from "@/lib/relay";
import type { RunnerDetail } from "@/lib/dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const states = {
  online: "온라인",
  offline: "오프라인",
  paused: "일시중지",
  unknown: "미확인",
};
const executors: Record<string, string> = {
  docker: "도커",
  kubernetes: "쿠버네티스",
  shell: "셸",
  "docker-autoscaler": "도커 자동 확장",
};
const show = (value: number | null | undefined, unit = "") =>
  value == null ? "—" : `${value.toLocaleString("ko-KR")}${unit}`;
function Meter({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="r7-runner-meter">
      <span>{label}</span>
      <i>
        <b
          style={{ width: `${value ?? 0}%` }}
          className={value !== null && value >= 85 ? "warning" : ""}
        />
      </i>
      <strong>{show(value, "%")}</strong>
    </div>
  );
}

export function RunnersView() {
  const { data } = useDashboard();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<RunnerDetail | null>(null);
  const runners = data?.runnerDetails ?? [],
    summary = data?.runners;
  const filtered = runners.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      `${r.name} ${r.description} ${r.tags.join(" ")} ${r.id}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const jobsKnown =
    runners.length > 0 && runners.every((r) => r.jobsLast24h !== null);
  const jobs = jobsKnown
    ? runners.reduce((sum, r) => sum + r.jobsLast24h!, 0)
    : null;
  const daysKnown =
    runners.length > 0 && runners.every((r) => r.jobsLast7d.length === 7);
  const days = daysKnown
    ? Array.from({ length: 7 }, (_, i) =>
        runners.reduce((sum, r) => sum + r.jobsLast7d[i], 0),
      )
    : [];
  const byExecutor = Object.entries(
    runners.reduce<Record<string, number>>((m, r) => {
      if (r.executor) m[r.executor] = (m[r.executor] ?? 0) + 1;
      return m;
    }, {}),
  );
  const total = summary ? summary.online + summary.offline + summary.paused : 0;
  return (
    <div className="r7-page">
      <PageTitle
        eyebrow="러너 / 실행을 만드는 자원"
        title="모든 실행의 출발점을 살펴보세요."
        description="러너의 연결 상태, 실행 용량과 자원 사용량을 한곳에서 확인합니다."
        actions={
          <ExportButton
            onClick={() =>
              downloadText(
                JSON.stringify(
                  {
                    source: data?.source ?? "unknown",
                    collectedAt: data?.collectedAt,
                    runnerDetails: filtered,
                  },
                  null,
                  2,
                ),
                "릴레이-러너.json",
                "application/json",
              )
            }
          >
            러너 내역 저장
          </ExportButton>
        }
      />
      <div className="r7-delivery-kpis">
        <div>
          <SectionLabel>온라인 러너</SectionLabel>
          <strong>
            {summary?.online ?? "—"}
            <small>/ {total}</small>
          </strong>
          <p>
            오프라인 {summary?.offline ?? "—"} · 일시중지{" "}
            {summary?.paused ?? "—"}
          </p>
        </div>
        <div>
          <SectionLabel>동시 실행 용량</SectionLabel>
          <strong>
            {show(summary?.busy)}
            <small>/ {show(summary?.capacity)}</small>
          </strong>
          <p>온라인 러너의 사용·전체 슬롯</p>
        </div>
        <div>
          <SectionLabel>최근 24시간 작업</SectionLabel>
          <strong>
            {show(jobs)}
            <small>건</small>
          </strong>
          <p>{jobsKnown ? "수집된 전체 러너 합계" : "작업 통계 미수집"}</p>
        </div>
        <div>
          <SectionLabel>점검할 러너</SectionLabel>
          <strong className="r7-orange">
            {runners.length
              ? runners.filter((r) => r.status !== "online").length
              : summary
                ? summary.offline + summary.paused
                : "—"}
            <small>대</small>
          </strong>
          <p>오프라인·일시중지·미확인</p>
        </div>
      </div>
      <div className="r7-runner-charts">
        <section className="r7-runner-panel">
          <SectionLabel>최근 7일 작업</SectionLabel>
          <h2>꾸준한 실행의 흐름</h2>
          {daysKnown ? (
            <div
              className="r7-runner-bars"
              role="img"
              aria-label={`최근 7일 작업: ${days.map((n) => `${n}건`).join(", ")}`}
            >
              {days.map((n, i) => (
                <div key={i}>
                  <strong>{show(n)}</strong>
                  <i
                    style={{
                      height: `${Math.max(2, (n / Math.max(1, ...days)) * 100)}px`,
                    }}
                  />
                  <span>{i === 6 ? "최근일" : `${6 - i}일 전`}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="r7-runner-unobserved">
              일별 러너 작업 통계가 수집되지 않았습니다.
            </p>
          )}
        </section>
        <section className="r7-runner-panel">
          <SectionLabel>실행 방식</SectionLabel>
          <h2>작업에 맞는 실행 환경</h2>
          <div className="r7-executors">
            {byExecutor.length ? (
              byExecutor.map(([name, count]) => (
                <div key={name}>
                  <span>{executors[name] ?? name}</span>
                  <i>
                    <b
                      style={{
                        width: `${(count / Math.max(1, runners.length)) * 100}%`,
                      }}
                    />
                  </i>
                  <strong>{count}대</strong>
                </div>
              ))
            ) : (
              <p className="r7-runner-unobserved">
                실행 방식 정보가 수집되지 않았습니다.
              </p>
            )}
          </div>
        </section>
      </div>
      <section className="r7-runs-panel">
        <div className="r7-runs-heading">
          <h2>
            러너 목록<span>{runners.length}</span>
          </h2>
          <label className="r7-input-search">
            <Search size={16} />
            <input
              aria-label="러너 검색"
              placeholder="러너 이름, 태그, 번호"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                aria-label="러너 검색 지우기"
                onClick={() => setQuery("")}
              >
                <X size={14} />
              </button>
            )}
          </label>
        </div>
        <div
          className="r7-filter-tabs"
          role="group"
          aria-label="러너 상태 필터"
        >
          {["all", "online", "offline", "paused", "unknown"].map((state) => (
            <button
              key={state}
              aria-pressed={filter === state}
              onClick={() => setFilter(state)}
            >
              {state === "all" ? "전체" : states[state as keyof typeof states]}
              <span>
                {state === "all"
                  ? runners.length
                  : runners.filter((r) => r.status === state).length}
              </span>
            </button>
          ))}
        </div>
        <div className="r7-runner-table">
          <div className="r7-runner-table-head">
            <span>러너 / 태그</span>
            <span>상태</span>
            <span>실행 환경</span>
            <span>실행 / 용량</span>
            <span>자원 사용률</span>
            <span>최근 접속</span>
          </div>
          {filtered.map((r) => (
            <button
              className="r7-runner-row"
              key={r.id}
              onClick={() => setSelected(r)}
              aria-label={`${r.name} 러너 상세`}
            >
              <span className="r7-runner-identity">
                <Server size={19} />
                <span>
                  <strong>{r.name}</strong>
                  <small>
                    #{r.id} ·{" "}
                    {r.tags.length ? r.tags.join(" · ") : "태그 미수집"}
                  </small>
                </span>
              </span>
              <span className={`r7-runner-status ${r.status}`}>
                <i />
                {states[r.status]}
              </span>
              <span className="r7-runner-environment">
                <strong>
                  {r.executor
                    ? (executors[r.executor] ?? r.executor)
                    : "미수집"}
                </strong>
                <small>버전 {r.version ?? "미수집"}</small>
              </span>
              <span className="r7-runner-slots">
                {show(r.jobsRunning)}
                <small> / {show(r.concurrent)}</small>
              </span>
              <span className="r7-runner-resources">
                <Meter value={r.cpuLoad} label="프로세서" />
                <Meter value={r.memUsed} label="메모리" />
              </span>
              <span className="r7-runner-contact">
                {data
                  ? relativeTime(r.lastContact, data.collectedAt)
                  : "미수집"}
                <ArrowUpRight size={14} />
              </span>
            </button>
          ))}
        </div>
        {!filtered.length && (
          <div className="r7-empty">
            <Server size={32} />
            <h3>
              {runners.length
                ? "조건에 맞는 러너가 없습니다."
                : "러너 상세 정보가 없습니다."}
            </h3>
            <p>
              {runners.length
                ? "검색어나 상태 필터를 바꿔보세요."
                : "수집 결과에 러너 목록을 포함하면 이곳에 표시됩니다."}
            </p>
          </div>
        )}
        <div className="r7-pagination">
          <span>
            전체 {runners.length}대 중 {filtered.length}대 표시
          </span>
          <span>수집 시점 기준</span>
        </div>
      </section>
      <p className="r7-inbox-note">
        <ShieldCheck size={17} />
        러너 정보는 읽기 전용입니다. 재시작·일시중지 같은 운영 변경은 연결된
        관리 환경에서 처리하세요.
      </p>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="r7-dialog r7-runner-dialog">
          <DialogHeader>
            <span className="r7-dialog-symbol">
              <Cpu size={24} />
            </span>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              {selected?.description || "수집된 러너 상세 정보입니다."}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <span className={`r7-runner-status ${selected.status}`}>
                <i />
                {states[selected.status]}
              </span>
              <dl className="r7-detail-grid">
                {[
                  [
                    "실행 방식",
                    selected.executor
                      ? (executors[selected.executor] ?? selected.executor)
                      : "미수집",
                  ],
                  ["러너 버전", selected.version ?? "미수집"],
                  ["운영 체제", selected.os ?? "미수집"],
                  ["아키텍처", selected.arch ?? "미수집"],
                  ["주소", selected.ipAddress ?? "미수집"],
                  [
                    "동시 실행 용량",
                    `${show(selected.jobsRunning)} / ${show(selected.concurrent)}`,
                  ],
                  ["24시간 작업", show(selected.jobsLast24h, "건")],
                  [
                    "최근 접속",
                    selected.lastContact
                      ? new Intl.DateTimeFormat("ko-KR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Asia/Seoul",
                        }).format(new Date(selected.lastContact))
                      : "미수집",
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="r7-runner-detail-meters">
                <Meter label="프로세서" value={selected.cpuLoad} />
                <Meter label="메모리" value={selected.memUsed} />
              </div>
              <div className="r7-runner-tags">
                {selected.tags.length ? (
                  selected.tags.map((t) => <span key={t}>{t}</span>)
                ) : (
                  <span>태그 미수집</span>
                )}
              </div>
              {selected.note && (
                <p className="r7-runner-note">{selected.note}</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
