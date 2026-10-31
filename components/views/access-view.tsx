"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  HistoryIcon,
  HourglassIcon,
  InboxIcon,
  LockKeyholeIcon,
  MinusIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  ShieldUserIcon,
  TriangleAlertIcon,
  Undo2Icon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react";

import { KpiGrid, KpiTile } from "@/components/dashboard/kpi-tile";
import { Section } from "@/components/dashboard/section-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import { UserAvatar, UserCell } from "@/components/dashboard/user-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate, relativeTime } from "@/lib/format";
import {
  ACCESS_GROUPS,
  ADMIN_LIMIT,
  MOCK_NOW,
  MOCK_TODAY,
  PERMISSIONS,
  REQUEST_KIND_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_ORDER,
  accessPolicies,
  accessRequests,
  accessUsers,
  addDays,
  adminAccounts,
  currentUser,
  daysBetween,
  handledRequests,
  hasPermission,
  membershipKey,
  memberships,
  permissionHistory,
  privilegeReviews,
  userById,
  type AccessGroup,
  type AccessRequest,
  type MockUser,
  type UserRole,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------------------

const roleName: Record<string, string> = {
  Guest: "게스트",
  Reporter: "조회자",
  Developer: "개발자",
  Maintainer: "유지관리자",
  Owner: "소유자",
  Admin: "관리자",
};

type Cell = { role: UserRole; expiresAt: string | null } | null;

const ROLE_DOT: Record<UserRole, string> = {
  Guest: "bg-muted-foreground/50",
  Reporter: "bg-tone-sky",
  Developer: "bg-tone-indigo",
  Maintainer: "bg-tone-violet",
  Owner: "bg-tone-rose",
};

const ROLE_CHIP: Record<UserRole, string> = {
  Owner: "bg-tone-rose/12 text-tone-rose",
  Maintainer: "bg-tone-violet/12 text-tone-violet",
  Developer: "bg-tone-indigo/12 text-tone-indigo",
  Reporter: "bg-tone-sky/12 text-tone-sky",
  Guest: "bg-muted text-muted-foreground",
};

const ROLE_ITEMS = [
  { value: "none", label: "없음" },
  ...ROLE_ORDER.map((r) => ({ value: r, label: roleName[r] })),
];

const ME = { name: currentUser.name, hue: 265 };
const PAGE_SIZE = 12;

function RoleChip({ role }: { role: UserRole | "Admin" | null }) {
  if (!role) return <span className="text-xs text-muted-foreground">없음</span>;
  if (role === "Admin")
    return (
      <span className="rounded bg-amber-500/14 px-2 py-px text-[0.875rem] font-bold text-amber-800 dark:text-amber-300">
        관리자
      </span>
    );
  return (
    <span
      className={cn(
        "rounded px-2 py-px text-[0.875rem] font-bold",
        ROLE_CHIP[role],
      )}
    >
      {roleName[role]}
    </span>
  );
}

function GroupChip({ group }: { group: AccessGroup }) {
  return (
    <span className="rounded bg-muted px-2 py-px font-mono text-[0.875rem] font-semibold">
      {group}
    </span>
  );
}

function requestSummary(r: AccessRequest) {
  const duration = r.durationDays ? ` · ${r.durationDays}일 임시` : "";
  if (r.kind === "admin") return `인스턴스 관리자${duration}`;
  return `${r.group} · ${r.currentRole ? roleName[r.currentRole] : "없음"} → ${roleName[r.requestedRole]}${duration}`;
}

function RoleSelect({
  value,
  changed,
  label,
  onChange,
}: {
  value: UserRole | null;
  changed: boolean;
  label: string;
  onChange: (role: UserRole | null) => void;
}) {
  return (
    <Select
      items={ROLE_ITEMS}
      value={value ?? "none"}
      onValueChange={(v) =>
        onChange(!v || v === "none" ? null : (v as UserRole))
      }
    >
      <SelectTrigger
        size="sm"
        aria-label={label}
        className={cn(
          "w-[8.5rem] justify-between",
          changed &&
            "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/25",
        )}
      >
        <SelectValue>
          {(v: string) =>
            v === "none" ? (
              <span className="text-muted-foreground/70">—</span>
            ) : (
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    ROLE_DOT[v as UserRole],
                  )}
                />
                {roleName[v] ?? v}
              </span>
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ROLE_ITEMS.map((it) => (
          <SelectItem key={it.value} value={it.value}>
            {it.value === "none" ? (
              <span className="text-muted-foreground">없음 (멤버 아님)</span>
            ) : (
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    ROLE_DOT[it.value as UserRole],
                  )}
                />
                <span className="font-medium">{it.label}</span>
                <span className="text-xs text-muted-foreground">
                  {ROLE_DESCRIPTIONS[it.value as UserRole]}
                </span>
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ---------------------------------------------------------------------------
// view
// ---------------------------------------------------------------------------

type LogEntry = {
  id: string;
  at: string;
  actorName: string;
  actorHue: number;
  subjectName: string;
  action: string;
  detail: string;
};

type Decision = { decision: "approved" | "denied"; at: string; note?: string };

type Confirm =
  | { kind: "approve"; request: AccessRequest; final: boolean }
  | { kind: "deny"; request: AccessRequest }
  | { kind: "apply" }
  | { kind: "removeAdmin"; user: MockUser }
  | {
      kind: "revoke";
      key: string;
      user: MockUser;
      group: AccessGroup;
      role: UserRole;
    }
  | null;

type EditorView = "all" | "changed" | "temporary" | "admins";

export function AccessView() {
  // persisted state (in this demo: browser memory only)
  const [cells, setCells] = React.useState<Record<string, Cell>>(() =>
    Object.fromEntries(
      memberships.map((m) => [
        membershipKey(m.userId, m.group),
        { role: m.role, expiresAt: m.expiresAt },
      ]),
    ),
  );
  const [admins, setAdmins] = React.useState<number[]>(() =>
    adminAccounts.map((u) => u.id),
  );
  const [policies, setPolicies] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(accessPolicies.map((p) => [p.id, p.enabled])),
  );
  const [decisions, setDecisions] = React.useState<Record<string, Decision>>(
    {},
  );
  const [myApprovals, setMyApprovals] = React.useState<Record<string, boolean>>(
    {},
  );
  const [reviewed, setReviewed] = React.useState<Record<string, boolean>>({});
  const [log, setLog] = React.useState<LogEntry[]>([]);

  // editor state
  const [draft, setDraft] = React.useState<Record<string, Cell>>({});
  const [query, setQuery] = React.useState("");
  const [editorView, setEditorView] = React.useState<EditorView>("all");
  const [page, setPage] = React.useState(0);

  // dialogs
  const [confirm, setConfirm] = React.useState<Confirm>(null);
  const [denyNote, setDenyNote] = React.useState("");
  const [requestTab, setRequestTab] = React.useState<"pending" | "handled">(
    "pending",
  );

  const addLog = (subjectName: string, action: string, detail: string) =>
    setLog((l) => [
      {
        id: `s${l.length + 1}`,
        at: MOCK_NOW,
        actorName: ME.name,
        actorHue: ME.hue,
        subjectName,
        action,
        detail,
      },
      ...l,
    ]);

  // -------------------------------------------------------------------------
  // derived values
  // -------------------------------------------------------------------------

  const pending = accessRequests.filter((r) => !decisions[r.id]);
  const twoApprovers = policies["two-approvers"];
  const required = (r: AccessRequest) =>
    r.highPrivilege && twoApprovers ? 2 : 1;
  const approvalsOf = (r: AccessRequest) =>
    (r.firstApprover ? 1 : 0) + (myApprovals[r.id] ? 1 : 0);

  const adminUsers = admins.map(userById);
  const adminsWithout2fa = adminUsers.filter((u) => !u.twoFactor).length;

  const expiring = Object.entries(cells)
    .filter(
      ([, c]) => c?.expiresAt && daysBetween(MOCK_TODAY, c.expiresAt) <= 14,
    )
    .map(([key, c]) => {
      const [uid, group] = key.split(":");
      return {
        key,
        user: userById(Number(uid)),
        group: group as AccessGroup,
        cell: c!,
      };
    })
    .sort((a, b) =>
      (a.cell.expiresAt ?? "").localeCompare(b.cell.expiresAt ?? ""),
    );

  const reviews = privilegeReviews.filter((r) => {
    const key = membershipKey(r.user.id, r.membership.group);
    const role = cells[key]?.role;
    return !reviewed[key] && (role === "Maintainer" || role === "Owner");
  });

  const draftEntries = Object.entries(draft).map(([key, to]) => {
    const [uid, group] = key.split(":");
    return {
      key,
      user: userById(Number(uid)),
      group: group as AccessGroup,
      from: cells[key]?.role ?? null,
      to: to?.role ?? null,
    };
  });
  const changedUserIds = new Set(draftEntries.map((e) => e.user.id));

  const effective = (key: string): Cell =>
    key in draft ? draft[key] : (cells[key] ?? null);

  const q = query.trim().toLowerCase();
  const editorRows = accessUsers
    .filter(
      (u) =>
        !q ||
        `${u.name} ${u.username} ${u.department} ${u.title}`
          .toLowerCase()
          .includes(q),
    )
    .filter((u) => {
      if (editorView === "changed") return changedUserIds.has(u.id);
      if (editorView === "admins") return admins.includes(u.id);
      if (editorView === "temporary")
        return ACCESS_GROUPS.some(
          (g) => cells[membershipKey(u.id, g)]?.expiresAt,
        );
      return true;
    });
  const pageCount = Math.max(1, Math.ceil(editorRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = editorRows.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const groupMemberCount = (g: AccessGroup) =>
    accessUsers.filter((u) => effective(membershipKey(u.id, g))).length;

  const history: LogEntry[] = [
    ...log,
    ...permissionHistory.map((h) => ({
      id: `h${h.id}`,
      at: h.at,
      actorName: h.actor.name,
      actorHue: h.actor.hue,
      subjectName: h.subject.name,
      action: h.action,
      detail: h.detail,
    })),
  ];

  // -------------------------------------------------------------------------
  // actions
  // -------------------------------------------------------------------------

  function setRole(user: MockUser, group: AccessGroup, role: UserRole | null) {
    const key = membershipKey(user.id, group);
    const base = cells[key] ?? null;
    setDraft((d) => {
      const next = { ...d };
      if ((base?.role ?? null) === role) delete next[key];
      else
        next[key] = role ? { role, expiresAt: base?.expiresAt ?? null } : null;
      return next;
    });
  }

  function startApprove(r: AccessRequest) {
    if (myApprovals[r.id]) {
      toast.info("이미 승인했습니다", {
        description: "2인 승인 정책: 다른 관리자의 승인이 필요합니다.",
      });
      return;
    }
    setConfirm({
      kind: "approve",
      request: r,
      final: approvalsOf(r) + 1 >= required(r),
    });
  }

  function doApprove(r: AccessRequest) {
    const count = approvalsOf(r) + 1;
    if (count < required(r)) {
      setMyApprovals((m) => ({ ...m, [r.id]: true }));
      addLog(
        r.user.name,
        "1차 승인",
        `${requestSummary(r)} · 두 번째 승인 대기`,
      );
      toast(`${r.id} 1차 승인을 기록했습니다`, {
        description: "다른 관리자 1명의 승인이 더 필요합니다. (데모)",
      });
      return;
    }
    setDecisions((d) => ({
      ...d,
      [r.id]: { decision: "approved", at: MOCK_NOW },
    }));
    if (r.kind === "admin") {
      setAdmins((a) => (a.includes(r.user.id) ? a : [...a, r.user.id]));
    } else if (r.group) {
      const key = membershipKey(r.user.id, r.group);
      const expiresAt = r.durationDays
        ? addDays(MOCK_TODAY, r.durationDays)
        : null;
      setCells((c) => ({
        ...c,
        [key]: { role: r.requestedRole as UserRole, expiresAt },
      }));
      setDraft((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
    }
    addLog(r.user.name, "요청 승인", `${r.id} · ${requestSummary(r)}`);
    toast.success(
      `${r.user.name}님의 ${REQUEST_KIND_LABELS[r.kind]} 요청을 승인했습니다`,
      {
        description: "데모 전용: 실제 깃랩 권한은 바뀌지 않습니다.",
      },
    );
  }

  function doDeny(r: AccessRequest) {
    const note = denyNote.trim();
    setDecisions((d) => ({
      ...d,
      [r.id]: { decision: "denied", at: MOCK_NOW, note: note || undefined },
    }));
    addLog(
      r.user.name,
      "요청 거절",
      `${r.id} · ${requestSummary(r)}${note ? ` · 사유: ${note}` : ""}`,
    );
    toast(`${r.id} 요청을 거절했습니다`, {
      description:
        "예시 화면에 처리 결과를 기록했습니다. 실제 알림은 전송하지 않습니다.",
    });
    setDenyNote("");
  }

  function doApply() {
    const count = draftEntries.length;
    setCells((c) => ({ ...c, ...draft }));
    draftEntries.forEach((e) =>
      addLog(
        e.user.name,
        "역할 변경",
        `${e.group} · ${e.from ? roleName[e.from] : "없음"} → ${e.to ? roleName[e.to] : "없음"}`,
      ),
    );
    setDraft({});
    if (editorView === "changed") setEditorView("all");
    toast.success(`${count}건의 권한 변경을 적용했습니다`, {
      description: "데모 전용: 브라우저 화면에만 반영됩니다.",
    });
  }

  function doRemoveAdmin(user: MockUser) {
    setAdmins((a) => a.filter((id) => id !== user.id));
    addLog(user.name, "관리자 해제", "인스턴스 관리자 → 일반 사용자");
    toast.success(`${user.name}님의 관리자 권한을 해제했습니다`, {
      description: "데모 전용: 실제 계정에는 영향이 없습니다.",
    });
  }

  function extend(key: string, user: MockUser, group: AccessGroup) {
    const c = cells[key];
    if (!c?.expiresAt) return;
    const next = addDays(c.expiresAt, 30);
    setCells((cs) => ({ ...cs, [key]: { ...c, expiresAt: next } }));
    addLog(
      user.name,
      "만료일 연장",
      `${group} · ${roleName[c.role]} · ${fmtDate(next)}까지`,
    );
    toast.success(`${user.name}님의 ${group} 권한을 30일 연장했습니다`, {
      description: `새 만료일 ${fmtDate(next)} (데모)`,
    });
  }

  function doRevoke(
    key: string,
    user: MockUser,
    group: AccessGroup,
    role: UserRole,
  ) {
    setCells((cs) => ({ ...cs, [key]: null }));
    setDraft((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });
    addLog(user.name, "멤버십 회수", `${group} · ${roleName[role]} → 없음`);
    toast.success(`${user.name}님의 ${group} 멤버십을 회수했습니다`, {
      description: "데모 전용: 실제 권한은 그대로입니다.",
    });
  }

  function demote(
    key: string,
    user: MockUser,
    group: AccessGroup,
    role: UserRole,
  ) {
    setCells((cs) => ({
      ...cs,
      [key]: { role: "Developer", expiresAt: cs[key]?.expiresAt ?? null },
    }));
    setReviewed((r) => ({ ...r, [key]: true }));
    addLog(user.name, "권한 하향", `${group} · ${role} → 개발자`);
    toast.success(`${user.name}님의 ${group} 역할을 개발자로 낮췄습니다`, {
      description: "데모 전용",
    });
  }

  function keep(key: string, user: MockUser, group: AccessGroup) {
    setReviewed((r) => ({ ...r, [key]: true }));
    addLog(user.name, "권한 검토 완료", `${group} · 유지`);
    toast("검토 완료로 표시했습니다", {
      description: `${user.name} · ${group} 권한 유지`,
    });
  }

  function togglePolicy(id: string, label: string, value: boolean) {
    setPolicies((p) => ({ ...p, [id]: value }));
    addLog("정책", value ? "정책 켬" : "정책 끔", label);
    toast(`${label}: ${value ? "켜짐" : "꺼짐"}`, {
      description: "데모 전용: 저장되지 않습니다.",
    });
  }

  // -------------------------------------------------------------------------
  // render
  // -------------------------------------------------------------------------

  const oldest = pending[pending.length - 1];

  return (
    <>
      <Section>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card px-4 py-4 text-sm">
          <LockKeyholeIcon className="size-4 text-tone-orange" />
          <span className="font-bold">관리자 전용</span>
          <span className="text-muted-foreground">
            접근 요청 승인과 역할 부여를 처리합니다. 데모에서는 접근 제어 없이
            표시되며 모든 변경은 이 화면에만 반영됩니다.
          </span>
        </div>
      </Section>

      <KpiGrid>
        <KpiTile
          label="승인 대기 요청"
          value={String(pending.length)}
          unit="건"
          hint={
            pending.length
              ? `높은 권한 ${pending.filter((r) => r.highPrivilege).length}건 · 가장 오래된 요청 ${relativeTime(oldest.requestedAt)}`
              : "모든 요청을 처리했습니다"
          }
          icon={InboxIcon}
          tone="orange"
        />
        <KpiTile
          label="인스턴스 관리자"
          value={String(admins.length)}
          unit="명"
          hint={`정책 상한 ${ADMIN_LIMIT}명 · 2단계 인증 미사용 ${adminsWithout2fa}명`}
          icon={ShieldUserIcon}
          tone={admins.length > ADMIN_LIMIT ? "rose" : "emerald"}
        />
        <KpiTile
          label="만료 예정 임시 권한"
          value={String(expiring.length)}
          unit="건"
          hint="14일 이내 만료"
          icon={HourglassIcon}
          tone="sky"
        />
        <KpiTile
          label="권한 검토 필요"
          value={String(reviews.length)}
          unit="건"
          hint="유지관리자 이상 중 활동·보안 이상"
          icon={ShieldAlertIcon}
          tone={reviews.length ? "amber" : "emerald"}
        />
      </KpiGrid>

      {/* requests + policies + admins */}
      <div className="grid grid-cols-1 gap-4  @6xl/main:grid-cols-3">
        <Card className="@6xl/main:col-span-2">
          <CardHeader>
            <CardTitle>접근 요청</CardTitle>
            <CardDescription>
              {twoApprovers
                ? "소유자·관리자 요청은 서로 다른 관리자 2명의 승인이 필요합니다"
                : "모든 요청은 관리자 1명의 승인으로 반영됩니다"}
            </CardDescription>
            <CardAction>
              <Tabs
                value={requestTab}
                onValueChange={(v) => setRequestTab(v as "pending" | "handled")}
              >
                <TabsList>
                  <TabsTrigger value="pending">
                    대기
                    <Badge variant="secondary" className="px-2 tabular-nums">
                      {pending.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="handled">처리됨</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardAction>
          </CardHeader>
          <CardContent>
            {requestTab === "pending" ? (
              pending.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-sm text-muted-foreground">
                  <CircleCheckIcon className="size-6 text-emerald-600 dark:text-emerald-300" />
                  대기 중인 요청이 없습니다
                </div>
              ) : (
                <ul className="flex flex-col divide-y rounded-lg border">
                  {pending.map((r) => {
                    const approvals = approvalsOf(r);
                    const need = required(r);
                    return (
                      <li
                        key={r.id}
                        className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start"
                      >
                        <UserAvatar
                          name={r.user.name}
                          hue={r.user.hue}
                          size="md"
                          className="hidden sm:flex"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                            <span className="font-bold">{r.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              @{r.user.username} · {r.user.department}
                            </span>
                            {r.user.status === "pending" && (
                              <StatusPill
                                status="warning"
                                label="초대 대기 계정"
                                size="xs"
                              />
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                            <span className="rounded bg-tone-orange/12 px-2 py-px text-[0.875rem] font-bold text-tone-orange">
                              {REQUEST_KIND_LABELS[r.kind]}
                            </span>
                            {r.group ? (
                              <GroupChip group={r.group} />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                인스턴스 전체
                              </span>
                            )}
                            <RoleChip role={r.currentRole} />
                            <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                            <RoleChip role={r.requestedRole} />
                            {r.durationDays ? (
                              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                <ClockIcon className="size-3.5" />
                                {r.durationDays}일
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                영구
                              </span>
                            )}
                            {r.highPrivilege && (
                              <StatusPill
                                status="serious"
                                label="높은 권한"
                                icon={TriangleAlertIcon}
                                size="xs"
                              />
                            )}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {r.reason}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 text-xs text-muted-foreground">
                            <span>
                              {r.id} · {relativeTime(r.requestedAt)} 요청
                            </span>
                            {need > 1 && (
                              <span
                                className={cn(
                                  "font-bold",
                                  approvals > 0
                                    ? "text-amber-700 dark:text-amber-300"
                                    : "",
                                )}
                              >
                                승인 {approvals}/{need}
                                {r.firstApprover &&
                                  ` · 1차 ${r.firstApprover.name}`}
                                {myApprovals[r.id] && " · 1차 나"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2 sm:pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setConfirm({ kind: "deny", request: r })
                            }
                          >
                            <UserXIcon />
                            거절
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => startApprove(r)}
                            disabled={myApprovals[r.id]}
                          >
                            <UserCheckIcon />
                            {myApprovals[r.id] ? "승인 대기" : "승인"}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : (
              <ul className="flex flex-col divide-y rounded-lg border">
                {accessRequests
                  .filter((r) => decisions[r.id])
                  .map((r) => ({ r, d: decisions[r.id] }))
                  .map(({ r, d }) => (
                    <HandledRow
                      key={r.id}
                      id={r.id}
                      user={r.user}
                      summary={requestSummary(r)}
                      decision={d.decision}
                      by={ME.name}
                      at={d.at}
                      note={d.note}
                    />
                  ))}
                {handledRequests.map((h) => (
                  <HandledRow
                    key={h.id}
                    id={h.id}
                    user={h.user}
                    summary={h.summary}
                    decision={h.decision}
                    by={h.decidedBy.name}
                    at={h.decidedAt}
                    note={h.note}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>인스턴스 관리자</CardTitle>
              <CardDescription>관리 영역 전체 접근 권한</CardDescription>
              <CardAction>
                {admins.length > ADMIN_LIMIT ? (
                  <StatusPill
                    status="warning"
                    label={`${admins.length} / 상한 ${ADMIN_LIMIT}`}
                    icon={TriangleAlertIcon}
                    size="xs"
                  />
                ) : (
                  <StatusPill
                    status="good"
                    label={`${admins.length} / 상한 ${ADMIN_LIMIT}`}
                    icon={CircleCheckIcon}
                    size="xs"
                  />
                )}
              </CardAction>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col divide-y">
                {adminUsers.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-4 py-2 first:pt-0 last:pb-0"
                  >
                    <UserCell
                      name={u.name}
                      hue={u.hue}
                      secondary={`${u.department} · ${u.lastActivity ? relativeTime(u.lastActivity) : "접속 기록 없음"}`}
                      size="sm"
                    />
                    <span
                      className="ml-auto"
                      title={
                        u.twoFactor ? "2단계 인증 사용" : "2단계 인증 미사용"
                      }
                    >
                      {u.twoFactor ? (
                        <ShieldCheckIcon className="size-4 text-emerald-600 dark:text-emerald-300" />
                      ) : (
                        <ShieldOffIcon className="size-4 text-rose-600 dark:text-rose-300" />
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={admins.length <= 2}
                      title={
                        admins.length <= 2
                          ? "관리자는 최소 2명이 필요합니다"
                          : undefined
                      }
                      onClick={() =>
                        setConfirm({ kind: "removeAdmin", user: u })
                      }
                    >
                      해제
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>접근 정책</CardTitle>
              <CardDescription>권한 부여 시 적용되는 규칙</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col divide-y">
              {accessPolicies.map((p) => (
                <label
                  key={p.id}
                  htmlFor={`policy-${p.id}`}
                  className="flex cursor-pointer items-start gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1 leading-snug">
                    <div className="text-sm font-bold">{p.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.description}
                    </div>
                  </div>
                  <Switch
                    id={`policy-${p.id}`}
                    checked={policies[p.id]}
                    onCheckedChange={(v) => togglePolicy(p.id, p.label, v)}
                    className="mt-2"
                  />
                </label>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* membership editor */}
      <Section>
        <Card>
          <CardHeader>
            <CardTitle>그룹 멤버십</CardTitle>
            <CardDescription>
              역할을 바꾸면 노란색으로 표시되고, 아래에서 한 번에 적용합니다 ·{" "}
              <ClockIcon className="inline size-3.5" /> 표시는 임시 권한
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Tabs
                value={editorView}
                onValueChange={(v) => {
                  setEditorView(v as EditorView);
                  setPage(0);
                }}
              >
                <TabsList className="h-auto flex-wrap">
                  <TabsTrigger value="all">
                    전체
                    <Badge variant="secondary" className="px-2 tabular-nums">
                      {accessUsers.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="changed">
                    변경됨
                    <Badge
                      variant="secondary"
                      className={cn(
                        "px-2 tabular-nums",
                        changedUserIds.size > 0 &&
                          "bg-amber-500/20 text-amber-800 dark:text-amber-300",
                      )}
                    >
                      {changedUserIds.size}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="temporary">임시 권한</TabsTrigger>
                  <TabsTrigger value="admins">관리자</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative sm:w-72">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="이름, 아이디, 부서 검색"
                  className="pl-8"
                  aria-label="멤버 검색"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="min-w-52">사용자</TableHead>
                    {ACCESS_GROUPS.map((g) => (
                      <TableHead key={g} className="min-w-44">
                        <div className="font-mono text-xs font-bold text-foreground">
                          {g}
                        </div>
                        <div className="text-[0.875rem] font-normal text-muted-foreground">
                          {groupMemberCount(g)}명
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center">관리자</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={ACCESS_GROUPS.length + 2}
                        className="h-24 text-center text-muted-foreground"
                      >
                        해당하는 사용자가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((u) => (
                      <TableRow
                        key={u.id}
                        className={
                          changedUserIds.has(u.id)
                            ? "bg-amber-500/5"
                            : undefined
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCell
                              name={u.name}
                              hue={u.hue}
                              secondary={`${u.department} · ${u.title}`}
                              size="sm"
                            />
                            {u.status === "blocked" && (
                              <StatusPill
                                status="critical"
                                label="차단됨"
                                size="xs"
                              />
                            )}
                            {u.status === "pending" && (
                              <StatusPill
                                status="warning"
                                label="초대 대기"
                                size="xs"
                              />
                            )}
                          </div>
                        </TableCell>
                        {ACCESS_GROUPS.map((g) => {
                          const key = membershipKey(u.id, g);
                          const cell = effective(key);
                          const base = cells[key];
                          const days = base?.expiresAt
                            ? daysBetween(MOCK_TODAY, base.expiresAt)
                            : null;
                          return (
                            <TableCell key={g}>
                              <div className="flex items-center gap-2">
                                <RoleSelect
                                  value={cell?.role ?? null}
                                  changed={key in draft}
                                  label={`${u.name} ${g} 역할`}
                                  onChange={(role) => setRole(u, g, role)}
                                />
                                {days !== null && (
                                  <span
                                    title={`임시 권한 · ${fmtDate(base!.expiresAt!)} 만료`}
                                    className={cn(
                                      "inline-flex items-center gap-2 text-[0.875rem] tabular-nums",
                                      days <= 7
                                        ? "font-bold text-amber-700 dark:text-amber-300"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    <ClockIcon className="size-3" />
                                    {days}일
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          {admins.includes(u.id) ? (
                            <span className="rounded bg-amber-500/14 px-2 py-px text-[0.875rem] font-bold text-amber-800 dark:text-amber-300">
                              관리자
                            </span>
                          ) : (
                            <MinusIcon className="mx-auto size-3.5 text-muted-foreground/50" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span className="tabular-nums">
                {editorRows.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–
                {Math.min(editorRows.length, (safePage + 1) * PAGE_SIZE)} /{" "}
                {editorRows.length}명
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="이전 페이지"
                  disabled={safePage === 0}
                  onClick={() => setPage(safePage - 1)}
                >
                  <ChevronLeftIcon />
                </Button>
                <span className="w-14 text-center tabular-nums">
                  {safePage + 1} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="다음 페이지"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage(safePage + 1)}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>

            {draftEntries.length > 0 && (
              <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-4 rounded-lg border border-amber-500/40 bg-card px-4 py-4 shadow-md">
                <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-300" />
                <span className="text-sm">
                  <b>{draftEntries.length}건</b>의 변경이 적용되지 않았습니다
                  <span className="text-muted-foreground">
                    {" "}
                    · 사용자 {changedUserIds.size}명
                  </span>
                </span>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDraft({})}
                  >
                    <Undo2Icon />
                    되돌리기
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setConfirm({ kind: "apply" })}
                  >
                    <CheckIcon />
                    변경 사항 적용
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Section>

      {/* review lists */}
      <div className="grid grid-cols-1 gap-4  @5xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>만료 예정 임시 권한</CardTitle>
            <CardDescription>
              14일 이내 · 만료되면 자동으로 회수됩니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expiring.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                만료 예정인 임시 권한이 없습니다.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {expiring.map(({ key, user, group, cell }) => {
                  const days = daysBetween(MOCK_TODAY, cell.expiresAt!);
                  return (
                    <li
                      key={key}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 first:pt-0 last:pb-0"
                    >
                      <UserAvatar name={user.name} hue={user.hue} size="sm" />
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold">{user.name}</span>
                          <GroupChip group={group} />
                          <RoleChip role={cell.role} />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span
                            className={cn(
                              "mr-2 rounded-full px-2 py-px font-bold tabular-nums",
                              days <= 3
                                ? "bg-rose-500/12 text-rose-700 dark:text-rose-300"
                                : "bg-amber-500/14 text-amber-800 dark:text-amber-300",
                            )}
                          >
                            D-{days}
                          </span>
                          {fmtDate(cell.expiresAt!)} 만료 · {user.department}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => extend(key, user, group)}
                        >
                          30일 연장
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            setConfirm({
                              kind: "revoke",
                              key,
                              user,
                              group,
                              role: cell.role,
                            })
                          }
                        >
                          회수
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>권한 검토 필요</CardTitle>
            <CardDescription>
              유지관리자 이상 권한을 가진 계정 중 확인이 필요한 항목
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                검토할 항목이 없습니다.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {reviews.map(({ user, membership, reason }) => {
                  const key = membershipKey(user.id, membership.group);
                  const role = cells[key]?.role ?? membership.role;
                  return (
                    <li
                      key={key}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 first:pt-0 last:pb-0"
                    >
                      <UserAvatar name={user.name} hue={user.hue} size="sm" />
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold">{user.name}</span>
                          <GroupChip group={membership.group} />
                          <RoleChip role={role} />
                        </div>
                        <div className="mt-2">
                          <StatusPill
                            status={
                              user.status === "blocked" ? "critical" : "warning"
                            }
                            label={reason}
                            icon={ShieldAlertIcon}
                            size="xs"
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() =>
                            demote(key, user, membership.group, role)
                          }
                        >
                          개발자로 하향
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => keep(key, user, membership.group)}
                        >
                          유지
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* reference + history */}
      <div className="grid grid-cols-1 gap-4  @6xl/main:grid-cols-5">
        <Card className="@6xl/main:col-span-3">
          <CardHeader>
            <CardTitle>역할별 권한</CardTitle>
            <CardDescription>
              깃랩 기본 역할 기준 · 상위 역할은 하위 역할의 권한을 모두
              포함합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="min-w-40">권한</TableHead>
                    {ROLE_ORDER.map((r) => (
                      <TableHead
                        key={r}
                        className="text-center"
                        title={ROLE_DESCRIPTIONS[r]}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={cn("size-2 rounded-full", ROLE_DOT[r])}
                          />
                          {roleName[r]}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSIONS.map((p, i) => {
                    const newCategory =
                      i === 0 || PERMISSIONS[i - 1].category !== p.category;
                    return (
                      <React.Fragment key={p.key}>
                        {newCategory && (
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell
                              colSpan={ROLE_ORDER.length + 1}
                              className="py-2 text-xs font-bold text-muted-foreground"
                            >
                              {p.category}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell className="text-sm">{p.label}</TableCell>
                          {ROLE_ORDER.map((r) => (
                            <TableCell key={r} className="text-center">
                              {hasPermission(r, p) ? (
                                <CheckIcon
                                  className="mx-auto size-4 text-emerald-600 dark:text-emerald-300"
                                  aria-label="허용"
                                />
                              ) : (
                                <MinusIcon
                                  className="mx-auto size-3.5 text-muted-foreground/40"
                                  aria-label="불가"
                                />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="@6xl/main:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="size-4 text-muted-foreground" />
              권한 변경 이력
            </CardTitle>
            <CardDescription>
              이 화면에서 한 변경이 맨 위에 쌓입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col divide-y">
              {history.slice(0, 12).map((h) => (
                <li key={h.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <UserAvatar name={h.actorName} hue={h.actorHue} size="sm" />
                  <div className="min-w-0 flex-1 leading-snug">
                    <div className="text-sm">
                      <b>{h.actorName}</b>
                      <span className="text-muted-foreground">
                        {" "}
                        → {h.subjectName} ·{" "}
                      </span>
                      <span className="font-bold">{h.action}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {h.detail}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {relativeTime(h.at)}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        confirm={confirm}
        onClose={() => {
          setConfirm(null);
          setDenyNote("");
        }}
        denyNote={denyNote}
        setDenyNote={setDenyNote}
        draftEntries={draftEntries}
        twoApprovers={twoApprovers}
        onApprove={doApprove}
        onDeny={doDeny}
        onApply={doApply}
        onRemoveAdmin={doRemoveAdmin}
        onRevoke={doRevoke}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// pieces
// ---------------------------------------------------------------------------

function HandledRow({
  id,
  user,
  summary,
  decision,
  by,
  at,
  note,
}: {
  id: string;
  user: MockUser;
  summary: string;
  decision: "approved" | "denied";
  by: string;
  at: string;
  note?: string;
}) {
  return (
    <li className="flex items-start gap-4 px-4 py-4">
      <UserAvatar name={user.name} hue={user.hue} size="sm" />
      <div className="min-w-0 flex-1 leading-snug">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="font-bold">{user.name}</span>
          <span className="text-sm text-muted-foreground">{summary}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {id} · {by} · {relativeTime(at)}
          {note && ` · ${note}`}
        </div>
      </div>
      {decision === "approved" ? (
        <StatusPill
          status="good"
          label="승인"
          icon={CircleCheckIcon}
          size="xs"
        />
      ) : (
        <StatusPill
          status="critical"
          label="거절"
          icon={CircleXIcon}
          size="xs"
        />
      )}
    </li>
  );
}

type DraftEntry = {
  key: string;
  user: MockUser;
  group: AccessGroup;
  from: UserRole | null;
  to: UserRole | null;
};

function ConfirmDialog({
  confirm,
  onClose,
  denyNote,
  setDenyNote,
  draftEntries,
  twoApprovers,
  onApprove,
  onDeny,
  onApply,
  onRemoveAdmin,
  onRevoke,
}: {
  confirm: Confirm;
  onClose: () => void;
  denyNote: string;
  setDenyNote: (v: string) => void;
  draftEntries: DraftEntry[];
  twoApprovers: boolean;
  onApprove: (r: AccessRequest) => void;
  onDeny: (r: AccessRequest) => void;
  onApply: () => void;
  onRemoveAdmin: (u: MockUser) => void;
  onRevoke: (
    key: string,
    user: MockUser,
    group: AccessGroup,
    role: UserRole,
  ) => void;
}) {
  // keep the last confirm around while the dialog animates out
  const [shown, setShown] = React.useState<Confirm>(confirm);
  if (confirm && confirm !== shown) setShown(confirm);
  const c = confirm ?? shown;

  let title = "";
  let body: React.ReactNode = null;
  let action = "확인";
  let destructive = false;
  let run = () => {};

  if (c?.kind === "approve") {
    const r = c.request;
    title = c.final
      ? `${r.user.name}님의 요청을 승인할까요?`
      : "1차 승인으로 기록할까요?";
    action = c.final ? "승인" : "1차 승인";
    run = () => onApprove(r);
    body = (
      <>
        <span className="block">{requestSummary(r)}</span>
        {!c.final && (
          <span className="mt-2 block">
            2인 승인 정책에 따라 다른 관리자 1명이 더 승인해야 권한이
            부여됩니다.
          </span>
        )}
        {c.final && r.highPrivilege && twoApprovers && r.firstApprover && (
          <span className="mt-2 block">
            {r.firstApprover.name}님이 1차 승인했습니다. 지금 승인하면 바로
            반영됩니다.
          </span>
        )}
        <span className="mt-2 block">
          데모이므로 실제 깃랩 권한은 바뀌지 않습니다.
        </span>
      </>
    );
  } else if (c?.kind === "deny") {
    const r = c.request;
    title = `${r.user.name}님의 요청을 거절할까요?`;
    action = "거절";
    destructive = true;
    run = () => onDeny(r);
    body = <span className="block">{requestSummary(r)}</span>;
  } else if (c?.kind === "apply") {
    title = `${draftEntries.length}건의 권한 변경을 적용할까요?`;
    action = "적용";
    run = onApply;
    const owners = draftEntries.filter((e) => e.to === "Owner").length;
    const removals = draftEntries.filter((e) => e.to === null).length;
    body = (
      <>
        {owners > 0 && (
          <span className="block font-bold text-amber-700 dark:text-amber-300">
            소유자 부여 {owners}건은 2인 승인 정책 대상입니다 (데모에서는 바로
            적용).
          </span>
        )}
        {removals > 0 && (
          <span className="block">
            멤버십 회수 {removals}건이 포함되어 있습니다.
          </span>
        )}
        <span className="block">데모이므로 브라우저 화면에만 반영됩니다.</span>
      </>
    );
  } else if (c?.kind === "removeAdmin") {
    title = `${c.user.name}님의 관리자 권한을 해제할까요?`;
    action = "해제";
    destructive = true;
    run = () => onRemoveAdmin(c.user);
    body = (
      <span className="block">
        그룹·프로젝트 멤버십은 그대로 유지되고 인스턴스 관리 영역 접근만
        제거됩니다. 데모이므로 실제로 바뀌지 않습니다.
      </span>
    );
  } else if (c?.kind === "revoke") {
    title = `${c.user.name}님의 ${c.group} 멤버십을 회수할까요?`;
    action = "회수";
    destructive = true;
    run = () => onRevoke(c.key, c.user, c.group, c.role);
    body = (
      <span className="block">
        현재 역할 {roleName[c.role]}. 데모이므로 실제 권한은 그대로입니다.
      </span>
    );
  }

  return (
    <AlertDialog
      open={confirm !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <AlertDialogContent
        className={cn(c?.kind === "apply" && "data-[size=default]:sm:max-w-lg")}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>

        {c?.kind === "deny" && (
          <Textarea
            value={denyNote}
            onChange={(e) => setDenyNote(e.target.value)}
            placeholder="거절 사유 (예시 기록, 실제 전송 없음)"
            aria-label="거절 사유"
          />
        )}

        {c?.kind === "apply" && (
          <ul className="thin-scrollbar flex max-h-64 flex-col divide-y overflow-y-auto rounded-lg border text-sm">
            {draftEntries.map((e) => (
              <li key={e.key} className="flex items-center gap-2 px-4 py-2">
                <span className="min-w-0 flex-1 truncate font-bold">
                  {e.user.name}
                </span>
                <GroupChip group={e.group} />
                <RoleChip role={e.from} />
                <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                <RoleChip role={e.to} />
              </li>
            ))}
          </ul>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              run();
              onClose();
            }}
          >
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
