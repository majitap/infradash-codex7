import { MOCK_NOW, MOCK_TODAY, addDays, addMinutes, daysBetween, intBetween, mulberry32 } from "./core"
import { committers, joiners, users, type MockUser, type UserRole } from "./users"

/** Top-level GitLab groups that access is granted on. */
export const ACCESS_GROUPS = ["platform", "backend", "frontend", "data", "mobile", "infra"] as const
export type AccessGroup = (typeof ACCESS_GROUPS)[number]

/** Lowest to highest. */
export const ROLE_ORDER: UserRole[] = ["Guest", "Reporter", "Developer", "Maintainer", "Owner"]

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  Guest: "이슈 보기와 작성만 가능",
  Reporter: "코드 읽기, 이슈·라벨 관리",
  Developer: "브랜치 푸시, 병합 요청 생성, 파이프라인 실행",
  Maintainer: "보호 브랜치 머지, 빌드·배포·멤버 관리",
  Owner: "그룹 설정, 삭제, 소유자 지정",
}

export function roleRank(role: UserRole | null) {
  return role ? ROLE_ORDER.indexOf(role) : -1
}

const DEPT_GROUP: Record<string, AccessGroup> = {
  플랫폼: "platform",
  백엔드: "backend",
  프론트엔드: "frontend",
  데이터: "data",
  모바일: "mobile",
  QA: "backend",
  보안: "platform",
  SRE: "infra",
  DevOps: "infra",
}

export function primaryGroupOf(user: MockUser): AccessGroup {
  return DEPT_GROUP[user.department] ?? "platform"
}

// ---------------------------------------------------------------------------
// memberships
// ---------------------------------------------------------------------------

export type Membership = {
  userId: number
  group: AccessGroup
  role: UserRole
  /** temporary access ends on this date; null = permanent */
  expiresAt: string | null
  grantedAt: string
}

export function membershipKey(userId: number, group: AccessGroup) {
  return `${userId}:${group}`
}

function buildMemberships(): Membership[] {
  const rand = mulberry32(4242)
  const out: Membership[] = []
  for (const u of users) {
    if (u.status === "deactivated" || u.status === "pending") continue
    const primary = primaryGroupOf(u)
    out.push({ userId: u.id, group: primary, role: u.role, expiresAt: null, grantedAt: u.joinedAt })
    const extras = intBetween(rand, 0, 2)
    const others = ACCESS_GROUPS.filter((g) => g !== primary)
    for (let k = 0; k < extras; k++) {
      const g = others[Math.floor(rand() * others.length)]
      if (out.some((m) => m.userId === u.id && m.group === g)) continue
      const temporary = rand() < 0.35
      out.push({
        userId: u.id,
        group: g,
        role: rand() < 0.6 ? "Reporter" : "Developer",
        expiresAt: temporary ? addDays(MOCK_TODAY, intBetween(rand, 2, 40)) : null,
        grantedAt: addDays(MOCK_TODAY, -intBetween(rand, 5, 300)),
      })
    }
  }
  return out
}

export const memberships: Membership[] = buildMemberships()

/** active instance admins, used as approvers in the mock history */
const admins0 = users.filter((u) => u.isAdmin && u.status === "active")

export function membershipOf(userId: number, group: AccessGroup) {
  return memberships.find((m) => m.userId === userId && m.group === group) ?? null
}

/** Users that appear in the membership editor: everyone who holds or awaits access. */
export const accessUsers: MockUser[] = users
  .filter((u) => u.status !== "deactivated")
  .sort((a, b) => roleRank(b.role) - roleRank(a.role) || a.name.localeCompare(b.name, "ko"))

// ---------------------------------------------------------------------------
// access requests
// ---------------------------------------------------------------------------

export type AccessRequestKind = "group_access" | "role_upgrade" | "admin" | "temporary"
export type RequestedRole = UserRole | "Admin"

export type AccessRequest = {
  id: string
  user: MockUser
  kind: AccessRequestKind
  group: AccessGroup | null
  currentRole: UserRole | null
  requestedRole: RequestedRole
  reason: string
  requestedAt: string
  /** null = permanent */
  durationDays: number | null
  /** Owner or instance admin: needs a second approver by policy */
  highPrivilege: boolean
  /** an admin who already approved (first of two), if any */
  firstApprover: MockUser | null
}

export const REQUEST_KIND_LABELS: Record<AccessRequestKind, string> = {
  group_access: "그룹 접근",
  role_upgrade: "권한 상향",
  admin: "관리자 권한",
  temporary: "임시 접근",
}

