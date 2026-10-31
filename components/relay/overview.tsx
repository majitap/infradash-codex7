"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  GitBranch,
  Radio,
  Server,
} from "lucide-react";
import { useDashboard } from "@/components/overview/dashboard-provider";
import { useRelay } from "./context";
import { DataConnect } from "@/components/overview/data-connect";
import { summarizeDashboard } from "@/lib/dashboard";
import { formatDuration, relativeTime, type RelayPipeline } from "@/lib/relay";
import { SystemMap } from "./system-map";
import { DeliveryChart } from "./delivery-chart";
import { FocusQueue } from "./signals";
import { PipelineInspector, SectionLabel, StatusIcon } from "./primitives";
export function OverviewView() {
  const { data, source } = useDashboard();
  const { acknowledged } = useRelay();
  const [selected, setSelected] = useState<RelayPipeline | null>(null);
  if (!data)
    return (
      <div className="r7-empty r7-empty-page">
        <Radio size={48} />
        <SectionLabel>AWAITING YOUR SIGNAL</SectionLabel>
        <h1>Connect the dots.</h1>
        <p>수집 파일이나 인증된 수집 주소를 연결해 운영 공간을 시작하세요.</p>
        <DataConnect />
      </div>
    );
  const summary = summarizeDashboard(data, 7),
    open = data.alerts.filter((a) => !acknowledged.includes(a.id)).length;
  const totalRunners =
    data.runners.online + data.runners.offline + data.runners.paused;
  const date = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(data.collectedAt));
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(data.collectedAt));
  return (
    <div className="r7-overview">
      <div className="r7-overview-intro">
        <div>
          <SectionLabel>
            <span className="r7-intro-tick" />
            INFRASTRUCTURE, IN PERSPECTIVE
          </SectionLabel>
          <h1>
            A clear view.
            <br />
            <span>A confident next move.</span>
          </h1>
          <p>복잡한 시스템 뒤에서, 다음 판단을 명확하게.</p>
        </div>
        <div className="r7-intro-meta">
          <div className="r7-orbit-mark" aria-hidden="true">
            <span />
            <span />
            <i />
          </div>
          <span className="r7-snapshot-date">{date}</span>
          <span>
            {time} KST <i />{" "}
            {data.source === "demo"
              ? "DEMO SNAPSHOT"
              : source === "file"
                ? "IMPORTED SNAPSHOT"
                : "LATEST COLLECTION"}
          </span>
        </div>
      </div>
      <div className="r7-overview-metrics">
        <Link href="/pipelines">
          <span>
            PIPELINE SUCCESS
            <ArrowUpRight size={13} />
          </span>
          <strong>
            {summary.rate === null ? "—" : summary.rate.toFixed(1)}
            <small>%</small>
          </strong>
          <p>
            <span
              className={
                summary.delta !== null && summary.delta < 0
                  ? "negative"
                  : "positive"
              }
            >
              {summary.delta === null
                ? "—"
                : `${summary.delta > 0 ? "+" : ""}${summary.delta.toFixed(1)}pp`}
            </span>
            vs. previous 7 days
          </p>
          <div className="r7-mini-ticks" aria-hidden="true">
            {summary.days.map((d) => (
              <i
                key={d.date}
                style={{
                  height:
                    10 + (d.success / Math.max(1, d.success + d.failed)) * 16,
                }}
              />
            ))}
          </div>
        </Link>
        <Link href="/pipelines">
          <span>
            COMPLETED RUNS
            <ArrowUpRight size={13} />
          </span>
          <strong>
            {summary.total.toLocaleString("en-US")}
            <small>/ 7d</small>
          </strong>
          <p>
            {summary.failed} failed <span className="r7-tiny-separator" />{" "}
            {summary.success} passed
          </p>
          <div className="r7-metric-bars" aria-hidden="true">
            {summary.days.map((d) => (
              <i
                key={d.date}
                style={{
                  height:
                    6 +
                    (d.success /
                      Math.max(1, ...summary.days.map((x) => x.success))) *
                      25,
                }}
              />
            ))}
          </div>
        </Link>
        <Link href="/topology">
          <span>
            RUNNERS ONLINE
            <ArrowUpRight size={13} />
          </span>
          <strong>
            {data.runners.online}
            <small>/ {totalRunners}</small>
          </strong>
          <p>
            <i className="r7-state-dot healthy" />
            {data.queueSeconds === null
              ? "Queue time unavailable"
              : `${data.queueSeconds}s average queue`}
          </p>
          <Server className="r7-metric-watermark" size={30} />
        </Link>
        <Link href="/incidents" className="r7-signal-metric">
          <span>
            OPEN SIGNALS
            <ArrowUpRight size={13} />
          </span>
          <strong>
            {String(open).padStart(2, "0")}
            <small>to review</small>
          </strong>
          <p>
            <i className="r7-state-dot degraded" />
            {open
              ? "Your next move starts here"
              : "All observed signals reviewed"}
          </p>
          <Radio className="r7-metric-watermark" size={30} />
        </Link>
      </div>
      <div className="r7-landscape-grid">
        <SystemMap />
        <FocusQueue />
      </div>
      <div className="r7-delivery-grid">
        <DeliveryChart />
        <section className="r7-recent">
          <div className="r7-panel-header">
            <div>
              <SectionLabel index="03">LATEST RUNS</SectionLabel>
              <h2>From commit to change.</h2>
            </div>
            <Link
              href="/pipelines"
              aria-label="모든 실행 보기"
              className="r7-icon-link"
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="r7-recent-list">
            {data.pipelines.slice(0, 5).map((p) => (
              <button
                key={`${p.project}-${p.id}`}
                onClick={() => setSelected(p)}
                aria-label={`${p.project} 실행 상세`}
              >
                <StatusIcon status={p.status} />
                <span>
                  <strong>{p.project}</strong>
                  <span>
                    <GitBranch size={11} />
                    {p.ref}
                    <i />#{p.id}
                  </span>
                </span>
                <span className="r7-recent-time">
                  {formatDuration(p.durationSeconds)}
                  <small>{relativeTime(p.startedAt, data.collectedAt)}</small>
                </span>
              </button>
            ))}
            {!data.pipelines.length && (
              <div className="r7-empty">
                <GitBranch size={28} />
                <p>수집된 실행 기록이 없습니다.</p>
              </div>
            )}
          </div>
          <Link href="/pipelines" className="r7-recent-footer">
            Explore delivery
            <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <CapacityStrip />
      <div className="r7-bottom-message">
        <span>
          <span className="r7-small-cross">✳</span>Great infrastructure feels
          invisible.
          <br />
          <strong>Great observability makes it clear.</strong>
        </span>
        <DataConnect compact />
      </div>
      <PipelineInspector
        pipeline={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
function CapacityStrip() {
  const { data } = useDashboard();
  if (!data) return null;
  const { license, runners } = data;
  const capacity = runners.capacity,
    busy = runners.busy,
    utilization =
      capacity && busy !== null ? Math.round((busy / capacity) * 100) : null;
  const ratio =
    license && license.total > 0
      ? Math.min(100, (license.used / license.total) * 100)
      : 0;
  return (
    <section className="r7-capacity-strip">
      <div className="r7-capacity-heading">
        <SectionLabel index="04">HEADROOM</SectionLabel>
        <h2>Room to keep moving.</h2>
        <p>다음 실행을 위한 여유를 확인하세요.</p>
      </div>
      <div className="r7-slot-capacity">
        <div>
          <span>RUNNER SLOTS</span>
          <strong>
            {busy ?? "—"}
            <small>/ {capacity ?? "—"}</small>
          </strong>
          <span>
            {utilization === null ? "Unobserved" : `${utilization}% in use`}
          </span>
        </div>
        <div
          className="r7-slots"
          role="img"
          aria-label={
            capacity === null
              ? "실행 용량 미수집"
              : `동시 실행 슬롯 ${capacity}개 중 ${busy ?? "미수집"}개 사용`
          }
        >
          {Array.from({ length: Math.min(capacity ?? 24, 60) }, (_, i) => (
            <i
              key={i}
              className={
                capacity &&
                busy !== null &&
                i / Math.min(capacity, 60) < busy / capacity
                  ? "occupied"
                  : ""
              }
            />
          ))}
        </div>
      </div>
      <div className="r7-license-capacity">
        <svg viewBox="0 0 56 56" aria-hidden="true">
          <circle cx="28" cy="28" r="22" />
          <circle
            cx="28"
            cy="28"
            r="22"
            strokeDasharray={`${(ratio / 100) * 138.23} 138.23`}
            transform="rotate(-90 28 28)"
          />
          <path d="m22 28 4 4 8-8" />
        </svg>
        <div>
          <span>LICENSE HEADROOM</span>
          <strong>
            {license ? Math.max(0, license.total - license.used) : "—"}
            <small>seats available</small>
          </strong>
          <p>
            {license
              ? `${license.used.toLocaleString()} / ${license.total.toLocaleString()} seats assigned`
              : "라이선스 수량 미수집"}
          </p>
        </div>
      </div>
    </section>
  );
}
