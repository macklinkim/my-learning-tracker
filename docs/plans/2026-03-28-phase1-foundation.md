# Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `classmanage/my-learning-tracker/`에 Bun Workspaces 모노레포를 구성하고 Next.js 프론트엔드, Hono 백엔드, 공유 Zod 타입 패키지의 초기 뼈대를 완성한다.

**Architecture:** 모노레포 루트에 `apps/*` (frontend, backend)와 `packages/*` (shared-types, ui) 두 workspace 그룹을 선언한다. 프론트엔드는 Next.js 15 App Router + shadcn/ui, 백엔드는 Hono on Cloudflare Workers, 타입은 `@learning-tracker/shared-types`로 양쪽에서 공유한다. 키 값이 없는 환경 변수 템플릿을 생성하고 나중에 채운다.

**Tech Stack:** Bun 1.2+, Next.js 15 (App Router), Hono, Cloudflare Workers (wrangler), Supabase, Zod, shadcn/ui, Tailwind CSS, date-fns

**Working Directory:** `/c/Users/mack/Desktop/projects/study/classmanage/`

> **포트 안내:** PRD의 `포트 3001` 표기는 오기. Wrangler 실제 기본 포트는 `8787`. 이후 모든 Phase에서 백엔드 로컬 주소는 `http://localhost:8787`을 기준으로 한다.

> **락파일 안내:** Bun 1.2+ 는 `bun.lock` (텍스트 형식) 을 사용한다. `bun.lockb` (바이너리)는 1.1 이하에서 사용된 구형 포맷이므로 혼동 주의.

---

## 파일 구조 (생성 대상)

```
my-learning-tracker/
├── package.json                          # 루트 workspace 선언
├── tsconfig.json                         # 공통 TypeScript 베이스 설정
├── .gitignore
├── apps/
│   ├── frontend/                         # create-next-app 생성
│   │   ├── src/app/layout.tsx
│   │   ├── src/app/page.tsx
│   │   ├── components.json               # shadcn/ui init 생성
│   │   ├── .env.local                    # Supabase 키 템플릿 (플레이스홀더 포함)
│   │   └── package.json                  # @learning-tracker/shared-types 의존성 포함
│   └── backend/
│       ├── src/index.ts                  # Hono 앱 진입점
│       ├── src/services/                 # (빈 디렉토리, Phase 5에서 사용)
│       ├── wrangler.toml                 # Cloudflare Workers 설정
│       ├── .dev.vars                     # 로컬 Secret 템플릿 (플레이스홀더 포함)
│       ├── tsconfig.json
│       └── package.json                  # @learning-tracker/shared-types 의존성 포함
└── packages/
    ├── shared-types/
    │   ├── src/index.ts                  # Zod 스키마 + 타입 export
    │   ├── src/index.test.ts             # Bun test
    │   ├── tsconfig.json
    │   └── package.json                  # exports 필드 포함
    └── ui/
        └── package.json                  # 빈 패키지 (Phase 3 예정)
```

---

## Task 1: Bun 설치

**Files:** 없음 (글로벌 설치)

- [ ] **Step 1: npm으로 bun 전역 설치**

```bash
npm install -g bun
```

- [ ] **Step 2: 설치 확인**

```bash
bun --version
```

Expected: `1.x.x` 형태 (예: `1.2.5`). PATH가 갱신되지 않으면 터미널 재시작 후 재확인.

---

## Task 2: 모노레포 루트 초기화

**Files:**
- Create: `my-learning-tracker/package.json`
- Create: `my-learning-tracker/tsconfig.json`
- Create: `my-learning-tracker/.gitignore`

- [ ] **Step 1: 디렉토리 구조 생성**

```bash
cd "/c/Users/mack/Desktop/projects/study/classmanage"
mkdir -p my-learning-tracker/apps my-learning-tracker/packages
```

- [ ] **Step 2: 루트 package.json 생성**

```bash
cat > my-learning-tracker/package.json << 'EOF'
{
  "name": "my-learning-tracker",
  "version": "0.0.1",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:frontend": "bun run --cwd apps/frontend dev",
    "dev:backend": "bun run --cwd apps/backend dev",
    "build:frontend": "bun run --cwd apps/frontend build",
    "test": "bun run --cwd packages/shared-types test",
    "typecheck": "bun run --cwd packages/shared-types typecheck"
  }
}
EOF
```

- [ ] **Step 3: 루트 tsconfig.json 생성 (각 패키지가 extends 할 베이스)**

```bash
cat > my-learning-tracker/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
EOF
```

