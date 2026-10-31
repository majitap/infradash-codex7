"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronRight,
  CircleCheck,
  CircleDot,
  ClipboardList,
  CornerDownRight,
  Layers,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useDashboard } from "@/components/overview/dashboard-provider";
import { useRelay } from "./context";
import {
  SectionLabel,
  PageTitle,
  ExportButton,
  downloadText,
} from "./primitives";
import { runbookFor, signalReport, prioritizeSignals } from "@/lib/relay";
import type { DashboardSnapshot } from "@/lib/dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
type Signal = DashboardSnapshot["alerts"][number];
export function SignalInspector({
  signal,
  onClose,
}: {
  signal: Signal | null;
  onClose: () => void;
}) {
  const { acknowledged, toggleAcknowledged } = useRelay();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const ack = !!signal && acknowledged.includes(signal.id);
  return (
    <Dialog open={!!signal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="r7-dialog r7-signal-dialog">
        <DialogHeader>
          <span className={`r7-priority ${signal?.severity}`}>
            {signal?.severity === "critical"
              ? "PRIORITY 01 · REVIEW FIRST"
              : signal?.severity === "warning"
                ? "PRIORITY 02 · INVESTIGATE"
                : "OPPORTUNITY · OPTIMIZE"}
          </span>
          <DialogTitle>{signal?.title}</DialogTitle>
          <DialogDescription>{signal?.detail}</DialogDescription>
        </DialogHeader>
        {signal && (
          <>
            <div className="r7-runbook-heading">
              <ClipboardList size={17} />
              <strong>A considered next move</strong>
              <span>확인 가이드</span>
            </div>
            <div className="r7-runbook">
              {runbookFor(signal.severity).map((step, i) => {
                const id = `${signal.id}-${i}`;
                return (
                  <label key={id}>
                    <input
                      type="checkbox"
                      checked={!!checked[id]}
                      onChange={(e) =>
                        setChecked({ ...checked, [id]: e.target.checked })
                      }
                    />
                    <span>
                      <i>{String(i + 1).padStart(2, "0")}</i>
                      {step}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="r7-signal-actions">
              <button
                className={`r7-button ${ack ? "" : "lime"}`}
                onClick={() => toggleAcknowledged(signal.id)}
              >
                {ack ? <RotateCcw size={15} /> : <CheckCheck size={15} />}{" "}
                {ack ? "확인 전으로 되돌리기" : "확인한 신호로 표시"}
              </button>
              <Link href="/logs" className="r7-text-link">
                로그 탐색
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <p className="r7-muted-note">
              확인 표시는 현재 브라우저 세션에서만 유지됩니다. 실제 장애
              해결이나 인프라 변경을 실행하지 않습니다.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
export function FocusQueue() {
  const { data } = useDashboard(),
    { acknowledged } = useRelay();
  const [selected, setSelected] = useState<Signal | null>(null);
  const pending = prioritizeSignals(data?.alerts ?? []).filter(
    (a) => !acknowledged.includes(a.id),
  );
  const first = pending[0];
  return (
    <section className="r7-focus-panel">
      <div className="r7-panel-header">
        <SectionLabel>YOUR NEXT MOVE</SectionLabel>
        <span className="r7-count">{pending.length}</span>
      </div>
      <div className="r7-focus-title">
        <h2>
          Less noise.
          <br />
          <span>More direction.</span>
        </h2>
        <p>지금 집중할 일을 먼저.</p>
      </div>
      {first ? (
        <>
          <button
            className={`r7-primary-signal ${first.severity}`}
            onClick={() => setSelected(first)}
          >
            <span className="r7-priority">
              <i />
              REVIEW FIRST
              <ArrowUpRight size={17} />
            </span>
            <strong>{first.title}</strong>
            <p>{first.detail}</p>
            <span className="r7-signal-cta">
              확인 가이드 열기
              <ArrowRight size={15} />
            </span>
          </button>
          <div className="r7-next-signals">
            {pending.slice(1, 3).map((a, i) => (
              <button key={a.id} onClick={() => setSelected(a)}>
                <span className={`r7-signal-index ${a.severity}`}>
                  0{i + 2}
                </span>
                <div>
                  <strong>{a.title}</strong>
                  <span>
                    {a.severity === "warning" ? "점검 필요" : "개선 기회"}
                  </span>
                </div>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="r7-all-clear">
          <CircleCheck size={32} />
          <strong>A quieter workspace.</strong>
          <p>현재 확인할 신호가 없습니다.</p>
        </div>
      )}
      <Link href="/incidents" className="r7-focus-footer">
        Open signal inbox
        <ArrowUpRight size={14} />
      </Link>
      <SignalInspector signal={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
export function SignalsView() {
  const { data } = useDashboard(),
    { acknowledged, toggleAcknowledged } = useRelay();
  const [filter, setFilter] = useState("open"),
    [selected, setSelected] = useState<Signal | null>(null);
  const alerts = prioritizeSignals(data?.alerts ?? []),
    pending = alerts.filter((a) => !acknowledged.includes(a.id)),
    filtered = alerts.filter(
      (a) =>
        filter === "all" ||
        (filter === "reviewed"
          ? acknowledged.includes(a.id)
          : filter === "open"
            ? !acknowledged.includes(a.id)
            : a.severity === filter && !acknowledged.includes(a.id)),
    );
  return (
    <div className="r7-page">
      <PageTitle
        eyebrow="SIGNALS / DECISION SPACE"
        title="Make room for what matters."
        description="신호를 분류하고, 확인하고, 다음 판단을 이어갑니다."
        actions={
          <ExportButton
            onClick={() =>
              data &&
              downloadText(signalReport(data, acknowledged), "relay-signals.md")
            }
          />
        }
      />
      <div className="r7-signal-summary">
        <div>
          <span>OPEN SIGNALS</span>
          <strong>
            {pending.length}
            <small>to review</small>
          </strong>
        </div>
        <div>
          <span>REQUIRES ATTENTION</span>
          <strong>
            {pending.filter((a) => a.severity === "critical").length}
            <small>priority signals</small>
          </strong>
        </div>
        <div>
          <span>REVIEWED</span>
          <strong>
            {acknowledged.length}
            <small>this session</small>
          </strong>
        </div>
        <div className="r7-inbox-art" aria-hidden="true">
          <span />
          <span />
          <span />
          <Layers size={30} />
        </div>
      </div>
      <section className="r7-inbox-panel">
        <div className="r7-inbox-controls">
          <h2>Signal inbox</h2>
          <div
            className="r7-filter-tabs"
            role="group"
            aria-label="운영 신호 필터"
          >
            {[
              { id: "open", label: "Open" },
              { id: "critical", label: "Priority" },
              { id: "reviewed", label: "Reviewed" },
              { id: "all", label: "All" },
            ].map((f) => (
              <button
                key={f.id}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {filtered.length ? (
          filtered.map((a, i) => (
            <div
              className={`r7-inbox-row ${acknowledged.includes(a.id) ? "reviewed" : ""}`}
              key={a.id}
            >
              <button className="r7-inbox-main" onClick={() => setSelected(a)}>
                <span className={`r7-inbox-severity ${a.severity}`}>
                  <CircleDot size={20} />
                </span>
                <span>
                  <span className="r7-inbox-category">
                    {a.severity === "critical"
                      ? "PRIORITY"
                      : a.severity === "warning"
                        ? "ATTENTION"
                        : "OPPORTUNITY"}
                    <i />
                    SIGNAL {String(i + 1).padStart(2, "0")}
                  </span>
                  <strong>{a.title}</strong>
                  <span className="r7-inbox-description">{a.detail}</span>
                </span>
                <ArrowUpRight size={18} />
              </button>
              <button
                className={`r7-acknowledge ${acknowledged.includes(a.id) ? "acknowledged" : ""}`}
                aria-label={`${a.title} ${acknowledged.includes(a.id) ? "확인 취소" : "확인 완료"}`}
                onClick={() => toggleAcknowledged(a.id)}
              >
                {acknowledged.includes(a.id) ? (
                  <CheckCheck size={16} />
                ) : (
                  <Check size={16} />
                )}
                <span>
                  {acknowledged.includes(a.id) ? "Reviewed" : "Mark reviewed"}
                </span>
              </button>
            </div>
          ))
        ) : (
          <div className="r7-empty">
            <ShieldCheck size={36} />
            <h3>Nothing to review here.</h3>
            <p>이 조건에 맞는 신호가 없습니다.</p>
          </div>
        )}
      </section>
      <div className="r7-inbox-note">
        <CornerDownRight size={18} />
        <p>
          확인 표시는 장애를 해결하지 않습니다. 현재 수집 결과를 검토했다는 개인
          기록이며, 새 스냅샷에서는 다시 확인합니다.
        </p>
      </div>
      <SignalInspector signal={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
