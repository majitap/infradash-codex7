"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Box,
  ChevronRight,
  Cloud,
  Database,
  GitBranch,
  HardDrive,
  Layers,
  List,
  Network,
  Pause,
  Play,
  Server,
  ShieldCheck,
} from "lucide-react";
import { useDashboard } from "@/components/overview/dashboard-provider";
import { servicePositions, stateName, type RelayService } from "@/lib/relay";
import { SectionLabel } from "./primitives";
const serviceIcons: Record<string, typeof Box> = {
  edge: Cloud,
  ingress: ShieldCheck,
  gitlab: GitBranch,
  queue: Layers,
  storage: HardDrive,
  database: Database,
  runner: Server,
  cache: Database,
};
export function SystemMap({ expanded = false }: { expanded?: boolean }) {
  const { data } = useDashboard();
  const [selection, setSelection] = useState<string | null>(null),
    [view, setView] = useState<"map" | "list">("map"),
    [motion, setMotion] = useState(true),
    [attention, setAttention] = useState(false);
  const services = data?.services ?? [];
  const selected =
    services.find((s) => s.id === selection) ??
    services.find((s) => s.id === "gitlab") ??
    services[0];
  const points = servicePositions(services);
  const graphHeight =
    services.length > 8 ? Math.ceil(services.length / 4) * 104 + 48 : 400;
  const nodes = points.filter((n) => !attention || n.state !== "healthy");
  const healthy = services.filter((s) => s.state === "healthy").length;
  const connections = data?.connections ?? [];
  return (
    <section
      className={`r7-map-panel ${expanded ? "expanded" : ""}`}
      aria-labelledby="runtime-map-title"
    >
      <div className="r7-panel-header">
        <div>
          <SectionLabel index="01">시스템 구성</SectionLabel>
          <h2 id="runtime-map-title">
            연결로 읽는 시스템<span className="r7-heading-dot">.</span>
          </h2>
        </div>
        <div
          className="r7-map-view-switch"
          role="group"
          aria-label="시스템 보기"
        >
          <button
            aria-label="구성도 보기"
            aria-pressed={view === "map"}
            onClick={() => setView("map")}
          >
            <Network size={16} />
          </button>
          <button
            aria-label="목록 보기"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <List size={16} />
          </button>
        </div>
      </div>
      <div className="r7-map-toolbar">
        <div className="r7-map-scope">
          <span className="r7-live-dot" />
          <span>
            {data?.source === "demo" ? "예시 구성도" : "수집된 구성 요소"}
          </span>
          <span className="r7-toolbar-separator" />
          <span>{services.length} 개 구성 요소</span>
        </div>
        <button
          className={`r7-map-filter ${attention ? "selected" : ""}`}
          onClick={() => setAttention(!attention)}
          aria-pressed={attention}
        >
          <CircleIndicator state="degraded" />
          {attention ? "전체 보기" : "주의 항목만"}
        </button>
      </div>
      {services.length ? (
        <>
          {view === "map" ? (
            <div className="r7-map-scroll">
              <div
                className={`r7-graph ${motion ? "animated" : ""}`}
                style={{ height: graphHeight }}
              >
                <div className="r7-graph-ambient" />
                {data?.source === "demo" && (
                  <div className="r7-map-coordinates">
                    <span>↗ 외부 연결</span>
                    <span>서비스 / 실행</span>
                    <span>데이터 / 작업</span>
                  </div>
                )}
                <svg
                  className="r7-graph-lines"
                  viewBox={`0 0 800 ${graphHeight}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="relay-wire">
                      <stop stopColor="#688345" stopOpacity=".3" />
                      <stop offset=".5" stopColor="#d7f59e" />
                      <stop offset="1" stopColor="#688345" stopOpacity=".3" />
                    </linearGradient>
                  </defs>
                  {connections.map((edge, i) => {
                    const from = nodes.find((n) => n.id === edge.from),
                      to = nodes.find((n) => n.id === edge.to);
                    if (!from || !to) return null;
                    const reverse = to.x < from.x;
                    const x1 = from.x + (reverse ? -62 : 62),
                      x2 = to.x + (reverse ? 62 : -62),
                      bend = (x1 + x2) / 2;
                    const d = `M${x1} ${from.y} C${bend} ${from.y},${bend} ${to.y},${x2} ${to.y}`;
                    const active =
                      selection === null ||
                      edge.from === selected?.id ||
                      edge.to === selected?.id;
                    return (
                      <g
                        key={`${edge.from}-${edge.to}-${i}`}
                        className={active ? "active-wire" : "quiet-wire"}
                      >
                        <path d={d} className="r7-wire" />
                        <path
                          d={d}
                          className="r7-wire-pulse"
                          style={{ animationDelay: `${i * -0.7}s` }}
                        />
                      </g>
                    );
                  })}
                </svg>
                {nodes.map((n) => {
                  const Icon = serviceIcons[n.id] ?? Box;
                  return (
                    <button
                      key={n.id}
                      className={`r7-map-node ${n.state} ${n.id === selected?.id ? "selected" : ""}`}
                      style={{ left: `${n.x / 8}%`, top: n.y }}
                      onClick={() => setSelection(n.id)}
                      aria-pressed={selected?.id === n.id}
                      aria-label={`${n.name}, ${stateName[n.state]}`}
                    >
                      <span className="r7-node-top">
                        <Icon size={19} />
                        <CircleIndicator state={n.state} />
                      </span>
                      <strong>{n.name}</strong>
                      <span>{n.role}</span>
                    </button>
                  );
                })}
                {!nodes.length && (
                  <div className="r7-graph-empty">
                    확인이 필요한 구성 요소가 없습니다.
                  </div>
                )}
                <span className="r7-graph-note">
                  {connections.length
                    ? "등록된 연결 관계"
                    : "연결 관계 미수집 · 구성 요소만 표시"}
                </span>
                <button
                  className="r7-motion-control"
                  aria-label={
                    motion ? "흐름 애니메이션 일시정지" : "흐름 애니메이션 재생"
                  }
                  onClick={() => setMotion(!motion)}
                >
                  {motion ? <Pause size={12} /> : <Play size={12} />}흐름
                </button>
              </div>
            </div>
          ) : (
            <div className="r7-service-list">
              {nodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelection(n.id)}
                  className={selected?.id === n.id ? "selected" : ""}
                >
                  <CircleIndicator state={n.state} />
                  <strong>{n.name}</strong>
                  <span>{n.role}</span>
                  <span>{stateName[n.state]}</span>
                  <ChevronRight size={14} />
                </button>
              ))}
              {!nodes.length && <p>확인이 필요한 구성 요소가 없습니다.</p>}
            </div>
          )}
          {selected && <ServiceDetail service={selected} expanded={expanded} />}
        </>
      ) : (
        <div className="r7-empty">
          <Network size={36} />
          <h3>수집된 구성 요소가 없습니다.</h3>
          <p>수집 파일에 구성 요소를 추가하면 시스템 맵이 나타납니다.</p>
        </div>
      )}
      <div className="r7-map-footer">
        <span>
          <CircleIndicator state="healthy" />
          {healthy} 정상
          <span className="r7-footer-divider" />
          <CircleIndicator state="degraded" />
          {services.length - healthy} 확인 필요
        </span>
        {!expanded && (
          <Link href="/topology">
            시스템 자세히
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
    </section>
  );
}
export function CircleIndicator({ state }: { state: string }) {
  return <i className={`r7-state-dot ${state}`} aria-hidden="true" />;
}
function ServiceDetail({
  service,
  expanded,
}: {
  service: RelayService;
  expanded: boolean;
}) {
  return (
    <div
      className={`r7-service-detail ${expanded ? "full" : ""}`}
      aria-live="polite"
    >
      <div className="r7-selected-service">
        <span className={`r7-service-status ${service.state}`}>
          <CircleIndicator state={service.state} />
          {stateName[service.state]}
        </span>
        <strong>{service.name}</strong>
        <p>{service.detail || "상세 정보가 수집되지 않았습니다."}</p>
      </div>
      <div className="r7-service-numbers">
        {[
          { label: "프로세서", value: service.cpu, unit: "%" },
          { label: "메모리", value: service.memory, unit: "%" },
          { label: "응답 시간", value: service.latencyMs, unit: "ms" },
        ].map((m) => (
          <div key={m.label}>
            <span>{m.label}</span>
            <strong>
              {m.value ?? "—"}
              {m.value !== undefined && (
                <small>{m.unit === "ms" ? "밀리초" : m.unit}</small>
              )}
            </strong>
            {m.unit === "%" && (
              <i>
                <b style={{ width: `${m.value ?? 0}%` }} />
              </i>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
