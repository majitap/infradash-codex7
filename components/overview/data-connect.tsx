"use client";
import { useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  FileJson,
  Link2,
  Plug,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDashboard } from "./dashboard-provider";
import { demoDashboard } from "@/lib/dashboard";

export function DataConnect({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false),
    [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const dashboard = useDashboard();
  function download() {
    const href = URL.createObjectURL(
      new Blob([JSON.stringify(demoDashboard, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = href;
    a.download = "relay-sample.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  return (
    <>
      <button
        className={compact ? "six-text-button" : "six-button primary"}
        onClick={() => setOpen(true)}
      >
        <Plug size={16} />
        데이터 연결{compact && <ArrowUpRight size={14} />}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="six-connect-dialog sm:max-w-xl">
          <DialogHeader>
            <span className="six-dialog-icon">
              <Plug size={24} />
            </span>
            <DialogTitle>내 데이터로 시작하기</DialogTitle>
            <DialogDescription>
              운영 개요·빌드·배포·시스템·러너·운영 신호에 함께 반영됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="six-import-box">
            <FileJson size={28} />
            <div>
              <strong>수집한 데이터 파일</strong>
              <p>
                파일은 이 브라우저에서만 읽습니다. 새로고침하면 초기화됩니다.
              </p>
            </div>
            <button
              className="six-button"
              onClick={() => input.current?.click()}
            >
              <Upload size={16} />
              가져오기
            </button>
          </div>
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            aria-label="대시보드 데이터 파일"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                await dashboard.importFile(file);
                setError(null);
                setOpen(false);
                toast.success("데이터 파일을 불러왔습니다");
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "파일을 읽지 못했습니다.",
                );
              } finally {
                if (input.current) input.current.value = "";
              }
            }}
          />
          <form
            className="six-connect-form"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                dashboard.connect(url);
                setError(null);
                setOpen(false);
              } catch {
                setError(
                  "인증 정보와 쿼리 문자열이 없는 보안 연결 주소를 입력하세요.",
                );
              }
            }}
          >
            <label htmlFor="data-endpoint">
              <Link2 size={16} />
              수집 주소로 연결
            </label>
            <p>조직에서 인증한 수집 주소를 30초마다 조회합니다.</p>
            <div>
              <input
                id="data-endpoint"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://수집서버/대시보드.json"
                autoComplete="off"
              />
              <button className="six-button primary" type="submit">
                연결
              </button>
            </div>
          </form>
          {error && (
            <p className="six-form-error" role="alert">
              {error}
            </p>
          )}
          <div className="six-connect-links">
            <button onClick={download}>
              <ArrowDownToLine size={16} />
              예시 파일 받기
            </button>
            <a
              href="https://github.com/majitap/infradash-codex7/blob/main/docs/START-HERE.md"
              target="_blank"
              rel="noreferrer"
            >
              연결 가이드
              <ArrowUpRight size={16} />
            </a>
            {dashboard.source !== "demo" && (
              <button
                onClick={() => {
                  dashboard.useDemo();
                  setOpen(false);
                }}
              >
                <X size={16} />
                예시로 돌아가기
              </button>
            )}
          </div>
          <p className="six-connect-note">
            프로젝트·비용·보안·인가 관리의 확장 화면은 예시 데이터입니다. 상세
            로그와 외부 시스템 조회는 연동 설정에서 별도로 연결합니다.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
