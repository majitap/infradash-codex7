# 내 데이터로 시작하기

배포 주소: https://majitap.github.io/infradash-codex7/

첫 접속은 **예시 데이터 공간**입니다. 화면의 실행·용량·신호는 모두 예시 수치입니다. 실제 연결을 설정하지 않았는데 정상으로 표시하거나, 수집하지 않은 값을 임의로 만들지 않습니다. 릴레이의 다섯 주요 화면은 동일한 수집 결과를 공유합니다.

## 1. 내일 바로 파일로 시작

1. 저장소에서 `npm ci`를 실행합니다. Node.js 24 이상을 사용합니다.
2. `.env.example`을 `.env.collector.local`로 복사합니다.
3. 아래 설정을 실제 환경에 맞게 채웁니다. 토큰은 로컬 환경 파일에만 저장합니다.

```env
GITLAB_BASE_URL=https://gitlab.example.com
GITLAB_READ_TOKEN=읽기_전용_토큰
GITLAB_PROJECT_IDS=123,456
DASHBOARD_WORKSPACE=우리 팀
# 라이선스 조회 권한이 있는 별도 토큰을 사용할 때만 설정
GITLAB_LICENSE_READ_TOKEN=
```

4. `npm run dashboard:collect`를 실행합니다.
5. 사이트의 **데이터 연결 → 가져오기**에서 `.local/dashboard-live.json`을 선택합니다.

파일은 브라우저에서 처리하며 업로드하거나 영구 저장하지 않습니다. 새로고침하면 예시 모드(빌드 시 수집 주소를 설정한 경우 해당 주소)로 돌아갑니다. 수집 파일은 저장소에서 제외됩니다.

수집 명령은 지정한 프로젝트의 최근 60일 파이프라인과 프로젝트에서 사용할 수 있는 러너를 읽습니다. 프로젝트 중복과 공유 러너 중복을 제거합니다. 프로젝트별 페이지를 모두 조회하며, 한도 초과·권한 오류·조회 실패 때는 기존 파일을 덮어쓰지 않습니다. 최근 상세 실행은 30건입니다. 러너 조회에는 해당 프로젝트의 Maintainer 또는 Auditor 이상 권한이 필요합니다. 라이선스는 관리자 조회 권한이 필요하며 토큰을 생략하면 미수집으로 남습니다.

일별 차트는 **한국 시간의 생성 날짜별 성공·실패·취소 건수**입니다. 실행 중·대기·수동·건너뛴 실행은 일별 완료 집계에 포함하지 않습니다. 성공률은 `성공 / (성공 + 실패)`로 계산합니다. 최근 7일/30일은 마지막 데이터 날짜를 포함한 달력 기간이며, 이전 기간이 부족하면 증감을 표시하지 않습니다. 대기 시간·러너 동시 실행 용량·서비스 구성도·전체 건강 상태는 이 수집기가 추정하지 않습니다. 별도 수집 결과로 해당 필드를 채우거나 미수집 상태로 사용하세요.

## 2. 자동 갱신

동일한 JSON 형식을 반환하는 **인증된 HTTPS 수집 주소**가 있으면 데이터 연결 창에 입력합니다. 30초마다 조회하며, 실패하면 오류를 표시하고 이전 수집값을 유지합니다. 수집 시각이 2분 이상 지났거나 30초 이상 미래이면 오래된 데이터로 표시합니다. 현재 연결 주소는 브라우저 메모리에만 유지됩니다.

항상 같은 수집 주소로 시작하려면 GitHub 저장소의 **Settings → Secrets and variables → Actions → Variables**에 `NEXT_PUBLIC_DASHBOARD_URL`을 등록하고 배포 작업을 다시 실행합니다. 이 변수에는 공개 가능한 주소만 넣으세요. 토큰은 넣지 않습니다. 인증 쿠키와 정확한 출처(`https://majitap.github.io`)에 대한 CORS는 조직 수집 서버에서 처리합니다. GitHub Pages 자체는 수집 서버를 실행하지 않습니다.

기존 깃랩·EKS 연결 상태는 `NEXT_PUBLIC_INFRA_STATUS_URL`, 라이선스·관리자·로그 기능은 `NEXT_PUBLIC_OPERATIONS_API_URL`로 따로 연결합니다. [연결 상태 수집](LIVE-DATA-SETUP.md), [운영 API 설정](OPERATIONS-SETUP.md)을 참고하세요.

## 3. 데이터 형식

연결 창의 **예시 파일 받기**에서 전체 형식을 받을 수 있습니다. 실행 가능한 검증 기준은 [`lib/dashboard.ts`](../lib/dashboard.ts)의 `dashboardSchema`입니다.

