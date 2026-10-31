"use client";
import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  GitBranch,
  Search,
  X,
} from "lucide-react";
import { useDashboard } from "@/components/overview/dashboard-provider";
import {
  deliveryStats,
  filterPipelines,
  formatDuration,
  pipelineName,
  type RelayPipeline,
} from "@/lib/relay";
import { DeliveryChart } from "./delivery-chart";
import {
  PageTitle,
  PipelineInspector,
  StatusIcon,
  downloadText,
  SectionLabel,
} from "./primitives";
export function DeliveryView() {
  const { data } = useDashboard();
  const [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<RelayPipeline | null>(null),
    [page, setPage] = useState(0);
  const pipelines = data?.pipelines ?? [],
    stats = deliveryStats(pipelines),
    filtered = filterPipelines(pipelines, query, filter),
    size = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / size)),
    activePage = Math.min(page, pageCount - 1),
    rows = filtered.slice(activePage * size, (activePage + 1) * size);
  return (
    <div className="r7-page">
      <PageTitle
        eyebrow="DELIVERY / ENGINEERING MOMENTUM"
        title="Keep good changes moving."
        description="완료된 실행의 추이부터 지금 진행 중인 파이프라인까지."
        actions={
          <button
            className="r7-button"
            onClick={() =>
              downloadText(
                JSON.stringify(
                  {
                    source: data?.source ?? "unknown",
                    collectedAt: data?.collectedAt,
                    pipelines: filtered,
                  },
                  null,
                  2,
                ),
                "relay-pipelines.json",
                "application/json",
              )
            }
          >
            <ArrowDownToLine size={14} />
            Export runs
          </button>
        }
      />
      <div className="r7-delivery-kpis">
        <div>
          <SectionLabel>RUNNING NOW</SectionLabel>
          <strong>
            {stats.running}
            <span className="r7-pulse-small" />
          </strong>
          <p>수집 시점 기준</p>
        </div>
        <div>
          <SectionLabel>MEDIAN DURATION</SectionLabel>
          <strong>{formatDuration(stats.median)}</strong>
          <p>수집된 성공 실행 기준</p>
        </div>
        <div>
          <SectionLabel>PROJECTS OBSERVED</SectionLabel>
          <strong>
            {stats.projects}
            <small>projects</small>
          </strong>
          <p>실행 목록의 고유 프로젝트</p>
        </div>
        <div>
          <SectionLabel>FAILED RUNS</SectionLabel>
          <strong className="r7-orange">
            {stats.failed}
            <small>runs</small>
          </strong>
          <p>수집된 실행 목록 기준</p>
        </div>
      </div>
      <DeliveryChart expanded />
      <section className="r7-runs-panel">
        <div className="r7-runs-heading">
          <h2>
            Pipeline explorer<span>{pipelines.length}</span>
          </h2>
          <label className="r7-input-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="프로젝트, 브랜치, 실행 번호"
              aria-label="파이프라인 검색"
            />
            {query && (
              <button aria-label="검색 지우기" onClick={() => setQuery("")}>
                <X size={14} />
              </button>
            )}
          </label>
        </div>
        <div
          className="r7-filter-tabs"
          role="group"
          aria-label="실행 상태 필터"
        >
          {["all", "running", "success", "failed", "pending", "canceled"].map(
            (f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => {
                  setFilter(f);
                  setPage(0);
                }}
              >
                {f === "all"
                  ? "All runs"
                  : pipelineName[f as RelayPipeline["status"]]}
                <span>
                  {f === "all"
                    ? pipelines.length
                    : pipelines.filter((p) => p.status === f).length}
                </span>
              </button>
            ),
          )}
        </div>
        <div className="r7-runs-table">
          <div className="r7-runs-table-header">
            <span>PIPELINE / PROJECT</span>
            <span>STATUS</span>
            <span>BRANCH</span>
            <span>DURATION</span>
          </div>
          {rows.map((p) => (
            <button
              className="r7-run-row"
              key={`${p.project}-${p.id}`}
              onClick={() => setSelected(p)}
            >
              <span>
                <StatusIcon status={p.status} />
                <span>
                  <strong>{p.project}</strong>
                  <span>#{p.id}</span>
                </span>
              </span>
              <span className={`r7-run-status ${p.status}`}>
                <i />
                {pipelineName[p.status]}
              </span>
              <span className="r7-run-branch">
                <GitBranch size={13} />
                {p.ref}
              </span>
              <span className="r7-run-duration">
                {formatDuration(p.durationSeconds)}
                <ArrowUpRight size={14} />
              </span>
            </button>
          ))}
          {!rows.length && (
            <div className="r7-empty">
              <Search size={30} />
              <h3>No matching runs.</h3>
              <p>검색어나 상태 필터를 바꿔보세요.</p>
            </div>
          )}
        </div>
        <div className="r7-pagination">
          <span>
            {filtered.length ? activePage * size + 1 : 0}–
            {Math.min((activePage + 1) * size, filtered.length)} of{" "}
            {filtered.length} runs
          </span>
          <div>
            <button
              onClick={() => setPage(activePage - 1)}
              disabled={activePage === 0}
            >
              Previous
            </button>
            <span>
              {activePage + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage(activePage + 1)}
              disabled={activePage >= pageCount - 1}
            >
              Next
            </button>
          </div>
        </div>
      </section>
      <PipelineInspector
        pipeline={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
