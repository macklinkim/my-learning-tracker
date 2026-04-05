# My Learning Tracker - AI 기반 마이크로 러닝 트래커

파편화된 학습 자료(URL, 텍스트, 비디오 등)를 통합 관리하고, 학습 진도를 시각화하며, AI를 통해 학습 성취도를 분석하는 대시보드 웹 애플리케이션.

## 프로젝트 목적

- 학습 자료를 한 곳에서 통합 관리 (URL, 아티클, 비디오, 책, 노트, 문제풀이)
- 대시보드를 통한 학습 진도 시각화 (히트맵, 파이 차트, 막대그래프, Treemap)
- AI 학습 분석 및 일일 브리핑 (Gemini / OpenAI)
- Telegram 봇을 통한 학습 알림
- 칸반 보드 / 테이블 뷰 / 인라인 편집 등 인터랙티브 UI

## 시스템 아키텍처

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│   Next.js 16    │────>│   Hono API Server    │────>│  Supabase   │
│   (Vercel)      │     │ (Cloudflare Workers) │     │ (PostgreSQL)│
│   Port 3000     │     │      Port 3001       │     │  + Auth     │
└─────────────────┘     └──────────────────────┘     └─────────────┘
                               │         │
                        ┌──────┘         └──────┐
                   ┌────▼────┐          ┌───────▼───────┐
                   │ AI SDK  │          │ Telegram Bot  │
                   │ Gemini/ │          │   Webhook     │
                   │ OpenAI  │          └───────────────┘
                   └─────────┘
```

**Monorepo 구조 (Bun Workspaces)**

```
my-learning-tracker/
├── apps/
│   ├── frontend/          # Next.js 16 (App Router)
│   └── backend/           # Hono (Cloudflare Workers)
├── packages/
│   ├── shared-types/      # Zod 스키마 및 공유 타입
│   └── ui/                # 공통 디자인 시스템 (예정)
└── supabase/
    └── migrations/        # DB 마이그레이션 SQL
```

## 기술 스택

### Frontend
| 카테고리 | 라이브러리 | 용도 |
|---------|-----------|------|
| Framework | **Next.js 16** (App Router) | SSR/SSG, 라우팅, Vercel 배포 |
| UI | **Tailwind CSS v4**, **shadcn/ui** | 스타일링, UI 컴포넌트 |
| 아이콘 | **lucide-react** | 아이콘 시스템 |
| 다크 모드 | **next-themes** | 시스템/수동 다크 모드 전환 |
| 상태 관리 | **Zustand** v5 | 전역 UI 상태 (모달, 필터) |
| 서버 상태 | **TanStack Query** v5 | 데이터 페칭, 캐싱, 뮤테이션 |
| 테이블 | **TanStack Table** v8 | 데이터 그리드, 정렬, 필터링 |
| 폼 | **React Hook Form** + **Zod** v4 | 폼 관리 및 유효성 검증 |
| 드래그 앤 드롭 | **dnd-kit** | 칸반 보드 카드 이동 |
| 차트 | **Recharts** v3 | 히트맵, 파이, 막대, Treemap 차트 |
| 날짜 | **date-fns** | 날짜 포맷팅 및 계산 |
| API 클라이언트 | **Hono RPC** | 타입 안전 API 호출 |
| 인증 | **@supabase/ssr** | Next.js App Router 호환 인증 |

### Backend
| 카테고리 | 라이브러리 | 용도 |
|---------|-----------|------|
| Framework | **Hono** | 초경량 웹 프레임워크 (Edge 최적화) |
| 런타임 | **Cloudflare Workers** | 엣지 서버리스 배포 |
| 배포 | **Wrangler** CLI | Cloudflare 배포 도구 |
| 검증 | **@hono/zod-validator** | 요청 데이터 스키마 검증 |
| AI | **Vercel AI SDK** + **@ai-sdk/google**, **@ai-sdk/openai** | 학습 분석 및 브리핑 생성 |
| 알림 | **Telegram Bot API** (직접 호출) | 학습 알림 발송 |
| 스케줄링 | **Cloudflare Cron Triggers** | 매 정시 AI 브리핑 자동 발송 |

### Database & Auth
| 카테고리 | 기술 | 용도 |
|---------|------|------|
| BaaS | **Supabase** | PostgreSQL + Auth + RLS |
| DB | **PostgreSQL** | profiles, topics, learning_items, progress_logs, codes |
| 인증 | **Supabase Auth** | 이메일/OAuth 로그인, JWT 발급 |
| 보안 | **Row Level Security** | 사용자별 데이터 격리 |

### Infrastructure
| 카테고리 | 기술 |
|---------|------|
| 패키지 매니저 | **Bun** |
| 모노레포 | **Bun Workspaces** |
| Frontend 배포 | **Vercel** |
| Backend 배포 | **Cloudflare Workers** |
| 언어 | **TypeScript** (전체) |

## DB 스키마

```
auth.users (Supabase 관리)
    └── profiles          # 사용자 프로필 (1:1)
            └── topics    # 학습 카테고리 (트리 구조, 자기참조)
                    └── learning_items  # 학습 아이템
                            └── progress_logs  # 진도 기록

