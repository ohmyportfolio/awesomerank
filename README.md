# Awesome Rank (World Rank)

세계 80억 인구 속에서 나의 위치를 체험형 데이터로 보여주는 웹 앱입니다. 라이프스타일 퀴즈, 글로벌 소득 순위, 국가 크기 비교, 글로벌 통계로 구성됩니다.

## 주요 기능

- **World Rank 라이프스타일 퀴즈**: 질문에 답하면 글로벌 백분위와 티어를 계산
- **Living Standard(소득) 랭크**: PPP/MER 기준으로 전 세계 소득 분포에서 위치 계산
- **Country Size Compare**: 인터랙티브 지도에서 국가 크기 비교
- **Global Statistics**: 글로벌 지표 요약 및 비교
- **다국어 지원**: 한국어/영어/스페인어/포르투갈어
- **SEO 대응**: 경로 기반 라우팅 + 서버에서 경로별 메타 주입

## 빠른 시작

### 1) 설치

```bash
npm run install:all
```

### 2) 개발 서버

```bash
npm run dev:all
```

- 프론트: Vite dev server
- 백엔드: Express API

### 3) 프로덕션 빌드

```bash
npm run build
```

### 4) 프로덕션 실행

```bash
npm run start
```

## 환경 변수

서버는 로컬 SQLite 또는 Turso를 사용할 수 있습니다.

- `TURSO_DATABASE_URL` (선택) : Turso 또는 libSQL URL
- `TURSO_AUTH_TOKEN` (선택) : Turso 인증 토큰
- `SITE_URL` (선택) : canonical/og/hreflang 생성에 사용 (기본값: `https://awesomerank.com`)

예시:

```bash
export TURSO_DATABASE_URL="libsql://..."
export TURSO_AUTH_TOKEN="..."
export SITE_URL="https://awesomerank.com"
```

## 데이터 출처

- 소득 분포: World Inequality Database (WID.world)