- [ ] **Step 4: .gitignore 생성**

```bash
cat > my-learning-tracker/.gitignore << 'EOF'
# Dependencies
node_modules/

# Build outputs
.next/
dist/
.wrangler/

# Environment (절대 커밋 금지)
.env
.env.local
.env*.local
.dev.vars

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# bun.lock은 재현 가능한 빌드를 위해 git 추적 대상 (gitignore 제외)
EOF
```

- [ ] **Step 5: 구조 확인**

```bash
ls my-learning-tracker/
```

Expected: `apps/  packages/  package.json  tsconfig.json  .gitignore`

---

## Task 3: apps/frontend — Next.js 초기화

**Files:** `apps/frontend/` 전체 (create-next-app 생성)

- [ ] **Step 1: Next.js 프로젝트 생성 (비대화형)**

```bash
cd "/c/Users/mack/Desktop/projects/study/classmanage/my-learning-tracker"
bunx create-next-app@latest apps/frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack \
  --use-bun \
  --disable-git
```

Expected: `apps/frontend/` 디렉토리 생성, `Success!` 메시지

- [ ] **Step 2: 생성된 파일 구조 확인**

```bash
ls apps/frontend/
```

Expected: `src/  package.json  next.config.ts  tsconfig.json` 등

- [ ] **Step 3: 개발 서버 기동 테스트**

```bash
cd apps/frontend
bun run dev &
DEV_PID=$!
sleep 8
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200`

- [ ] **Step 4: 개발 서버 종료 후 루트 복귀**

```bash
kill $DEV_PID 2>/dev/null
pkill -f "next dev" 2>/dev/null
cd "/c/Users/mack/Desktop/projects/study/classmanage/my-learning-tracker"
```

---

## Task 4: apps/frontend — shadcn/ui + 추가 의존성

**Files:**
- Create: `apps/frontend/components.json` (shadcn init 생성)
- Modify: `apps/frontend/.env.local`

- [ ] **Step 1: shadcn/ui 초기화**

```bash
cd "/c/Users/mack/Desktop/projects/study/classmanage/my-learning-tracker/apps/frontend"
bunx --bun shadcn@latest init --yes
```

Expected: `components.json` 생성, `src/lib/utils.ts` 생성

- [ ] **Step 2: 추가 의존성 설치**

```bash
bun add lucide-react @supabase/supabase-js @supabase/ssr date-fns
```

Expected: 패키지 설치 완료, 에러 없음

- [ ] **Step 3: .env.local 플레이스홀더 생성**

> 빌드 시 환경변수 누락 에러를 방지하기 위해 실제 값처럼 보이는 플레이스홀더를 사용한다.
> Phase 1 완료 후 실제 Supabase 키로 교체 필요.

```bash
cat > .env.local << 'EOF'
# Supabase - https://supabase.com/dashboard/project/_/settings/api 에서 실제 값으로 교체
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
EOF
```

- [ ] **Step 4: 빌드 확인**

```bash
bun run build 2>&1 | tail -10
```

Expected: `✓ Compiled` 또는 `Generating static pages` 포함 성공 메시지

- [ ] **Step 5: 루트 복귀**

```bash
cd "/c/Users/mack/Desktop/projects/study/classmanage/my-learning-tracker"
```

---

## Task 5: apps/backend — Hono + Cloudflare Workers 초기화

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/src/index.ts`
- Create: `apps/backend/src/services/.gitkeep`
- Create: `apps/backend/wrangler.toml`
- Create: `apps/backend/.dev.vars`

- [ ] **Step 1: backend 디렉토리 및 package.json 생성**

```bash
mkdir -p apps/backend/src/services
cat > apps/backend/package.json << 'EOF'
{
  "name": "@learning-tracker/backend",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typecheck": "bunx tsc --noEmit"
  }
}
EOF
```

- [ ] **Step 2: backend tsconfig.json 생성**

```bash
cat > apps/backend/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ES2022",
    "moduleResolution": "bundler",
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"]
}
EOF
```

- [ ] **Step 3: Hono 및 관련 패키지 설치**

```bash
cd apps/backend
bun add hono @hono/zod-validator @supabase/supabase-js zod
bun add -d wrangler @cloudflare/workers-types typescript
```

Expected: 패키지 설치 완료, 에러 없음

- [ ] **Step 4: Hono 진입점 작성 (src/index.ts)**

```bash
cat > src/index.ts << 'EOF'
import { Hono } from 'hono'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.json({ message: 'Learning Tracker API', status: 'ok' })
})

app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