codes                     # 공통 코드 마스터 (콘텐츠 유형, 상태)
```

| 테이블 | 역할 | 주요 관계 |
|--------|------|-----------|
| `profiles` | 사용자 프로필 + Streak + Telegram 설정 | `auth.users` 1:1 |
| `topics` | 학습 카테고리 / 로드맵 노드 | 자기참조(`parent_id`) 트리 |
| `learning_items` | 학습 자료 카드 | `topics` N:1, 자기참조(`prerequisite_id`) |
| `progress_logs` | 일별 학습 기록 | `learning_items` N:1 |
| `codes` | 공통 코드 마스터 | 독립 (content_type, item_status 그룹) |

## API 엔드포인트

### Public
| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | Health check |
| GET | `/health` | 상세 상태 |
| POST | `/webhook/telegram` | Telegram Bot Webhook |

### Protected (Bearer JWT)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/codes` | 공통 코드 조회 |
| GET/POST/PUT/DELETE | `/api/topics` | 토픽 CRUD |
| GET/POST/PUT/DELETE | `/api/learning-items` | 학습 아이템 CRUD |
| GET/POST/DELETE | `/api/progress-logs` | 진도 기록 CRD |
| GET/PUT | `/api/profile` | 프로필 조회/수정 |
| POST | `/api/ai/briefing` | AI 학습 브리핑 생성 |

## 주요 화면

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 로그인 | `/login` | 이메일/비밀번호 로그인 |
| 회원가입 | `/signup` | 신규 계정 생성 |
| 대시보드 | `/` | 히트맵, 파이 차트, 막대그래프, Treemap, AI 브리핑 |
| 학습 목록 | `/items` | TanStack Table 데이터 그리드, 인라인 상태 변경 |
| 칸반 보드 | `/kanban` | dnd-kit 드래그 앤 드롭 상태 관리 |
| 설정 | `/settings` | Telegram 연동, 브리핑 시간 설정 |

## 시작하기

### 사전 요구사항
- [Bun](https://bun.sh/) v1.0+
- Supabase 프로젝트 (PostgreSQL + Auth)
- Cloudflare 계정 (Workers 배포용)

### 설치

```bash
cd my-learning-tracker
bun install
```

### 환경 변수 설정

**Frontend** (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend** (`apps/backend/.dev.vars`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key
```

### 개발 서버 실행

```bash
# Frontend (포트 3000)
bun run dev:frontend

# Backend (포트 3001)
bun run dev:backend
```

### 배포

```bash
# Frontend → Vercel
bun run build:frontend

# Backend → Cloudflare Workers
cd apps/backend && bunx wrangler deploy
```

## 개발 진행 상황

| Phase | 이름 | 상태 |
|-------|------|------|
| 1 | 초기 설정 및 데이터베이스 (Foundation & DB) | ✅ 완료 |
| 2 | API 계층 및 인증 (API & Auth) | ✅ 완료 |
| 3 | 핵심 대시보드 UI (Core UI & Data Grid) | ✅ 완료 |
| 4 | 고급 상호작용 (Interactive Features) | ✅ 완료 |
| 5 | AI 자동화 및 알림 (AI & Automation) | ✅ 완료 |
| 6 | 확장 기능 및 LMS 특화 UX (Extra Features) | 🔲 예정 |

### 최근 작업 내역 (2026-04-05)
- 대시보드 반응형 레이아웃 + 토픽별 막대그래프/Treemap 차트 추가
- Tooltip formatter 타입 에러 수정
- 학습 목록 페이지에 학습 기록 버튼 추가
- 학습 목록에서 상태 클릭하여 즉시 변경 가능 (인라인 상태 편집)
- codes 테이블 연동 - 콘텐츠 유형/상태를 DB 공통 코드로 관리

## 라이선스

Private Project
