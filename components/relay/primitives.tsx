"use client";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  Circle,
  GitBranch,
  LoaderCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pipelineName, formatDuration, type RelayPipeline } from "@/lib/relay";
export function RelayMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path d="M5 21 16 4h11L16 21H5Z" fill="currentColor" />
      <path d="m5 28 11-17h11L16 28H5Z" fill="currentColor" opacity=".5" />
    </svg>
  );
}
export function SectionLabel({
  children,
  index,
}: {
  children: React.ReactNode;
  index?: string;
}) {
  return (
    <div className="r7-section-label">
      {index && <span>{index}</span>}
      {children}
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="r7-page-title">
      <div>
        <SectionLabel>{eyebrow}</SectionLabel>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="r7-title-actions">{actions}</div>}
    </div>
  );
}
export function StatusIcon({ status }: { status: RelayPipeline["status"] }) {
  const Icon =
    status === "success"
      ? Check
      : status === "failed"
        ? X
        : status === "running"
          ? LoaderCircle
          : Circle;
  return (
    <span className={`r7-status-icon ${status}`}>
      <Icon size={14} />
    </span>
  );
}
export function PipelineInspector({
  pipeline,
  onClose,
}: {
  pipeline: RelayPipeline | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!pipeline} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="r7-dialog">
        <DialogHeader>
          <span className="r7-dialog-symbol">
            <GitBranch size={24} />
          </span>
          <DialogTitle>{pipeline?.project}</DialogTitle>
          <DialogDescription>
            파이프라인 #{pipeline?.id} · 수집된 실행 기록
          </DialogDescription>
        </DialogHeader>
        {pipeline && (
          <>
            <div className="r7-inspector-status">
              <StatusIcon status={pipeline.status} />
              <strong>{pipelineName[pipeline.status]}</strong>
              <span>{formatDuration(pipeline.durationSeconds)}</span>
            </div>
            <dl className="r7-detail-grid">
              <div>
                <dt>브랜치</dt>
                <dd>{pipeline.ref}</dd>
              </div>
              <div>
                <dt>시작 시각 · 한국 시간</dt>
                <dd>
                  {pipeline.startedAt
                    ? new Intl.DateTimeFormat("ko-KR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Seoul",
                      }).format(new Date(pipeline.startedAt))
                    : "미수집"}
                </dd>
              </div>
            </dl>
            <p className="r7-muted-note">
              실행 기록을 확인하는 읽기 전용 화면입니다. 작업별 로그는 연결된
              로그 화면에서 확인하세요.
            </p>
            <Link href="/logs" className="r7-button">
              로그 탐색
              <ArrowUpRight size={14} />
            </Link>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
export function downloadText(
  text: string,
  filename: string,
  type = "text/plain;charset=utf-8",
) {
  const href = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
  toast.success("파일을 저장했습니다");
}
export function ExportButton({
  onClick,
  children = "보고서 저장",
}: {
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button className="r7-button" onClick={onClick}>
      <ArrowDownToLine size={14} />
      {children}
    </button>
  );
}