| 필드 | 의미 |
| --- | --- |
| `schemaVersion` | `1` |
| `source` | 실제 수집은 `live`, 예시는 `demo` |
| `collectedAt` | 시간대가 포함된 수집 시각 |
| `workspace` | 표시할 운영 공간 이름 |
| `license` | `{used, total}` 또는 `null` |
| `health` | `healthy`, `degraded`, `down`, `unknown` |
| `daily` | 날짜 오름차순 `{date, success, failed, canceled}` 배열, 1~366일 |
| `runners` | `{online, offline, paused, capacity, busy}`. 용량·실행 수 미수집은 `null` |
| `queueSeconds` | 평균 대기 시간 또는 `null` |
| `runnerDetails` | 선택 필드. 러너별 `id`, `name`, `status`와 상세 정보 배열. 생략 시 빈 목록. 실행 방식·버전·태그·자원 사용량·작업 통계는 `lib/dashboard.ts`의 `runnerDetailSchema` 참고 |
| `pipelines` | `{id, project, ref, status, durationSeconds, startedAt}` 배열 |
| `services` | `{id, name, role, state, detail}` 배열, 최대 20개. 선택 필드 `cpu`, `memory`는 0~100%, `latencyMs`는 0 이상 |
| `connections` | 선택 필드. `{from, to}` 배열, 최대 100개. 등록된 서비스 ID 사이의 실제 연결만 지정. 생략하면 선 없이 구성 요소만 표시 |
| `alerts` | `{id, title, detail, severity}` 배열. 심각도는 `critical`, `warning`, `info` |

숫자는 음수를 허용하지 않습니다. 파일 크기는 2MB 이하입니다. 서비스와 알림이 없으면 빈 배열을 사용합니다. 실제 서비스 구성 요소 사이의 연결을 추측해 선으로 그리지 않습니다.

## 4. 현재 실제 데이터 범위

- **운영 개요 · 빌드·배포 · 시스템 · 운영 신호 · 러너**: 위 JSON으로 지표, 차트, 실행 상세, 시스템 맵·목록, 신호와 라이선스를 표시합니다. 실행 검색·필터·내보내기와 시스템 검색도 같은 데이터에 적용됩니다.
- **깃랩 연결 상태·라이선스 상세·관리자·로그**: 기존 보호된 운영 서버를 별도로 연결하면 실제 데이터를 사용합니다.
- **분석 메뉴의 프로젝트·비용·보안 및 기존 확장 분석 화면**: 예시 분석입니다. 다섯 주요 화면의 수집 파일과 자동 연결되지 않습니다.

운영 신호의 확인 표시는 개인의 브라우저 메모리에만 저장되며, 실제 장애나 GitLab 상태를 변경하지 않습니다. 새 수집 시각의 스냅샷이나 새로고침에서는 초기화됩니다. 파일을 가져오는 경우에도 `source` 필드가 `demo`이면 예시로 표시합니다.

러너 화면은 위 수집 파일과 함께 바뀝니다. 기본 수집기는 프로젝트 러너 목록의 번호·설명·상태를 가져오며, 버전·자원 사용률·실행 용량·작업 통계는 추정하지 않습니다. 해당 값은 별도 모니터링 수집 결과로 채울 수 있습니다. 기존 파일에 `runnerDetails`가 없어도 정상적으로 열립니다.

상단 라이선스는 예시에서 **950/1000**으로 표시합니다. 파일이나 수집 주소의 라이선스 값으로 교체되며, 별도 운영 서버가 설정되어 있으면 해당 서버의 라이선스 조회값을 우선합니다.

**관리자 → 인가 관리**는 접근 요청 승인·반려, 역할 편집, 임시 권한과 처리 이력을 검토하는 예시 화면입니다. 화면에서 처리한 변경은 현재 브라우저 메모리에만 반영됩니다. 실제 인가 처리 서버는 아직 연결되지 않았으며 기존 운영 서버의 유지보수 설정 기능과 별개입니다.

실제 사내 데이터와 인증 토큰은 공개 GitHub 저장소나 Pages 파일에 올리지 마세요. 이 배포에는 예시 데이터만 포함되어 있습니다.

## 검증

```sh
npm test
npm run lint
npm run check:spacing
npx tsc --noEmit
npm run build
```

API 구현 참고: [파이프라인](https://docs.gitlab.com/api/pipelines/), [러너](https://docs.gitlab.com/api/runners/), [라이선스](https://docs.gitlab.com/api/license/).