export default app
EOF
```

- [ ] **Step 5: src/services 디렉토리 보존용 파일 생성**

```bash
touch src/services/.gitkeep
```

- [ ] **Step 6: wrangler.toml 생성**

```bash
cat > wrangler.toml << 'EOF'
name = "learning-tracker-backend"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
# 민감하지 않은 공개 설정값만 여기에 기입
# 배포 시 실제 값으로 교체
SUPABASE_URL = "https://placeholder.supabase.co"

# 민감한 Secret은 아래 명령으로 Cloudflare에 암호화 저장:
# wrangler secret put SUPABASE_SERVICE_ROLE_KEY
EOF
```

- [ ] **Step 7: .dev.vars 플레이스홀더 생성 (로컬 개발용)**

```bash
cat > .dev.vars << 'EOF'
# 로컬 개발 전용 - wrangler dev가 자동으로 읽음
# 절대 git에 커밋하지 말 것. 실제 Supabase 값으로 교체 필요.
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key
EOF
```

- [ ] **Step 8: wrangler dev로 기동 테스트**

```bash
bun run dev &
WRANGLER_PID=$!
sleep 8
curl -s http://localhost:8787/
```

Expected:
```json
{"message":"Learning Tracker API","status":"ok"}
```

- [ ] **Step 9: wrangler dev 종료 후 루트 복귀**

```bash
kill $WRANGLER_PID 2>/dev/null
pkill -f "wrangler dev" 2>/dev/null
cd "/c/Users/mack/Desktop/projects/study/classmanage/my-learning-tracker"
```

---

## Task 6: packages/shared-types — Zod 스키마 (TDD)

**Files:**
- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/index.test.ts` ← 먼저 작성
- Create: `packages/shared-types/src/index.ts` ← 테스트 통과 후 작성

- [ ] **Step 1: shared-types 디렉토리 및 package.json 생성**

```bash
mkdir -p packages/shared-types/src
cat > packages/shared-types/package.json << 'EOF'
{
  "name": "@learning-tracker/shared-types",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "require": "./src/index.ts"
    }
  },
  "main": "./src/index.ts",
  "scripts": {
    "test": "bun test",
    "typecheck": "bunx tsc --noEmit"
  }
}
EOF
```

- [ ] **Step 2: tsconfig.json 생성**

```bash
cat > packages/shared-types/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
EOF
```

- [ ] **Step 3: Zod 설치**

```bash
bun add zod --cwd packages/shared-types
bun add -d typescript --cwd packages/shared-types
```

- [ ] **Step 4: 실패하는 테스트 먼저 작성 (TDD — Red 단계)**

```bash
cat > packages/shared-types/src/index.test.ts << 'EOF'
import { describe, test, expect } from 'bun:test'
import {
  ContentTypeSchema,
  ItemStatusSchema,
  LearningItemInsertSchema,
  LearningItemUpdateSchema,
  ProgressLogInsertSchema,
} from './index'

describe('ContentTypeSchema', () => {
  test('accepts valid content types', () => {
    const validTypes = ['url', 'article', 'video', 'book', 'note', 'problem'] as const
    validTypes.forEach(type => {
      expect(ContentTypeSchema.parse(type)).toBe(type)
    })
  })
  test('rejects invalid content type', () => {
    expect(() => ContentTypeSchema.parse('invalid')).toThrow()
    expect(() => ContentTypeSchema.parse('')).toThrow()
  })
})

describe('ItemStatusSchema', () => {
  test('accepts valid statuses', () => {
    const validStatuses = ['inbox', 'todo', 'in_progress', 'completed'] as const
    validStatuses.forEach(status => {
      expect(ItemStatusSchema.parse(status)).toBe(status)
    })
  })
  test('rejects invalid status', () => {
    expect(() => ItemStatusSchema.parse('done')).toThrow()
    expect(() => ItemStatusSchema.parse('pending')).toThrow()
  })
})

describe('LearningItemInsertSchema', () => {
  test('accepts valid insert payload', () => {
    const payload = {
      user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Next.js 공식 문서',
      content_type: 'url',
      status: 'inbox',
      topic_id: null,
      prerequisite_id: null,
      description: null,
      url: null,
      estimated_minutes: 60,
      order_index: 0,
      due_date: null,
    }
    expect(() => LearningItemInsertSchema.parse(payload)).not.toThrow()
  })
  test('requires title', () => {
    expect(() =>
      LearningItemInsertSchema.parse({
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        content_type: 'url',
        status: 'inbox',
      })
    ).toThrow()
  })
})

describe('LearningItemUpdateSchema', () => {
  test('allows partial update', () => {
    expect(() => LearningItemUpdateSchema.parse({ status: 'in_progress' })).not.toThrow()
    expect(() => LearningItemUpdateSchema.parse({ title: '수정된 제목' })).not.toThrow()
    expect(() => LearningItemUpdateSchema.parse({})).not.toThrow()
  })
})

describe('ProgressLogInsertSchema', () => {
  test('accepts valid progress log', () => {
    const payload = {
      user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      learning_item_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      study_date: '2026-03-28',
      duration_minutes: 45,
      notes: null,
    }
    expect(() => ProgressLogInsertSchema.parse(payload)).not.toThrow()
  })
})
EOF
```

