"use client";
import { useState } from "react";
import { ArrowUpRight, Minus } from "lucide-react";
import { useDashboard } from "@/components/overview/dashboard-provider";
import { summarizeDashboard } from "@/lib/dashboard";
import { shortDate, number } from "@/lib/overview-data";
import { SectionLabel, downloadText, ExportButton } from "./primitives";
import { pipelineCsv } from "@/lib/overview-data";
export function DeliveryChart({ expanded = false }: { expanded?: boolean }) {
  const { data } = useDashboard();
  const [range, setRange] = useState<7 | 30>(30),
    [selected, setSelected] = useState<string | null>(null);
  if (!data) return null;
  const summary = summarizeDashboard(data, range),
    max = Math.max(
      1,
      ...summary.days.map((d) => d.success + d.failed + d.canceled),
    );
  const day =
    summary.days.find((d) => d.date === selected) ?? summary.days.at(-1)!;
  return (
    <section className={`r7-delivery-chart ${expanded ? "expanded" : ""}`}>
      <div className="r7-panel-header">
        <div>
          <SectionLabel index="02">배포 흐름</SectionLabel>
          <h2>작은 변화가 이어지는 흐름.</h2>
        </div>
        <div className="r7-range" role="group" aria-label="실행 집계 기간">
          {([7, 30] as const).map((n) => (
            <button
              key={n}
              aria-pressed={range === n}
              onClick={() => {
                setRange(n);
                setSelected(null);
              }}
            >
              {n}일
            </button>
          ))}
        </div>
      </div>
      <div className="r7-chart-summary">
        <strong>
          {number.format(summary.total)}
          <span>완료된 실행</span>
        </strong>
        <span
          className={`r7-delta ${summary.delta !== null && summary.delta < 0 ? "negative" : ""}`}
        >
          {summary.delta === null ? (
            <Minus size={14} />
          ) : (
            <ArrowUpRight size={14} />
          )}
          <b>
            {summary.delta === null
              ? "—"
              : `${summary.delta > 0 ? "+" : ""}${summary.delta.toFixed(1)}%p`}
          </b>
          성공률 변화
        </span>
        <div className="r7-chart-legend">
          <span>
            <i />
            성공
          </span>
          <span>
            <i className="failed" />
            실패
          </span>
          <span>
            <i className="canceled" />
            취소
          </span>
        </div>
      </div>
      <div className="r7-bar-chart" role="group" aria-label="날짜별 실행 내역">
        {summary.days.map((d) => {
          const total = d.success + d.failed + d.canceled;
          return (
            <button
              key={d.date}
              className={d.date === day.date ? "selected" : ""}
              aria-label={`${d.date} · 성공 ${d.success}, 실패 ${d.failed}, 취소 ${d.canceled}`}
              aria-pressed={d.date === day.date}
              onClick={() => setSelected(d.date)}
            >
              <span className="r7-bar-track">
                <span
                  className="r7-bar-column"
                  style={{ height: `${(total / max) * 100}%` }}
                >
                  <i
                    className="r7-bar-canceled"
                    style={{
                      height: `${total ? (d.canceled / total) * 100 : 0}%`,
                    }}
                  />
                  <i
                    className="r7-bar-failed"
                    style={{
                      height: `${total ? (d.failed / total) * 100 : 0}%`,
                    }}
                  />
                  <i
                    className="r7-bar-success"
                    style={{
                      height: `${total ? (d.success / total) * 100 : 0}%`,
                    }}
                  />
                </span>
              </span>
              <span className="r7-bar-date">
                {range === 7 || Number(d.date.slice(-2)) % 7 === 0
                  ? shortDate(d.date)
                  : ""}
              </span>
            </button>
          );
        })}
      </div>
      <div className="r7-chart-insight" aria-live="polite">
        <span className="r7-chart-date">
          {day.date}
          <span>선택한 날짜</span>
        </span>
        <div>
          <span>
            <i className="r7-state-dot healthy" />
            성공<strong>{number.format(day.success)}</strong>
          </span>
          <span>
            <i className="r7-state-dot degraded" />
            실패<strong>{number.format(day.failed)}</strong>
          </span>
          <span className="r7-chart-canceled">
            취소<strong>{number.format(day.canceled)}</strong>
          </span>
        </div>
        {expanded && (
          <ExportButton
            onClick={() =>
              downloadText(
                pipelineCsv(summary.days),
                `relay-${data.source}-${range}days.csv`,
                "text/csv;charset=utf-8",
              )
            }
          >
            내역 받기
          </ExportButton>
        )}
      </div>
    </section>
  );
}
