# 프로젝트 명세서: AI 기반 마이크로 러닝 트래커 (Micro-learning Tracker)

## 1. 프로젝트 목적 (Project Objective)
본 프로젝트는 파편화된 학습 자료(URL, 텍스트, 비디오 등)를 통합 관리하고, 사용자의 학습 진도율을 시각화하며, AI를 통해 학습 성취도를 평가하는 대시보드 형태의 웹 애플리케이션이다. 텔레그램 봇을 통한 알림 기능과 드래그 앤 드롭을 지원하는 인터랙티브 UI를 제공하여 최상의 사용자 경험(UX)을 달성하는 것을 목표로 한다.

### 1.1 주요 추가 기능 (LMS/생산성 앱 벤치마킹)
유명 프론트엔드/학습 서비스의 유용한 기능을 적극 차용하여 사용자 경험을 극대화합니다.
1. **학습 잔디 심기 (Activity Heatmap) 및 스트릭(Streak)**
   * **출처:** GitHub, Duolingo, 백준(Baekjoon)
   * **기능:** 매일 학습 기록(강의 시청, 아티클 읽기, 문제 풀이 등)을 연속적으로 이어가도록 유도하는 잔디(Heatmap) UI. 동기 부여에 매우 효과적입니다.
2. **스크랩북 인박스 (Scrapbook Inbox)**
   * **출처:** Notion Web Clipper, Pocket
   * **기능:** 학습할 링크나 텍스트를 정리하기 전에 임시로 던져놓는 '인박스' 페이지. 분류되지 않은 자료들을 목록화 해주고, 추후 드래그 앤 드롭으로 카테고리를 지정할 수 있도록 합니다.
3. **학습 로드맵 (Learning Path)**
   * **출처:** Udemy, 인프런(Inflearn)
   * **기능:** 단순 리스트업이 아닌, "선행 학습 -> 후행 학습"으로 이어지는 강의/문서들을 트리에 맞게 묶어주는 로드맵 뷰 제공.
4. **자동 메타데이터 스크래핑 (Auto Metadata Extraction)**
   * **출처:** Notion, Readwise
   * **기능:** 사용자가 테이블이나 입력창에 URL(유튜브, 블로그 등)만 붙여넣으면, Hono 백엔드가 즉시 해당 URL의 Open Graph 태그(제목, 썸네일 이미지) 및 예상 읽기 시간을 자동 추출하여 채워줍니다.

## 2. 아키텍처 및 기술 스택 (Tech Stack)
본 프로젝트는 Monorepo 아키텍처를 채택하며, 프론트엔드와 백엔드 간의 완벽한 타입 안전성(End-to-End Type Safety)을 보장한다. 프론트엔드는 Next.js 기반으로 구축하며 Vercel을 통해 배포한다.

### 2.1. 패키지 매니저 및 모노레포 (Infrastructure)
* **Runtime & Package Manager:** `Bun` (초고속 런타임 및 패키지 설치)
* **Monorepo Tool:** `Bun Workspaces` (또는 `Turborepo` 호환)
* **Deployment & Hosting:** 
  * Frontend: `Vercel` (Next.js 최적화)
  * Backend: `Cloudflare Workers` (Hono API, 엣지(Edge) 환경 최적화 및 초고속 응답)

### 2.2. 프론트엔드 (Frontend - Next.js)
* **Framework:** `Next.js` (App Router 방식, Vercel 배포)
* **UI & Styling:** `Tailwind CSS`, `shadcn/ui`, `lucide-react` (아이콘), `next-themes` (시스템 및 유저 기반 전체 다크 모드 완벽 지원)
* **Date Utility:** `date-fns` (날짜 및 시간 포맷팅, 계산, 조작에 활용)
* **Data Fetching & State:** 
  * 서버 통신 및 캐싱: `TanStack Query (React Query)`
  * 클라이언트 전역 상태: `Zustand` (Recoil 대비 가볍고 모던한 대안으로 확정)
* **Data Grid & Form:** 
  * 테이블: `TanStack Table (v8)`
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