function freeGroup(user: MockUser, prefer: AccessGroup[]): AccessGroup {
  return prefer.find((g) => !membershipOf(user.id, g)) ?? ACCESS_GROUPS.find((g) => !membershipOf(user.id, g)) ?? prefer[0]
}

function buildRequests(): AccessRequest[] {
  const used = new Set<number>()
  // requesters are never instance admins: an admin would not need to ask
  const take = (pred: (u: MockUser) => boolean, pool: MockUser[] = committers) => {
    const eligible = pool.filter((x) => !x.isAdmin && !used.has(x.id))
    const u = eligible.find(pred) ?? eligible[0] ?? pool[0]
    used.add(u.id)
    return u
  }
  const at = (hoursAgo: number) => addMinutes(MOCK_NOW, -hoursAgo * 60)

  const newHire1 = take(() => true, joiners.filter((u) => u.status === "active"))
  const newHire2 = take(() => true, joiners.filter((u) => u.status === "active"))
  const dev = take((u) => u.role === "Developer")
  const maint = take((u) => u.role === "Maintainer")
  const sre = take((u) => u.department === "SRE" || u.department === "DevOps")
  const anyDev = take((u) => u.role === "Developer")
  const invited = take(() => true, users.filter((u) => u.status === "pending"))
  const dataDev = take((u) => u.department === "데이터" || u.department === "백엔드")

  const g1 = freeGroup(newHire1, [primaryGroupOf(newHire1), "frontend", "backend"])
  const g2 = freeGroup(newHire2, [primaryGroupOf(newHire2), "data", "platform"])
  const devGroup = primaryGroupOf(dev)
  const maintGroup = primaryGroupOf(maint)
  const tempGroup = freeGroup(anyDev, ["infra", "platform"])
  const dataGroup = freeGroup(dataDev, ["data", "backend"])

  return [
    {
      id: "AR-318",
      user: maint,
      kind: "role_upgrade",
      group: maintGroup,
      currentRole: membershipOf(maint.id, maintGroup)?.role ?? "Maintainer",
      requestedRole: "Owner",
      reason: "팀 리드 승격에 따라 그룹 설정과 하위 그룹 생성 권한이 필요합니다.",
      requestedAt: at(2),
      durationDays: null,
      highPrivilege: true,
      firstApprover: admins0.find((a) => a.id !== maint.id) ?? null,
    },
    {
      id: "AR-317",
      user: sre,
      kind: "admin",
      group: null,
      currentRole: null,
      requestedRole: "Admin",
      reason: "11월 15일 깃랩 업그레이드 작업 기간 동안 인스턴스 관리자 권한이 필요합니다.",
      requestedAt: at(5),
      durationDays: 14,
      highPrivilege: true,
      firstApprover: null,
    },
    {
      id: "AR-316",
      user: newHire1,
      kind: "group_access",
      group: g1,
      currentRole: null,
      requestedRole: "Developer",
      reason: "신규 입사자 온보딩 과제 수행을 위해 저장소 푸시 권한이 필요합니다.",
      requestedAt: at(9),
      durationDays: null,
      highPrivilege: false,
      firstApprover: null,
    },
    {
      id: "AR-315",
      user: dev,
      kind: "role_upgrade",
      group: devGroup,
      currentRole: membershipOf(dev.id, devGroup)?.role ?? "Developer",
      requestedRole: "Maintainer",
      reason: "릴리스 담당자로 지정되어 보호 브랜치 머지 권한이 필요합니다.",
      requestedAt: at(14),
      durationDays: null,
      highPrivilege: false,
      firstApprover: null,
    },
    {
      id: "AR-314",
      user: anyDev,
      kind: "temporary",
      group: tempGroup,
      currentRole: membershipOf(anyDev.id, tempGroup)?.role ?? null,
      requestedRole: "Developer",
      reason: "INC-240 기탈리 볼륨 대응을 위해 인프라 저장소 수정이 필요합니다.",
      requestedAt: at(20),
      durationDays: 7,
      highPrivilege: false,
      firstApprover: null,
    },
    {
      id: "AR-313",
      user: newHire2,
      kind: "group_access",
      group: g2,
      currentRole: null,
      requestedRole: "Reporter",
      reason: "데이터 파이프라인 코드 리뷰 참여",
      requestedAt: at(27),
      durationDays: null,
      highPrivilege: false,
      firstApprover: null,
    },
    {
      id: "AR-312",
      user: invited,
      kind: "group_access",
      group: "frontend",
      currentRole: null,
      requestedRole: "Reporter",
      reason: "외부 디자인 협력사 품질 검증 담당. 계약 기간 동안 읽기 권한 요청",
      requestedAt: at(41),
      durationDays: 30,
      highPrivilege: false,
      firstApprover: null,
    },
    {
      id: "AR-311",
      user: dataDev,
      kind: "temporary",
      group: dataGroup,
      currentRole: membershipOf(dataDev.id, dataGroup)?.role ?? null,
      requestedRole: "Developer",
      reason: "분기 마감 리포트 백필 작업 (2주)",
      requestedAt: at(52),
      durationDays: 14,
      highPrivilege: false,
      firstApprover: null,
    },
  ]
}

