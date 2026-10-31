import { mulberry32 } from "./core"

export type RunnerStatus = "online" | "offline" | "paused"
export type Executor = "docker" | "kubernetes" | "shell" | "docker-autoscaler"

export type MockRunner = {
  id: number
  name: string
  description: string
  executor: Executor
  tags: string[]
  status: RunnerStatus
  version: string
  ipAddress: string
  arch: "amd64" | "arm64"
  os: string
  concurrent: number
  jobsRunning: number
  jobsLast24h: number
  jobsLast7d: number[]
  cpuLoad: number
  memUsed: number
  lastContact: string
  registeredAt: string
  note?: string
}

const BASE: Omit<MockRunner, "jobsLast7d" | "cpuLoad" | "memUsed">[] = [
  { id: 101, name: "build-docker-01", description: "공용 도커 빌더", executor: "docker", tags: ["docker", "linux", "amd64"], status: "online", version: "18.4.1", ipAddress: "10.20.1.11", arch: "amd64", os: "Ubuntu 24.04", concurrent: 4, jobsRunning: 3, jobsLast24h: 412, lastContact: "2026-10-31T10:11:00", registeredAt: "2025-03-12" },
  { id: 102, name: "build-docker-02", description: "공용 도커 빌더", executor: "docker", tags: ["docker", "linux", "amd64"], status: "online", version: "18.4.1", ipAddress: "10.20.1.12", arch: "amd64", os: "Ubuntu 24.04", concurrent: 4, jobsRunning: 2, jobsLast24h: 388, lastContact: "2026-10-31T10:11:00", registeredAt: "2025-03-12" },
  { id: 103, name: "build-docker-03", description: "공용 도커 빌더", executor: "docker", tags: ["docker", "linux", "amd64"], status: "offline", version: "18.2.0", ipAddress: "10.20.1.13", arch: "amd64", os: "Ubuntu 22.04", concurrent: 4, jobsRunning: 0, jobsLast24h: 0, lastContact: "2026-10-29T22:05:00", registeredAt: "2025-03-12", note: "디스크 교체 작업 중" },
  { id: 104, name: "k8s-autoscale-a", description: "쿠버네티스 오토스케일 풀 A", executor: "kubernetes", tags: ["k8s", "autoscale"], status: "online", version: "18.4.1", ipAddress: "10.30.0.21", arch: "amd64", os: "Bottlerocket", concurrent: 20, jobsRunning: 7, jobsLast24h: 951, lastContact: "2026-10-31T10:12:00", registeredAt: "2025-08-02" },
  { id: 105, name: "k8s-autoscale-b", description: "쿠버네티스 오토스케일 풀 B", executor: "kubernetes", tags: ["k8s", "autoscale"], status: "online", version: "18.4.1", ipAddress: "10.30.0.22", arch: "amd64", os: "Bottlerocket", concurrent: 20, jobsRunning: 5, jobsLast24h: 870, lastContact: "2026-10-31T10:12:00", registeredAt: "2025-08-02" },
  { id: 106, name: "gpu-runner-01", description: "그래픽 연산 테스트 러너", executor: "docker", tags: ["gpu", "cuda", "linux"], status: "paused", version: "18.3.2", ipAddress: "10.40.2.5", arch: "amd64", os: "Ubuntu 24.04", concurrent: 1, jobsRunning: 0, jobsLast24h: 14, lastContact: "2026-10-31T09:30:00", registeredAt: "2026-01-20", note: "드라이버 업그레이드 대기" },
  { id: 107, name: "arm64-builder", description: "ARM64 이미지 빌더", executor: "docker-autoscaler", tags: ["arm64", "docker"], status: "online", version: "18.4.1", ipAddress: "10.20.3.7", arch: "arm64", os: "Ubuntu 24.04", concurrent: 6, jobsRunning: 1, jobsLast24h: 133, lastContact: "2026-10-31T10:10:00", registeredAt: "2026-02-11" },
  { id: 108, name: "macos-ios-01", description: "아이폰 빌드 호스트", executor: "shell", tags: ["macos", "xcode"], status: "offline", version: "17.11.3", ipAddress: "10.50.0.8", arch: "arm64", os: "macOS 15.6", concurrent: 2, jobsRunning: 0, jobsLast24h: 0, lastContact: "2026-10-27T18:12:00", registeredAt: "2025-05-30", note: "개발 도구 업데이트 후 응답 없음" },
  { id: 109, name: "macos-ios-02", description: "아이폰 빌드 호스트", executor: "shell", tags: ["macos", "xcode"], status: "online", version: "18.4.1", ipAddress: "10.50.0.9", arch: "arm64", os: "macOS 15.6", concurrent: 2, jobsRunning: 1, jobsLast24h: 57, lastContact: "2026-10-31T10:09:00", registeredAt: "2025-05-30" },
  { id: 110, name: "deploy-prod", description: "보호된 프로덕션 배포 러너", executor: "shell", tags: ["deploy", "protected"], status: "paused", version: "18.4.1", ipAddress: "10.10.0.3", arch: "amd64", os: "Ubuntu 24.04", concurrent: 1, jobsRunning: 0, jobsLast24h: 6, lastContact: "2026-10-31T08:55:00", registeredAt: "2025-01-08", note: "배포 동결 (업그레이드 창)" },
  { id: 111, name: "windows-msbuild", description: "윈도 빌드 호스트", executor: "shell", tags: ["windows", "msbuild"], status: "online", version: "18.3.2", ipAddress: "10.60.0.4", arch: "amd64", os: "Windows Server 2022", concurrent: 2, jobsRunning: 0, jobsLast24h: 42, lastContact: "2026-10-31T10:08:00", registeredAt: "2025-09-14" },
  { id: 112, name: "e2e-browser-01", description: "브라우저 e2e 러너", executor: "docker", tags: ["e2e", "browser"], status: "offline", version: "18.1.0", ipAddress: "10.20.4.2", arch: "amd64", os: "Ubuntu 22.04", concurrent: 3, jobsRunning: 0, jobsLast24h: 0, lastContact: "2026-10-30T03:47:00", registeredAt: "2025-11-03" },
]

export const runners: MockRunner[] = (() => {
  const rand = mulberry32(606)
  return BASE.map((r) => {
    const daily = r.status === "offline" ? 0 : r.jobsLast24h
    const jobsLast7d = Array.from({ length: 7 }, (_, i) => {
      if (r.status === "offline" && i >= 5) return 0
      return Math.round(daily * (0.7 + rand() * 0.6))
    })
    return {
      ...r,
      jobsLast7d,
      cpuLoad: r.status === "online" ? Math.round((r.jobsRunning / r.concurrent) * 70 + rand() * 20) : 0,
      memUsed: r.status === "online" ? Math.round(30 + rand() * 50) : 0,
    }
  })
})()

export const runnerCounts = {
  all: runners.length,
  online: runners.filter((r) => r.status === "online").length,
  offline: runners.filter((r) => r.status === "offline").length,
  paused: runners.filter((r) => r.status === "paused").length,
}

export const runnerCapacity = runners.filter((r) => r.status === "online").reduce((s, r) => s + r.concurrent, 0)
export const runnerBusy = runners.reduce((s, r) => s + r.jobsRunning, 0)
export const outdatedRunners = runners.filter((r) => r.version !== "18.4.1")
export const LATEST_RUNNER_VERSION = "18.4.1"
