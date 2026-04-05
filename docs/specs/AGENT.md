최초에 주입되는 요구사항 정의서(PRD: Product Requirements Document) 의 구조화가 무엇보다 중요.
이 문서를 복사하여 project_planning.md 등의 이름으로 저장하신 후, 4~5개로 분할하여 에이전트에게 순차적으로 지시하시면 됩니다.

Markdown
# 프로젝트 명세서: AI 기반 마이크로 러닝 트래커 (Micro-learning Tracker)

## 1. 프로젝트 목적 (Project Objective)
본 프로젝트는 파편화된 학습 자료(URL, 텍스트, 비디오 등)를 통합 관리하고, 사용자의 학습 진도율을 시각화하며, AI를 통해 학습 성취도를 평가하는 대시보드 형태의 웹 애플리케이션이다. 텔레그램 봇을 통한 알림 기능과 드래그 앤 드롭을 지원하는 인터랙티브 UI를 제공하여 최상의 사용자 경험(UX)을 달성하는 것을 목표로 한다.

## 2. 아키텍처 및 기술 스택 (Tech Stack)
본 프로젝트는 Monorepo 아키텍처를 채택하며, 프론트엔드와 백엔드 간의 완벽한 타입 안전성(End-to-End Type Safety)을 보장한다.

### 2.1. 패키지 매니저 및 모노레포 (Infrastructure)
* **Runtime & Package Manager:** `Bun` (초고속 런타임 및 패키지 설치)
* **Monorepo Tool:** `Bun Workspaces` (또는 `Turborepo` 호환)

### 2.2. 프론트엔드 (Frontend - Next.js)
* **Framework:** `Next.js` (App Router 방식)
* **UI & Styling:** `Tailwind CSS`, `shadcn/ui`, `lucide-react` (아이콘)
* **Data Fetching & State:** * 서버 통신 및 캐싱: `TanStack Query (React Query)`
  * 클라이언트 전역 상태: `Zustand` (Recoil 대비 가볍고 모던한 대안으로 확정)
* **Data Grid & Form:** * 테이블: `TanStack Table (v8)`
  * 폼 및 검증: `React Hook Form`, `Zod`
* **Interaction & Visualization:**
  * 드래그 앤 드롭 (칸반 보드): `dnd-kit`
  * 차트 및 그래프: `Recharts` (shadcn/ui 내장 지원)
* **API Client:** `Hono RPC` (백엔드 타입 공유)

### 2.3. 백엔드 (Backend - Hono API)
* **Framework:** `Hono` (Cloudflare Workers 환경 타겟팅)
* **Deployment Tool:** `Wrangler` CLI (Cloudflare 배포용)
* **Validation:** `@hono/zod-validator` (요청 데이터 검증)
* **AI Integration:** `Vercel AI SDK`, `OpenAI API` (또는 `Gemini API`) - 학습 진도 평가 및 피드백 생성
* **Notification:** 텔레그램 Webhook 연동 (Cloudflare Workers 환경 맞춤)
* **Scheduling:** Cloudflare `Cron Triggers` (정기 알림 및 요약)

### 2.4. 데이터베이스 및 인증 (Database & Auth)
* **BaaS:** `Supabase`
* **Auth:** `@supabase/supabase-js`, `@supabase/ssr` (Next.js App Router 호환 인증)
* **Database:** PostgreSQL (Supabase 제공)

---

## 3. 프로젝트 폴더 구조 (Project Structure)
AI 에이전트가 각 영역을 침범하지 않고 독립적으로 코드를 작성할 수 있도록 명확하게 분리된 구조를 가진다.

```text
my-learning-tracker/
├── package.json          # Root workspace 설정 (Bun workspaces)
├── bun.lockb
├── apps/
│   ├── frontend/         # Next.js 애플리케이션 (포트 3000)
│   │   ├── src/app/      # App 라우터 페이지
│   │   ├── src/components/ # shadcn/ui 및 커스텀 컴포넌트
│   │   └── package.json
│   └── backend/          # Hono API 서버 (Cloudflare Workers 타겟, 포트 3001)
│       ├── src/index.ts  # 진입점 및 라우터
│       ├── src/services/ # AI, Telegram 로직
│       ├── wrangler.toml # Cloudflare Workers 설정 파일
│       └── package.json
└── packages/
    ├── shared-types/     # 프론트/백엔드 공유 Zod 스키마 및 타입
    │   ├── src/index.ts
    │   └── package.json
    └── ui/               # (옵션) 공통 디자인 시스템 컴포넌트
```