- [ ] **Step 5: 테스트 실행 — 실패 확인 (Red)**

```bash
bun test --cwd packages/shared-types 2>&1 | head -10
```

Expected: `Cannot find module './index'` 또는 import 에러 (정상 — TDD 레드 단계)

- [ ] **Step 6: Zod 스키마 구현 (Green 단계)**

```bash
cat > packages/shared-types/src/index.ts << 'EOF'
import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ContentTypeSchema = z.enum(['url', 'article', 'video', 'book', 'note', 'problem'])
export const ItemStatusSchema = z.enum(['inbox', 'todo', 'in_progress', 'completed'])

export type ContentType = z.infer<typeof ContentTypeSchema>
export type ItemStatus = z.infer<typeof ItemStatusSchema>

// ─── Profile ──────────────────────────────────────────────────────────────────

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string().nullable(),
  avatar_url: z.string().nullable(),
  telegram_chat_id: z.string().nullable(),
  streak_count: z.number().int().default(0),
  last_study_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const ProfileInsertSchema = ProfileSchema.omit({
  streak_count: true,
  created_at: true,
  updated_at: true,
}).partial({ last_study_date: true, telegram_chat_id: true })

export type Profile = z.infer<typeof ProfileSchema>
export type ProfileInsert = z.infer<typeof ProfileInsertSchema>

// ─── Topic ────────────────────────────────────────────────────────────────────

export const TopicSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
  name: z.string().min(1),
  description: z.string().nullable(),
  color: z.string().default('#6366f1'),
  icon: z.string().nullable(),
  order_index: z.number().int().default(0),
  created_at: z.string(),
  updated_at: z.string(),
})

export const TopicInsertSchema = TopicSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type Topic = z.infer<typeof TopicSchema>
export type TopicInsert = z.infer<typeof TopicInsertSchema>

// ─── LearningItem ─────────────────────────────────────────────────────────────

export const LearningItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  topic_id: z.string().uuid().nullable(),
  prerequisite_id: z.string().uuid().nullable(),
  title: z.string().min(1),
  description: z.string().nullable(),
  url: z.string().nullable(),
  content_type: ContentTypeSchema,
  status: ItemStatusSchema,
  estimated_minutes: z.number().int().nullable(),
  actual_minutes: z.number().int().default(0),
  order_index: z.number().int().default(0),
  due_date: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const LearningItemInsertSchema = LearningItemSchema.omit({
  id: true,
  actual_minutes: true,
  completed_at: true,
  created_at: true,
  updated_at: true,
})

export const LearningItemUpdateSchema = LearningItemInsertSchema.partial()

export type LearningItem = z.infer<typeof LearningItemSchema>
export type LearningItemInsert = z.infer<typeof LearningItemInsertSchema>
export type LearningItemUpdate = z.infer<typeof LearningItemUpdateSchema>

// ─── ProgressLog ──────────────────────────────────────────────────────────────

export const ProgressLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  learning_item_id: z.string().uuid(),
  study_date: z.string(),
  duration_minutes: z.number().int().default(0),
  notes: z.string().nullable(),
  created_at: z.string(),
})

export const ProgressLogInsertSchema = ProgressLogSchema.omit({
  id: true,
  created_at: true,
})

export type ProgressLog = z.infer<typeof ProgressLogSchema>
export type ProgressLogInsert = z.infer<typeof ProgressLogInsertSchema>
EOF
```

- [ ] **Step 7: 테스트 실행 — 통과 확인 (Green)**

```bash
bun test --cwd packages/shared-types
```

Expected:
```
✓ ContentTypeSchema > accepts valid content types
✓ ContentTypeSchema > rejects invalid content type
✓ ItemStatusSchema > accepts valid statuses
✓ ItemStatusSchema > rejects invalid status
✓ LearningItemInsertSchema > accepts valid insert payload
✓ LearningItemInsertSchema > requires title
✓ LearningItemUpdateSchema > allows partial update
✓ ProgressLogInsertSchema > accepts valid progress log

8 pass, 0 fail
```

