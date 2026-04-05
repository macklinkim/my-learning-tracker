# Phase 1 Foundation — 설계 문서

**날짜:** 2026-03-28
**프로젝트:** AI 기반 마이크로 러닝 트래커
**범위:** Phase 1 — 초기 설정 및 데이터베이스 (Foundation & DB)

---

## 1. 목표

`classmanage/my-learning-tracker/` 경로에 Bun Workspaces 기반 모노레포를 구성하고, 프론트엔드(Next.js)·백엔드(Hono)·공유 타입(shared-types) 세 패키지의 뼈대 및 환경 설정을 완료한다.

---

## 2. 스캐폴딩 방식 (Approach A — 한 번에 전체 자동화)

1. **bun 설치** — Windows PowerShell 공식 설치 스크립트 실행
2. **루트 초기화** — `my-learning-tracker/package.json`에 workspaces 배열 선언 (`["apps/*", "packages/*"]`)
3. **패키지 생성 순서**
   - `apps/frontend` — `bun create next-app` (App Router, TypeScript, Tailwind)
   - 이후 `bunx --bun shadcn@latest init`으로 shadcn/ui 초기화 (패키지 설치가 아닌 CLI 실행)
   - `apps/backend` — `bun init` + Hono 설치 + wrangler.toml 생성
   - `packages/shared-types` — `bun init` + Zod 스키마 정의
4. **의존성 일괄 설치** — 루트에서 `bun install` 한 번으로 전체 workspace 처리
5. **환경 설정 파일 생성** — 키 값은 비운 템플릿으로만 생성

---

## 3. 폴더 구조

```
classmanage/
└── my-learning-tracker/
    ├── package.json              # workspaces: ["apps/*", "packages/*"]
    ├── bun.lockb                 # Bun 바이너리 락파일 (자동 생성)
    ├── .gitignore                # node_modules, .env*, .next, .wrangler 등 포함
    ├── apps/
    │   ├── frontend/             # Next.js 15, App Router, TypeScript (포트 3000)
    │   │   ├── src/app/
    │   │   ├── src/components/
    │   │   ├── .env.local        # Supabase 키 템플릿 (값 비움, git 제외)
    │   │   └── package.json
    │   └── backend/              # Hono, Cloudflare Workers (포트 8787)
    │       ├── src/index.ts
    │       ├── src/services/
    │       ├── wrangler.toml     # Cloudflare 설정 (공개 설정값만)
    │       ├── .dev.vars         # 로컬 개발용 Secret 템플릿 (git 제외)
    │       └── package.json
    └── packages/
        ├── shared-types/
        │   ├── src/index.ts      # Zod 스키마 + 타입 export
        │   └── package.json      # exports 필드 설정 포함
        └── ui/                   # (Phase 3 이후 활용 예정, 현재는 빈 패키지)
```

> **포트 안내:** PRD의 `포트 3001` 표기는 오기이며, Wrangler의 실제 기본 포트는 `8787`입니다. 이후 모든 Phase에서 백엔드 로컬 주소는 `http://localhost:8787`을 기준으로 합니다.

---

## 4. 의존성

### Phase 1에서 설치하는 패키지

#### apps/frontend
| 패키지 | 용도 |
|--------|------|
| next, react, react-dom | 프레임워크 |
| tailwindcss, @tailwindcss/postcss | 스타일링 |
| lucide-react | 아이콘 (shadcn/ui 의존) |
| @supabase/supabase-js, @supabase/ssr | Auth + DB 클라이언트 |
| date-fns | 날짜/시간 포맷팅 |
| typescript | 타입 시스템 |

> shadcn/ui는 `bunx --bun shadcn@latest init` CLI 실행으로 초기화 (npm 패키지가 아님)

#### apps/backend
| 패키지 | 용도 |
|--------|------|
| hono | API 프레임워크 |
| @hono/zod-validator | 요청 검증 |
| @supabase/supabase-js | DB 접근 |
| wrangler (devDependency) | Cloudflare Workers 배포/개발 |
| typescript | 타입 시스템 |

