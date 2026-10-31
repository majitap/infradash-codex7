# relay / 07

[사이트 열기](https://majitap.github.io/infradash-codex7/) · [실제 데이터 연결 가이드](docs/START-HERE.md)

**Infrastructure, in perspective.** 복잡한 시스템에서 다음 판단을 발견하는 인프라 워크스페이스. 흑연색, 절제된 라임색, 선명한 타이포그래피와 직접 탐색하는 시스템 맵을 중심으로 새롭게 설계했습니다.

## 주요 기능

- **Overview** — 핵심 지표, 시스템 맵, 우선 확인할 신호, 실행 추이, 러너와 라이선스 여유 용량
- **Delivery** — 7일/30일 집계, 날짜별 탐색, 실행 검색·상태 필터·페이지 이동·상세 보기, JSON/CSV 내보내기
- **Systems** — 선언된 연결 관계와 흐름 애니메이션, 서비스 선택, 주의 항목 필터, 목록과 자원 지표
- **Signals** — 심각도 기반 우선순위, 확인 가이드, 세션 내 확인 표시, 리포트 저장
- 하나의 JSON 수집 결과를 네 주요 화면에서 공유. 파일 가져오기, 보호된 수집 주소의 30초 갱신, 오류·오래된 데이터·미수집 처리
- 명령 팔레트 `Ctrl/⌘ K`, 집중 모드, 밝은 테마·어두운 테마, 모바일 메뉴와 반응형 화면
- 자체 호스팅 Pretendard와 Geist Mono, 키보드 포커스, 모션 감소 설정 지원

## 내일부터 실제 데이터 사용

공개 배포는 **Demo workspace**로 시작합니다. 실제 수집 결과를 가져오면 네 주요 화면이 함께 바뀝니다. 토큰과 사내 운영 정보는 공개 사이트에 포함하지 않습니다.

1. 로컬에서 npm ci 실행
2. .env.example을 .env.collector.local로 복사해 깃랩 주소·읽기 토큰·프로젝트 번호 설정
3. npm run dashboard:collect 실행
4. 사이트의 데이터 연결에서 .local/dashboard-live.json 가져오기

자세한 설정, 집계 기준과 지원 범위는 [시작 가이드](docs/START-HERE.md)에 정리했습니다. **Explore의 확장 분석 화면은 예시 데이터**이며 운영 API의 상세 라이선스·연결 상태·로그 기능은 별도 연동합니다. 신호 확인 표시는 개인 검토 기록이며 실제 인프라를 변경하지 않습니다.

## 개발과 검증

```sh
npm ci
npm run dev
npm test
npm run lint
npm run check:spacing
npx tsc --noEmit
npm run build
```

로컬 경로는 `/infradash-codex7/`입니다. GitHub Actions에서 자동 검증 후 정적 파일을 GitHub Pages로 배포합니다. 수집 주소는 Actions의 공개 주소 변수로 설정할 수 있습니다.

## 계승과 라이선스

[인프라대시 06](https://github.com/majitap/infradash-codex6)의 수집·검증·운영 API와 기존 확장 분석 기능을 계승했습니다. Git 기록과 [원본 설명](README.gemini.md)을 보존합니다. 폰트 라이선스는 `public/licenses/`에 있습니다.
