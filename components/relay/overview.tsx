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
import { useDisplayedLicense } from "./license-data";
export function OverviewView() {
  const { data, source } = useDashboard();
  const { acknowledged } = useRelay();
  const [selected, setSelected] = useState<RelayPipeline | null>(null);
  if (!data)
    return (
      <div className="r7-empty r7-empty-page">
        <Radio size={48} />
        <SectionLabel>데이터 연결 대기</SectionLabel>
        <h1>우리 팀의 흐름을 연결하세요.</h1>
        <p>수집 파일이나 인증된 수집 주소를 연결해 운영 공간을 시작하세요.</p>
        <DataConnect />
      </div>
    );
  const summary = summarizeDashboard(data, 7),
    open = data.alerts.filter((a) => !acknowledged.includes(a.id)).length;
  const totalRunners =
    data.runners.online + data.runners.offline + data.runners.paused;
  const date = new Intl.DateTimeFormat("ko-KR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(data.collectedAt));
  const time = new Intl.DateTimeFormat("ko-KR", {
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
            인프라의 흐름을 한눈에
          </SectionLabel>
          <h1>
            한눈에 읽고,
            <br />
            <span>확신 있게 다음으로.</span>
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
            {time} 한국 시간 <i />{" "}
            {data.source === "demo"
              ? "예시 수집 결과"
              : source === "file"
                ? "가져온 수집 결과"
                : "최근 수집 결과"}
          </span>
        </div>
      </div>
      <div className="r7-overview-metrics">
        <Link href="/pipelines">
          <span>
            파이프라인 성공률
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
                : `${summary.delta > 0 ? "+" : ""}${summary.delta.toFixed(1)}%p`}
            </span>
            이전 7일 대비
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
            완료된 파이프라인
            <ArrowUpRight size={13} />
          </span>
          <strong>
            {summary.total.toLocaleString("en-US")}
            <small>/ 7일</small>
          </strong>
          <p>
            실패 {summary.failed} <span className="r7-tiny-separator" /> 성공{" "}
            {summary.success}
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
        <Link href="/runners">
          <span>
            온라인 러너
            <ArrowUpRight size={13} />
          </span>
          <strong>
            {data.runners.online}
            <small>/ {totalRunners}</small>
          </strong>
          <p>
            <i className="r7-state-dot healthy" />
            {data.queueSeconds === null
              ? "대기 시간 미수집"
              : `${data.queueSeconds}초 평균 대기`}
          </p>
          <Server className="r7-metric-watermark" size={30} />
        </Link>
        <Link href="/incidents" className="r7-signal-metric">
          <span>
            확인할 신호
            <ArrowUpRight size={13} />
          </span>
          <strong>
            {String(open).padStart(2, "0")}
            <small>확인 필요</small>
          </strong>
          <p>
            <i className="r7-state-dot degraded" />
            {open ? "지금 확인할 일을 먼저" : "모든 신호 확인 완료"}
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
              <SectionLabel index="03">최근 실행</SectionLabel>
              <h2>코드에서 변화까지.</h2>
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
            빌드·배포 자세히
            <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <CapacityStrip />
      <div className="r7-bottom-message">
        <span>
          <span className="r7-small-cross">✳</span>좋은 인프라는 조용하게
          움직입니다.
          <br />
          <strong>좋은 관측은 그 흐름을 선명하게 만듭니다.</strong>
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
  const { counts: license } = useDisplayedLicense();
  if (!data) return null;
  const { runners } = data;
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
        <SectionLabel index="04">운영 여유</SectionLabel>
        <h2>다음 실행을 위한 여유.</h2>
        <p>다음 실행을 위한 여유를 확인하세요.</p>
      </div>
      <div className="r7-slot-capacity">
        <div>
          <span>러너 동시 실행</span>
          <strong>
            {busy ?? "—"}
            <small>/ {capacity ?? "—"}</small>
          </strong>
          <span>
            {utilization === null ? "미수집" : `${utilization}% 사용 중`}
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
          <span>라이선스 여유</span>
          <strong>
            {license ? Math.max(0, license.total - license.used) : "—"}
            <small>명 추가 가능</small>
          </strong>
          <p>
            {license
              ? `${license.used.toLocaleString()} / ${license.total.toLocaleString()} 명 사용 중`
              : "라이선스 수량 미수집"}
          </p>
        </div>
      </div>
    </section>
  );
}