export const accessRequests: AccessRequest[] = buildRequests()

export type RequestDecision = "approved" | "denied"

export type HandledRequest = {
  id: string
  user: MockUser
  summary: string
  decision: RequestDecision
  decidedBy: MockUser
  decidedAt: string
  note?: string
}

export const handledRequests: HandledRequest[] = [
  { id: "AR-310", user: committers[5], summary: "infra 그룹 · 개발자 (임시 7일)", decision: "approved", decidedBy: admins0[0] ?? committers[0], decidedAt: addMinutes(MOCK_NOW, -60 * 30) },
  { id: "AR-309", user: committers[9], summary: "관리자 권한", decision: "denied", decidedBy: admins0[1] ?? committers[1], decidedAt: addMinutes(MOCK_NOW, -60 * 47), note: "업무상 필요성 불충분. 그룹 소유자로 대체 가능" },
  { id: "AR-308", user: committers[14], summary: "mobile 그룹 · 조회자 → 개발자", decision: "approved", decidedBy: admins0[0] ?? committers[0], decidedAt: addMinutes(MOCK_NOW, -60 * 70) },
  { id: "AR-307", user: committers[19], summary: "data 그룹 · 소유자", decision: "denied", decidedBy: admins0[2] ?? committers[2], decidedAt: addMinutes(MOCK_NOW, -60 * 96), note: "2인 승인 정책에 따라 두 번째 승인자 거절" },
  { id: "AR-306", user: committers[22], summary: "platform 그룹 · 개발자", decision: "approved", decidedBy: admins0[1] ?? committers[1], decidedAt: addMinutes(MOCK_NOW, -60 * 120) },
  { id: "AR-305", user: committers[26], summary: "backend 그룹 · 개발자 → 유지관리자", decision: "approved", decidedBy: admins0[2] ?? committers[2], decidedAt: addMinutes(MOCK_NOW, -60 * 150) },
]

// ---------------------------------------------------------------------------
// instance admins
// ---------------------------------------------------------------------------

export const ADMIN_LIMIT = 5

export const adminAccounts: MockUser[] = users
  .filter((u) => u.isAdmin && u.status !== "deactivated")
  .sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""))

// ---------------------------------------------------------------------------
// role permission matrix (GitLab project/group permissions, simplified)
// ---------------------------------------------------------------------------

export type Permission = { key: string; label: string; category: string; minRole: UserRole }

export const PERMISSIONS: Permission[] = [
  { key: "view", label: "프로젝트·이슈 보기", category: "기본", minRole: "Guest" },
  { key: "issue", label: "이슈 생성과 댓글", category: "기본", minRole: "Guest" },
  { key: "code", label: "비공개 저장소 코드 읽기", category: "코드", minRole: "Reporter" },
  { key: "labels", label: "라벨·마일스톤 관리", category: "코드", minRole: "Reporter" },
  { key: "push", label: "일반 브랜치 푸시", category: "코드", minRole: "Developer" },
  { key: "mr", label: "머지 리퀘스트 생성", category: "코드", minRole: "Developer" },
  { key: "protected", label: "보호 브랜치 푸시·머지", category: "코드", minRole: "Maintainer" },
  { key: "pipeline", label: "파이프라인 실행·재시도", category: "빌드·배포", minRole: "Developer" },
  { key: "variables", label: "빌드·배포 변수 관리", category: "빌드·배포", minRole: "Maintainer" },
  { key: "runners", label: "프로젝트 러너 관리", category: "빌드·배포", minRole: "Maintainer" },
  { key: "deploy", label: "보호된 환경 배포", category: "빌드·배포", minRole: "Maintainer" },
  { key: "members", label: "멤버 추가 (유지관리자 이하)", category: "관리", minRole: "Maintainer" },
  { key: "settings", label: "프로젝트 설정 변경", category: "관리", minRole: "Maintainer" },
  { key: "owners", label: "소유자 지정·그룹 설정", category: "관리", minRole: "Owner" },
  { key: "delete", label: "프로젝트 삭제·이전", category: "관리", minRole: "Owner" },
]

export function hasPermission(role: UserRole, p: Permission) {
  return roleRank(role) >= roleRank(p.minRole)
}

// ---------------------------------------------------------------------------
// policies
// ---------------------------------------------------------------------------