- [ ] **Step 8: TypeScript 타입 검사**

```bash
bun run --cwd packages/shared-types typecheck
```

Expected: 에러 없이 종료

---

## Task 7: packages/ui — 빈 패키지

**Files:**
- Create: `packages/ui/package.json`

- [ ] **Step 1: ui 패키지 최소 구성 생성**

```bash
mkdir -p packages/ui
cat > packages/ui/package.json << 'EOF'
{
  "name": "@learning-tracker/ui",
  "version": "0.0.1",
  "private": true,
  "description": "공통 UI 컴포넌트 (Phase 3 이후 구현 예정)"
}
EOF
```

---

## Task 8: workspace 의존성 연결 + 루트 통합 설치 + 최종 검증

**Files:**
- Modify: `apps/frontend/package.json`
- Modify: `apps/backend/package.json`

- [ ] **Step 1: frontend에 shared-types workspace 의존성 추가**

```bash
bun add @learning-tracker/shared-types --cwd apps/frontend
```

Expected: `"@learning-tracker/shared-types": "workspace:*"` 가 `apps/frontend/package.json`에 추가됨

- [ ] **Step 2: backend에 shared-types workspace 의존성 추가**

```bash
bun add @learning-tracker/shared-types --cwd apps/backend
```

Expected: `"@learning-tracker/shared-types": "workspace:*"` 가 `apps/backend/package.json`에 추가됨

- [ ] **Step 3: 루트에서 전체 workspace 의존성 일괄 설치**

```bash
cd "/c/Users/mack/Desktop/projects/study/classmanage/my-learning-tracker"
bun install
```

Expected: 에러 없이 완료

- [ ] **Step 4: bun.lock 파일 생성 확인**

```bash
ls bun.lock
```

Expected: `bun.lock` 파일 존재

- [ ] **Step 5: shared-types 테스트 최종 확인**

```bash
bun run --cwd packages/shared-types test
```

Expected: `8 pass, 0 fail`

- [ ] **Step 6: frontend 빌드 확인**

```bash
bun run --cwd apps/frontend build 2>&1 | tail -10
```

Expected: 빌드 성공 메시지

- [ ] **Step 7: backend typecheck 확인**

```bash
bun run --cwd apps/backend typecheck
```

Expected: TypeScript 에러 없음

- [ ] **Step 8: 환경 변수 파일 존재 확인**

```bash
ls apps/frontend/.env.local apps/backend/.dev.vars apps/backend/wrangler.toml
```

Expected: 세 파일 모두 존재

- [ ] **Step 9: .gitignore 민감 파일 포함 확인**

```bash
grep -E "\.env\.local|\.dev\.vars" .gitignore
```

Expected: 두 항목 모두 매칭

- [ ] **Step 10: packages/ui 디렉토리 확인**

```bash
ls packages/ui/package.json
```

Expected: 파일 존재

- [ ] **Step 11: 최초 커밋**

```bash
git init
git add package.json tsconfig.json .gitignore apps/ packages/
git commit -m "feat: Phase 1 — monorepo foundation (Next.js + Hono + shared-types)"
```

---

## 수동 작업 (구현 완료 후 별도 진행)

> 아래 항목은 외부 서비스가 필요하므로 코드 작성과 별개로 수동 처리한다.

### Supabase SQL 스키마 적용
1. [Supabase 대시보드](https://supabase.com) → 프로젝트 선택
2. 좌측 메뉴 → **SQL Editor**
3. `02_phase1_foundation.md`의 SQL을 **순서대로** 실행:
   - `profiles` 테이블 + 신규 가입 트리거
   - `topics` 테이블 + 인덱스
   - `learning_items` 테이블 (enum 타입 먼저) + 인덱스
   - `progress_logs` 테이블 + 인덱스
   - RLS 정책 (4개 테이블)

### 환경 변수 실제 값 채우기
1. Supabase 대시보드 → **Settings → API** 에서 키 복사
2. `apps/frontend/.env.local` — 플레이스홀더를 실제 URL, anon key로 교체
3. `apps/backend/.dev.vars` — 플레이스홀더를 실제 URL, service role key로 교체
4. `apps/backend/wrangler.toml` → `[vars]`의 URL 교체
5. 배포 시: `wrangler secret put SUPABASE_SERVICE_ROLE_KEY` 실행
