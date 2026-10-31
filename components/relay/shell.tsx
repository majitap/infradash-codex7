"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Box,
  ChevronRight,
  Compass,
  GitBranch,
  Layers,
  Menu,
  Network,
  PanelLeftClose,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Terminal,
  TriangleAlert,
  Server,
  UserCheck,
  KeyRound,
} from "lucide-react";
import { useDashboard } from "@/components/overview/dashboard-provider";
import { DataConnect } from "@/components/overview/data-connect";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useRelay } from "./context";
import { RelayMark } from "./primitives";
import { useDisplayedLicense } from "./license-data";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
const primaryNav = [
  { href: "/", label: "운영 개요", caption: "운영 개요", icon: Compass },
  {
    href: "/pipelines",
    label: "빌드·배포",
    caption: "배포의 흐름",
    icon: GitBranch,
  },
  {
    href: "/topology",
    label: "시스템",
    caption: "연결된 시스템",
    icon: Network,
  },
  {
    href: "/incidents",
    label: "운영 신호",
    caption: "확인이 필요한 신호",
    icon: Activity,
  },
  {
    href: "/runners",
    label: "러너",
    caption: "러너 상태와 실행 자원",
    icon: Server,
  },
];
const management = [
  {
    href: "/access",
    label: "인가 관리",
    caption: "접근 요청 승인·반려와 역할 관리",
    icon: UserCheck,
  },
  {
    href: "/admin",
    label: "운영 설정",
    caption: "관리자 모드와 운영 설정",
    icon: Settings2,
  },
];
const explore = [
  {
    href: "/projects",
    label: "프로젝트",
    caption: "프로젝트 분석 예시",
    icon: Box,
  },
  {
    href: "/finops",
    label: "비용 분석",
    caption: "비용 분석 예시",
    icon: Sparkles,
  },
  {
    href: "/logs",
    label: "로그 탐색",
    caption: "운영 로그",
    icon: Terminal,
  },
  {
    href: "/security",
    label: "보안",
    caption: "보안 분석 예시",
    icon: ShieldCheck,
  },
];
function Navigation({ onNavigate }: { onNavigate: () => void }) {
  const path = usePathname().replace(/\/$/, "") || "/";
  const { data } = useDashboard();
  const { acknowledged } = useRelay();
  const open =
    data?.alerts.filter((a) => !acknowledged.includes(a.id)).length ?? 0;
  return (
    <>
      <div className="r7-workspace">
        <span className="r7-workspace-monogram">마</span>
        <div>
          <strong>{data?.workspace ?? "운영 공간"}</strong>
          <span>인프라 운영팀</span>
        </div>
        <span className="r7-workspace-key">01</span>
      </div>
      <div className="r7-nav-label">운영</div>
      <nav aria-label="주 메뉴" className="r7-nav">
        {primaryNav.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            onClick={onNavigate}
            aria-current={path === item.href ? "page" : undefined}
            title={item.caption}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
            {item.href === "/incidents" && open > 0 ? (
              <b>{open}</b>
            ) : path === item.href ? (
              <span className="r7-nav-current" />
            ) : null}
          </Link>
        ))}
      </nav>
      <div className="r7-nav-label r7-explore-label">분석</div>
      <nav aria-label="추가 분석" className="r7-nav secondary">
        {explore.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            onClick={onNavigate}
            aria-current={path === item.href ? "page" : undefined}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
            <ArrowUpRight size={12} />
          </Link>
        ))}
      </nav>
      <div className="r7-nav-label r7-explore-label">관리자</div>
      <nav aria-label="관리자 메뉴" className="r7-nav secondary">
        {management.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={path === item.href ? "page" : undefined}
            title={item.caption}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
            <ArrowUpRight size={12} />
          </Link>
        ))}
      </nav>
      <div className="r7-sidebar-guide">
        <span className="r7-guide-orbit">
          <Layers size={20} />
        </span>
        <strong>우리 팀의 운영 공간</strong>
        <p>
          우리 팀의 데이터를 연결해
          <br />
          실제 운영 흐름을 읽어보세요.
        </p>
        <DataConnect compact />
      </div>
      <Link
        href="/admin/integrations"
        onClick={onNavigate}
        className="r7-settings-link"
      >
        <Settings2 size={16} />
        <span>연동 설정</span>
        <ChevronRight size={13} />
      </Link>
    </>
  );
}
function SearchDialog() {
  const { searchOpen, setSearchOpen } = useRelay();
  const router = useRouter();
  const all = [
    ...primaryNav,
    ...explore,
    ...management,
    {
      href: "/admin/integrations",
      label: "연동 설정",
      caption: "데이터 연결 설정",
      icon: Settings2,
    },
  ];
  return (
    <CommandDialog
      open={searchOpen}
      onOpenChange={setSearchOpen}
      title="필요한 화면 찾기"
      description="페이지를 검색하고 이동합니다."
      className="r7-command"
    >
      <CommandInput placeholder="어디로 이동할까요?" />
      <CommandList>
        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
        <CommandGroup heading="화면 이동">
          {all.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.label} ${item.caption}`}
              onSelect={() => {
                setSearchOpen(false);
                router.push(item.href);
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              <span className="r7-command-caption">{item.caption}</span>
              <ArrowDownLeft size={14} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="r7-command-footer">
        <span>↑↓ 이동</span>
        <span>↵ 열기</span>
        <span>취소 키로 닫기</span>
      </div>
    </CommandDialog>
  );
}
export function RelayShell({ children }: { children: React.ReactNode }) {
  const [mobile, setMobile] = useState(false),
    [focus, setFocus] = useState(false);
  const { data, error, stale, source, refresh, loading } = useDashboard();
  const displayedLicense = useDisplayedLicense();
  const { setSearchOpen, acknowledged } = useRelay();
  const path = usePathname().replace(/\/$/, "") || "/";
  const page = [
    ...primaryNav,
    ...explore,
    ...management,
    { href: "/admin/license", label: "라이선스" },
  ].find((n) => n.href === path);
  const pending =
    data?.alerts.filter((a) => !acknowledged.includes(a.id)).length ?? 0;
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [setSearchOpen]);
  const sourceLabel = error
    ? "연결 확인 필요"
    : !data
      ? "데이터 연결 대기"
      : stale
        ? "오래된 수집 결과"
        : data.source === "demo"
          ? "예시 데이터"
          : source === "file"
            ? "가져온 데이터"
            : "연결됨";
  const core = primaryNav.some((n) => n.href === path);
  return (
    <div className={`r7-shell ${focus ? "is-focused" : ""}`}>
      <aside className="r7-sidebar">
        <Link href="/" className="r7-brand" aria-label="릴레이 홈">
          <RelayMark size={31} />
          <span>
            릴레이<span className="r7-brand-dot">.</span>
          </span>
          <span className="r7-edition">07</span>
        </Link>
        <Navigation onNavigate={() => {}} />
        <div className="r7-sidebar-bottom">
          <span className="r7-person">마</span>
          <div>
            <strong>마지탭</strong>
            <span>개인 운영 공간</span>
          </div>
          <button
            aria-label="집중 모드"
            aria-pressed={focus}
            onClick={() => setFocus(!focus)}
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </aside>
      <div className="r7-main">
        <header className="r7-topbar">
          <div className="r7-breadcrumb">
            <button
              className="r7-mobile-menu"
              aria-label="메뉴 열기"
              onClick={() => setMobile(true)}
            >
              <Menu size={19} />
            </button>
            {focus && (
              <button
                className="r7-focus-return"
                onClick={() => setFocus(false)}
                aria-label="메뉴 펼치기"
              >
                <RelayMark size={24} />
              </button>
            )}
            <span className="r7-breadcrumb-team">운영 공간</span>
            <span className="r7-slash">/</span>
            <strong>{page?.label ?? "연동 설정"}</strong>
          </div>
          <div className="r7-topbar-actions">
            <Link
              href="/admin/license"
              className="r7-header-license"
              aria-label={`라이선스 ${displayedLicense.counts ? `${displayedLicense.counts.used}/${displayedLicense.counts.total}` : "미수집"}${displayedLicense.source === "demo" ? ", 예시" : ""}`}
              title={
                displayedLicense.source === "demo"
                  ? "예시 라이선스 사용량"
                  : "수집된 라이선스 사용량"
              }
            >
              <KeyRound size={13} />
              <span>
                {displayedLicense.counts
                  ? `${displayedLicense.counts.used}/${displayedLicense.counts.total}`
                  : "—/—"}
              </span>
            </Link>
            <button
              className="r7-search-button"
              aria-label="페이지 검색"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={15} />
              <span>화면 검색</span>
              <kbd>⌘ K</kbd>
            </button>
            <span
              className={`r7-source ${data?.source === "live" && !stale && !error ? "connected" : ""}`}
            >
              <i />
              {sourceLabel}
            </span>
            <ThemeToggle />
            <Link
              href="/incidents"
              className="r7-header-signal"
              aria-label={`운영 신호 ${pending}건`}
            >
              <Bell size={18} />
              {pending > 0 && <i />}
            </Link>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className={`r7-content ${core ? "" : "r7-legacy"}`}
        >
          {(error || stale) && (
            <div className="r7-connection-alert" role="alert">
              <TriangleAlert size={16} />
              <span>
                {error ??
                  "수집 후 2분 이상 지났습니다. 이전 데이터가 표시됩니다."}
              </span>
              {source === "api" && (
                <button disabled={loading} onClick={() => void refresh()}>
                  다시 조회
                </button>
              )}
            </div>
          )}
          {!core && (
            <div className="r7-explorer-heading">
              <span>
                {path === "/access" || path.startsWith("/admin")
                  ? "관리자 / 운영 관리"
                  : "릴레이 / 상세 분석"}
              </span>
              <h1>{page?.label ?? "연동 설정"}</h1>
              <p>
                {path === "/access"
                  ? "접근 요청부터 역할과 임시 권한까지, 한곳에서 검토합니다."
                  : path.startsWith("/admin") || path === "/logs"
                    ? "우리 팀의 운영 환경과 연결합니다."
                    : "상세 분석을 살펴보는 예시 데이터 공간입니다."}
              </p>
              <Link href="/">
                운영 개요로 돌아가기
                <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
          {children}
          <footer className="r7-footer">
            <span>
              <RelayMark size={14} />
              안정적인 운영을 만드는 사람들을 위해.
            </span>
            <a
              href="https://github.com/majitap/infradash-codex7"
              target="_blank"
              rel="noreferrer"
            >
              소스 코드
              <ArrowUpRight size={12} />
            </a>
            <span>
              {data?.source === "demo"
                ? "예시 데이터 · 실제 변경 없음"
                : core
                  ? "읽기 전용"
                  : "운영 관리 공간"}
            </span>
          </footer>
        </main>
      </div>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="r7-mobile-sheet">
          <SheetHeader>
            <SheetTitle>
              <span className="r7-brand">
                <RelayMark />
                릴레이.
              </span>
            </SheetTitle>
            <SheetDescription>인프라 운영 공간</SheetDescription>
          </SheetHeader>
          <Navigation onNavigate={() => setMobile(false)} />
        </SheetContent>
      </Sheet>
      <SearchDialog />
    </div>
  );
}