export type AccessPolicy = { id: string; label: string; description: string; enabled: boolean }

export const accessPolicies: AccessPolicy[] = [
  { id: "two-approvers", label: "소유자·관리자 권한은 2인 승인", description: "높은 권한 요청은 서로 다른 관리자 두 명이 승인해야 반영됩니다.", enabled: true },
  { id: "signup-approval", label: "신규 가입 시 관리자 승인", description: "통합 로그인으로 처음 접속한 계정은 승인 전까지 접근할 수 없습니다.", enabled: true },
  { id: "admin-2fa", label: "관리자 2단계 인증 필수", description: "2단계 인증을 사용하지 않는 관리자는 관리자 영역에 들어갈 수 없습니다.", enabled: true },
  { id: "temp-max", label: "임시 권한 최대 30일", description: "만료일이 없는 임시 요청은 30일로 제한합니다.", enabled: true },
  { id: "external-guest", label: "외부 협력사 계정은 조회자 이하", description: "@example.com 이외 도메인 계정은 개발자 이상을 받을 수 없습니다.", enabled: true },
  { id: "dormant", label: "90일 미접속 계정 자동 비활성화", description: "장기 미접속 계정의 모든 멤버십을 회수합니다.", enabled: false },
  { id: "group-create", label: "최상위 그룹 생성은 관리자만", description: "일반 사용자는 하위 그룹만 만들 수 있습니다.", enabled: true },
]

// ---------------------------------------------------------------------------
// review lists
// ---------------------------------------------------------------------------

export const expiringMemberships = memberships
  .filter((m) => m.expiresAt !== null && daysBetween(MOCK_TODAY, m.expiresAt) <= 14)
  .sort((a, b) => (a.expiresAt ?? "").localeCompare(b.expiresAt ?? ""))

export type PrivilegeReview = { membership: Membership; user: MockUser; reason: string }

export const privilegeReviews: PrivilegeReview[] = memberships
  .filter((m) => m.role === "Maintainer" || m.role === "Owner")
  .map((m) => {
    const user = users.find((u) => u.id === m.userId)!
    const idle = user.lastActivity ? daysBetween(user.lastActivity, MOCK_TODAY) : 999
    let reason = ""
    if (user.status === "blocked") reason = "차단된 계정이 높은 권한을 보유"
    else if (idle >= 14) reason = `${idle}일째 활동 없음`
    else if (user.mrsMerged30d === 0 && user.reviews30d < 3) reason = "30일간 머지·리뷰 기록 거의 없음"
    else if (!user.twoFactor) reason = "2단계 인증 미사용"
    return { membership: m, user, reason }
  })
  .filter((r) => r.reason !== "")
  .slice(0, 6)

// ---------------------------------------------------------------------------
// permission change history
// ---------------------------------------------------------------------------

export type PermissionChange = {
  id: number
  at: string
  actor: MockUser
  subject: MockUser
  action: string
  detail: string
}

export const permissionHistory: PermissionChange[] = [
  { id: 9, at: addMinutes(MOCK_NOW, -60 * 30), actor: admins0[0] ?? committers[0], subject: committers[5], action: "임시 권한 부여", detail: "infra · 개발자 · 11월 6일 만료" },
  { id: 8, at: addMinutes(MOCK_NOW, -60 * 52), actor: admins0[1] ?? committers[1], subject: committers[11], action: "멤버십 회수", detail: "payment-service · 유지관리자 → 없음 (퇴사)" },
  { id: 7, at: addMinutes(MOCK_NOW, -60 * 70), actor: admins0[0] ?? committers[0], subject: committers[14], action: "권한 상향", detail: "mobile · 조회자 → 개발자" },
  { id: 6, at: addMinutes(MOCK_NOW, -60 * 98), actor: admins0[2] ?? committers[2], subject: committers[17], action: "관리자 해제", detail: "인스턴스 관리자 → 일반 사용자" },
  { id: 5, at: addMinutes(MOCK_NOW, -60 * 120), actor: admins0[1] ?? committers[1], subject: committers[22], action: "그룹 추가", detail: "platform · 개발자" },
  { id: 4, at: addMinutes(MOCK_NOW, -60 * 150), actor: admins0[2] ?? committers[2], subject: committers[26], action: "권한 상향", detail: "backend · 개발자 → 유지관리자" },
  { id: 3, at: addMinutes(MOCK_NOW, -60 * 190), actor: admins0[0] ?? committers[0], subject: committers[29], action: "만료일 연장", detail: "data · 조회자 · 12월 1일까지" },
]

export const pendingRequestCount = accessRequests.length
export const highPrivilegePending = accessRequests.filter((r) => r.highPrivilege).length