## 4. 개발 진행 과정 (Development Phases)

- 이 섹션은 AI 에이전트에게 순차적으로 작업을 지시하기 위한 마일스톤이다. (각 페이즈를 별도의 프롬프트로 분리하여 진행할 것)

### Phase 1: 초기 설정 및 데이터베이스 (Foundation & DB)

- Bun Workspaces를 이용한 모노레포 구조 스캐폴딩.
- Supabase 프로젝트 생성 및 SQL 스키마 작성 (users, topics, learning_items, progress_logs).
- 프론트엔드(apps/frontend) Next.js 초기화 및 Tailwind/shadcn/ui 설정.
- 백엔드(apps/backend) Hono 초기화 및 Cloudflare Workers 배포 환경 구성(`wrangler.toml` 등 설정).
- packages/shared-types에 핵심 DB 모델에 대한 Zod 스키마 정의.

### Phase 2: API 계층 및 인증 (API & Auth)

- Supabase Auth 연동 (Next.js 미들웨어 및 서버 컴포넌트에서 세션 처리).
- Hono 백엔드에 CRUD API 엔드포인트 작성 및 @hono/zod-validator 적용.
- Next.js 프론트엔드에 Hono RPC 클라이언트를 설정하여 타입 안전하게 백엔드와 연결.
- TanStack Query를 세팅하여 기초 데이터 Fetching 테스트.

### Phase 3: 핵심 대시보드 UI (Core UI & Data Grid)

- shadcn/ui 컴포넌트(Card, Button, Input 등) 설치 및 레이아웃 구성.
- TanStack Table을 활용하여 학습 목록 데이터 그리드 구현.
- 인라인 수정(Inline Editing) 기능 추가 및 수정 사항을 Hono API로 전송(Mutation).
- Recharts를 이용해 개인별 학습 진도율 및 카테고리별 비중을 차트로 시각화.

### Phase 4: 고급 상호작용 (Interactive Features)

- Zustand를 활용하여 필터링 상태, 모달 열림/닫힘 등의 전역 UI 상태 관리.
- dnd-kit을 도입하여 학습 아이템을 '할 일/진행 중/완료' 상태로 드래그 앤 드롭 이동시키는 칸반 보드 구현.
- React Hook Form을 사용한 복잡한 데이터 입력 모달 구축.

### Phase 5: AI 자동화 및 알림 (AI & Automation)

- Hono 백엔드에 Telegraf.js를 연동하여 사용자의 Telegram 계정과 시스템 연결(Webhook 기반).
Vercel AI SDK를 활용하여 사용자의 일주일간 progress_logs 데이터를 분석하고, 다음 학습 방향을 추천하는 프롬프트 엔지니어링 및 API 엔드포인트 구현.
Cloudflare `Cron Triggers`를 설정하여 매일 정해진 시간에 Telegram으로 AI 학습 브리핑 메시지 발송 로직 구현.

### Phase 6: 확장 기능 및 LMS 특화 UX 구현 (Extra Features)

- GitHub/Duolingo 방식의 **'학습 잔디 심기 (Activity Heatmap 및 Streak)'** 컴포넌트 추가 및 백엔드 로직 연동.
- Notion/Pocket 방식의 **'스크랩북 인박스 (Scrapbook Inbox)'** 페이지를 신설하여 분류되지 않은 URL 자료의 빠른 저장 및 관리 구현.
- Udemy/Inflearn 방식의 **'학습 로드맵(Learning Path)'** 시각화 트리 UI 병합.
- Notion/Readwise 방식의 **'자동 메타데이터 스크래핑 (Auto Metadata Extraction)'** 기능 도입으로 URL 입력 시 제목과 썸네일 자동 파싱.
---