#### packages/shared-types
| 패키지 | 용도 |
|--------|------|
| zod | 스키마 정의 및 타입 추론 |
| typescript | 타입 시스템 |

### 이후 Phase에서 추가 예정 (Phase 1 미설치)

| 패키지 | 추가 시점 |
|--------|-----------|
| @tanstack/react-query | Phase 2 |
| @tanstack/react-table | Phase 3 |
| recharts | Phase 3 |
| zustand | Phase 4 |
| react-hook-form | Phase 4 |
| @dnd-kit/core, @dnd-kit/sortable | Phase 4 |
| ai (Vercel AI SDK) | Phase 5 |
| telegraf | Phase 5 |

---

## 5. 환경 변수 및 Secret 관리

### 로컬 개발

**apps/frontend/.env.local** (git 제외)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**apps/backend/.dev.vars** (git 제외, wrangler dev가 자동으로 읽는 파일)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Cloudflare Workers 배포 시

- 공개 설정값(`SUPABASE_URL` 등): `wrangler.toml`의 `[vars]`에 직접 기입
- 민감한 Secret(`SUPABASE_SERVICE_ROLE_KEY` 등): `wrangler secret put SUPABASE_SERVICE_ROLE_KEY` 명령으로 Cloudflare에 암호화 저장 (`.dev.vars`에는 절대 커밋 금지)

### apps/backend/wrangler.toml 최소 구성
```toml
name = "learning-tracker-backend"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[vars]
SUPABASE_URL = ""   # 배포 시 실제 값으로 교체
```

---

## 6. shared-types 패키지 설정

`packages/shared-types/package.json`에 `exports` 필드를 명시하여 모노레포 내 패키지 참조가 동작하도록 설정:

```json
{
  "name": "@learning-tracker/shared-types",
  "version": "0.0.1",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "require": "./src/index.ts"
    }
  },
  "main": "./src/index.ts"
}
```

`packages/shared-types/src/index.ts`에 다음 스키마 정의 및 export:

- `ContentTypeSchema` — enum: `url | article | video | book | note | problem`
- `ItemStatusSchema` — enum: `inbox | todo | in_progress | completed`
- `ProfileSchema` / `ProfileInsertSchema`
- `TopicSchema` / `TopicInsertSchema`
- `LearningItemSchema` / `LearningItemInsertSchema` / `LearningItemUpdateSchema`
- `ProgressLogSchema` / `ProgressLogInsertSchema`

---

## 7. DB 스키마 적용

SQL 스키마 전문은 `02_phase1_foundation.md` 참조 (profiles, topics, learning_items, progress_logs + RLS 정책 + 인덱스 + 신규 가입 트리거).

**적용 방법:** Supabase 대시보드 → SQL Editor → `02_phase1_foundation.md`의 SQL을 순서대로 실행

---

## 8. .gitignore 핵심 항목

```
node_modules/
.next/
.wrangler/
dist/
.env
.env.local
.env*.local
.dev.vars
# bun.lockb는 재현 가능한 빌드를 위해 git 추적 대상 (gitignore 제외)
```

---

## 9. 완료 조건

- [ ] `bun --version` 정상 출력
- [ ] `my-learning-tracker/` 폴더 구조 생성 완료 (위 3번 구조와 일치)
- [ ] 루트 `bun install` 에러 없이 완료, `bun.lockb` 파일 생성 확인
- [ ] `apps/frontend`: `bun run dev` 실행 시 `http://localhost:3000` 접속 가능
- [ ] `apps/backend`: `wrangler dev` 실행 시 `http://localhost:8787` Hono 기본 응답 확인
- [ ] `packages/shared-types`: TypeScript 컴파일 에러 없음
- [ ] 환경 변수 템플릿 파일 존재: `.env.local`, `.dev.vars`, `wrangler.toml`
- [ ] `.gitignore`에 `.env.local`, `.dev.vars` 포함 확인
- [ ] `packages/ui/` 빈 패키지 디렉토리 존재
- [ ] Supabase SQL 스키마 대시보드에서 실행 완료 (수동 작업)
