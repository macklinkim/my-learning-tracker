# Phase 2: API & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase Auth 기반 인증 시스템과 Hono CRUD API를 구축하고, Hono RPC + TanStack Query로 프론트엔드와 타입 안전하게 연결한다.

**Architecture:** Next.js App Router에서 `@supabase/ssr`로 서버/클라이언트 세션을 관리하고, `proxy.ts`(Next.js 16 신규 명칭)로 보호 라우트를 처리한다. Hono 백엔드는 Supabase JWT를 검증하는 auth 미들웨어로 모든 `/api/*` 라우트를 보호하며, `AppType`을 export해 프론트엔드 Hono RPC 클라이언트가 타입 안전하게 호출한다. Supabase 클라이언트는 `src/lib/supabase/`에 격리되어 Clerk/Auth0 교체 시 해당 폴더만 수정하면 된다.

**Tech Stack:** Supabase Auth, @supabase/ssr@0.9+, Next.js 16 App Router, Server Actions, Hono 4.x RPC, @hono/zod-validator, TanStack Query v5, Bun test

**Working Directory:** `/c/Users/mack/Desktop/projects/study/classmanage/my-learning-tracker/`

> **포트 안내:** 백엔드 로컬 주소는 `http://localhost:8787` (wrangler dev 기본값)

> **Next.js 16 proxy.ts:** `middleware.ts`는 deprecated, `proxy.ts`로 이름 변경됨 (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` line 615 참조). `proxy.ts`는 **Node.js 런타임**만 지원 (Edge 런타임 불가). `@supabase/ssr`은 Node.js 런타임에서 정상 동작하므로 `proxy.ts` 사용. Edge 런타임이 필요한 경우에만 `middleware.ts` 유지.

> **환경변수 전제조건:** 실제 Supabase 키가 `apps/frontend/.env.local` 및 `apps/backend/.dev.vars`에 설정되어 있어야 auth 기능이 동작함. (Phase 1 수동 작업 완료 필요)

> **Zod 버전 주의:** 모노레포 전체가 `zod@^4.3.6`을 사용함. `@hono/zod-validator`의 내부 API(`safeParse`)는 v4와 호환되지만, 타입 에러 발생 시 `bun add zod@3` 다운그레이드를 고려할 것.

---

## 파일 구조 (생성/수정 대상)

```
apps/frontend/src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # (Create) Browser용 Supabase 클라이언트
│   │   └── server.ts                   # (Create) Server Component용 Supabase 클라이언트
│   └── api/
│       └── client.ts                   # (Create) Hono RPC 타입 안전 클라이언트
├── proxy.ts                             # (Create) 세션 갱신 + 보호 라우트 처리 (Next.js 16)
├── providers/
│   └── query-provider.tsx              # (Create) TanStack Query 클라이언트 프로바이더
└── app/
    ├── layout.tsx                      # (Modify) QueryProvider 래핑 + 메타데이터 수정
    ├── (auth)/
    │   ├── layout.tsx                  # (Create) 인증된 유저 → / 리다이렉트
    │   └── login/
    │       ├── page.tsx                # (Create) 이메일/패스워드 로그인·회원가입 폼
    │       └── actions.ts              # (Create) Server Actions (login, signup, signout)
    ├── auth/callback/
    │   └── route.ts                    # (Create) OAuth/Magic Link 콜백 처리
    └── (dashboard)/
        ├── layout.tsx                  # (Create) 미인증 유저 → /login 리다이렉트
        └── page.tsx                    # (Replace) 세션 유저 정보 표시하는 대시보드 홈

apps/backend/src/
├── middleware/
│   └── auth.ts                         # (Create) Supabase JWT 검증 미들웨어
├── routes/
│   ├── topics.ts                       # (Create) CRUD /api/topics
│   ├── learning-items.ts               # (Create) CRUD /api/learning-items
│   └── progress-logs.ts               # (Create) CRUD /api/progress-logs
└── index.ts                            # (Modify) 라우트 마운트 + AppType export
```

---

## Task 1: Supabase 클라이언트 유틸리티 + 미들웨어

**Files:**
- Create: `apps/frontend/src/lib/supabase/client.ts`
- Create: `apps/frontend/src/lib/supabase/server.ts`
- Create: `apps/frontend/src/proxy.ts`

- [ ] **Step 1: supabase 디렉토리 생성 및 browser 클라이언트 작성**

```bash
mkdir -p apps/frontend/src/lib/supabase
```

`apps/frontend/src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

- [ ] **Step 2: Server Component용 클라이언트 작성**

`apps/frontend/src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component 읽기 전용 컨텍스트에서 set 호출 시 무시
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Next.js proxy 작성 (세션 갱신 + 보호 라우트)**

> Next.js 16: `middleware.ts` → `proxy.ts`, `middleware` 함수 → `proxy` 함수로 이름 변경. Node.js 런타임 사용.

`apps/frontend/src/proxy.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신 (반드시 getUser() 호출 — getSession() 사용 금지)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 미인증 유저가 /login·/auth 이외 경로 접근 시 리다이렉트
  if (!user && pathname !== '/login' && !pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 인증된 유저가 /login 접근 시 대시보드로 리다이렉트
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 4: 타입 검사**


```bash
cd apps/frontend && bunx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
cd ../..
```

Expected: 에러 없음

---

## Task 2: Auth 라우트 (콜백 + 로그인 페이지)

**Files:**
- Create: `apps/frontend/src/app/auth/callback/route.ts`
- Create: `apps/frontend/src/app/(auth)/layout.tsx`
- Create: `apps/frontend/src/app/(auth)/login/actions.ts`
- Create: `apps/frontend/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: 디렉토리 생성 및 OAuth/Magic Link 콜백 라우트 작성**

```bash
mkdir -p apps/frontend/src/app/auth/callback
mkdir -p "apps/frontend/src/app/(auth)/login"
```

`apps/frontend/src/app/auth/callback/route.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('콜백 처리 실패')}`)
}
```

- [ ] **Step 2: (auth) 레이아웃 작성**

`apps/frontend/src/app/(auth)/layout.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/')

  return <>{children}</>
}
```

- [ ] **Step 3: Server Actions 작성 (login, signup, signout)**

`apps/frontend/src/app/(auth)/login/actions.ts`:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }
  redirect(`/login?message=${encodeURIComponent('가입 완료. 이메일을 확인하세요.')}`)
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 4: 로그인 페이지 작성**

`apps/frontend/src/app/(auth)/login/page.tsx`:
```typescript
import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-center text-2xl font-bold tracking-tight">
          Learning Tracker
        </h1>

        {params.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-600">
            {params.message}
          </p>
        )}

        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <div className="flex gap-2">
            <button
              formAction={login}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              로그인
            </button>
            <button
              formAction={signup}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 개발 서버로 /login 렌더링 확인**

```bash
cd apps/frontend
bun run dev &
DEV_PID=$!
sleep 10
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login)
echo "Login page status: $STATUS"
kill $DEV_PID 2>/dev/null
pkill -f "next dev" 2>/dev/null
cd ../..
```

Expected: `Login page status: 200`

---

## Task 3: 보호된 대시보드 라우트

**Files:**
- Create: `apps/frontend/src/app/(dashboard)/layout.tsx`
- Replace: `apps/frontend/src/app/(dashboard)/page.tsx` (기존 app/page.tsx 교체)

- [ ] **Step 1: (dashboard) 디렉토리 및 layout 작성**

```bash
mkdir -p "apps/frontend/src/app/(dashboard)"
```

`apps/frontend/src/app/(dashboard)/layout.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <>{children}</>
}
```

- [ ] **Step 2: 대시보드 홈 페이지 작성 및 기존 page.tsx 교체**

기존 `apps/frontend/src/app/page.tsx` 삭제 후 `(dashboard)/page.tsx` 생성:

```bash
rm apps/frontend/src/app/page.tsx
```

`apps/frontend/src/app/(dashboard)/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { signout } from '@/app/(auth)/login/actions'

export default async function DashboardPage() {
  // layout.tsx에서 이미 getUser() 호출 후 리다이렉트 처리.
  // page에서 재호출하는 것은 중복이지만 user 데이터를 직접 사용하기 위해 허용.
  // Phase 3에서 데이터 fetching이 추가되면 통합 검토.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="p-8">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold">Learning Tracker</h1>
        <form action={signout}>
          <button
            type="submit"
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            로그아웃
          </button>
        </form>
      </div>
      <p className="mt-6 text-gray-600">
        안녕하세요, <span className="font-medium">{user?.email}</span>님!
      </p>
      <p className="mt-2 text-sm text-gray-400">
        Phase 3에서 학습 대시보드가 여기에 구현됩니다.
      </p>
    </main>
  )
}
```

---

## Task 4: Hono Auth 미들웨어 (JWT 검증)

**Files:**
- Create: `apps/backend/src/middleware/auth.ts`
- Create: `apps/backend/src/middleware/auth.test.ts`

- [ ] **Step 1: 실패하는 테스트 먼저 작성 (Red)**

```bash
mkdir -p apps/backend/src/middleware
```

`apps/backend/src/middleware/auth.test.ts`:
```typescript
import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import { authMiddleware } from './auth'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

const makeApp = () => {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  app.use('/protected/*', authMiddleware)
  app.get('/protected/resource', (c) => c.json({ ok: true }))
  return app
}

const ENV = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
}

describe('authMiddleware', () => {
  test('Authorization 헤더 없으면 401 반환', async () => {
    const app = makeApp()
    const res = await app.request('/protected/resource', { method: 'GET' }, ENV)
    expect(res.status).toBe(401)
    const body = await res.json() as { error: string }
    expect(body.error).toBeDefined()
  })

  test('Bearer 형식이 아닌 헤더면 401 반환', async () => {
    const app = makeApp()
    const res = await app.request(
      '/protected/resource',
      { method: 'GET', headers: { Authorization: 'Basic invalidtoken' } },
      ENV
    )
    expect(res.status).toBe(401)
  })

  test('Bearer 형식이지만 유효하지 않은 토큰이면 401 반환', async () => {
    // 실제 Supabase 호출 발생 — test.supabase.co는 존재하지 않으므로 네트워크 에러 → 401 반환 확인
    const app = makeApp()
    const res = await app.request(
      '/protected/resource',
      { method: 'GET', headers: { Authorization: 'Bearer malformed.invalid.token' } },
      ENV
    )
    expect(res.status).toBe(401)
  })

  test('보호되지 않은 경로는 미들웨어 통과', async () => {
    const app = new Hono<{ Bindings: Bindings }>()
    app.use('/protected/*', authMiddleware)
    app.get('/public', (c) => c.json({ ok: true }))
    const res = await app.request('/public', { method: 'GET' }, ENV)
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인 (Red)**

```bash
bun test apps/backend/src/middleware/auth.test.ts 2>&1 | head -10
```

Expected: `Cannot find module './auth'` 에러

- [ ] **Step 3: Auth 미들웨어 구현 (Green)**

`apps/backend/src/middleware/auth.ts`:
```typescript
import { createMiddleware } from 'hono/factory'
import { createClient } from '@supabase/supabase-js'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

type Variables = {
  userId: string
}

export const authMiddleware = createMiddleware<{
  Bindings: Bindings
  Variables: Variables
}>(async (c, next) => {
  const authorization = c.req.header('Authorization')

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authorization.slice(7)

  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  c.set('userId', user.id)
  await next()
})
```

- [ ] **Step 4: 테스트 실행 — 통과 확인 (Green)**

```bash
bun test apps/backend/src/middleware/auth.test.ts 2>&1
```

Expected: `4 pass, 0 fail`

---

## Task 5: Hono CRUD — topics

**Files:**
- Create: `apps/backend/src/routes/topics.ts`
- Create: `apps/backend/src/routes/topics.test.ts`

> **설계 노트:** `user_id`는 JWT에서 추출되므로 request body에서 제외. `TopicInsertSchema.omit({ user_id: true })`로 검증 후 서버에서 주입.

- [ ] **Step 1: 실패하는 테스트 작성 (Red)**

```bash
mkdir -p apps/backend/src/routes
```

`apps/backend/src/routes/topics.test.ts`:
```typescript
import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import topics from './topics'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

const makeApp = () => {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  // auth 미들웨어 스킵 — userId만 미리 주입
  app.use('*', async (c, next) => {
    c.set('userId', 'test-user-id')
    await next()
  })
  app.route('/', topics)
  return app
}

const ENV = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
}

describe('topics routes', () => {
  test('GET / — 라우트 존재 (404 아님)', async () => {
    const app = makeApp()
    const res = await app.request('/', { method: 'GET' }, ENV)
    expect(res.status).not.toBe(404)
  })

  test('POST / — name 없으면 400 반환', async () => {
    const app = makeApp()
    const res = await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: '설명만 있고 name 없음' }),
      },
      ENV
    )
    expect(res.status).toBe(400)
  })

  test('PUT /:id — 빈 body는 허용 (partial update)', async () => {
    const app = makeApp()
    const res = await app.request(
      '/some-uuid',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
      ENV
    )
    // DB 없으므로 500 또는 200 (404 아님을 확인)
    expect(res.status).not.toBe(400)
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인 (Red)**

```bash
bun test apps/backend/src/routes/topics.test.ts 2>&1 | head -5
```

Expected: 모듈 없음 에러

- [ ] **Step 3: topics 라우트 구현 (Green)**

`apps/backend/src/routes/topics.ts`:
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createClient } from '@supabase/supabase-js'
import { TopicInsertSchema } from '@learning-tracker/shared-types'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

// user_id는 JWT에서 주입 — request body에서 제외
const TopicBodySchema = TopicInsertSchema.omit({ user_id: true })
const TopicBodyPartialSchema = TopicBodySchema.partial()

const topics = new Hono<{ Bindings: Bindings; Variables: Variables }>()

topics
  .get('/', async (c) => {
    const userId = c.get('userId')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .order('order_index')
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data)
  })
  .post('/', zValidator('json', TopicBodySchema), async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('topics')
      .insert({ ...body, user_id: userId })
      .select()
      .single()
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data, 201)
  })
  .put('/:id', zValidator('json', TopicBodyPartialSchema), async (c) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('topics')
      .update(body)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) return c.json({ error: error.message }, 500)
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json(data)
  })
  .delete('/:id', async (c) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return c.json({ error: error.message }, 500)
    return c.json({ success: true })
  })

export default topics
```

- [ ] **Step 4: 테스트 실행 — 통과 확인 (Green)**

```bash
bun test apps/backend/src/routes/topics.test.ts 2>&1
```

Expected: `3 pass, 0 fail`

---

## Task 6: Hono CRUD — learning-items

**Files:**
- Create: `apps/backend/src/routes/learning-items.ts`
- Create: `apps/backend/src/routes/learning-items.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성 (Red)**

`apps/backend/src/routes/learning-items.test.ts`:
```typescript
import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import learningItems from './learning-items'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

const makeApp = () => {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  app.use('*', async (c, next) => {
    c.set('userId', 'test-user-id')
    await next()
  })
  app.route('/', learningItems)
  return app
}

const ENV = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
}

describe('learning-items routes', () => {
  test('GET / — 라우트 존재 (404 아님)', async () => {
    const app = makeApp()
    const res = await app.request('/', { method: 'GET' }, ENV)
    expect(res.status).not.toBe(404)
  })

  test('POST / — title 없으면 400 반환', async () => {
    const app = makeApp()
    const res = await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: 'url', status: 'inbox' }), // title 누락
      },
      ENV
    )
    expect(res.status).toBe(400)
  })

  test('POST / — 유효한 최소 payload는 400 아님', async () => {
    const app = makeApp()
    const res = await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Next.js 공식 문서',
          content_type: 'url',
          status: 'inbox',
          topic_id: null,
          prerequisite_id: null,
          description: null,
          url: null,
          estimated_minutes: null,
          order_index: 0,
          due_date: null,
        }),
      },
      ENV
    )
    // DB 없으므로 500 가능 — 400(검증 실패)이 아님을 확인
    expect(res.status).not.toBe(400)
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인 (Red)**

```bash
bun test apps/backend/src/routes/learning-items.test.ts 2>&1 | head -5
```

- [ ] **Step 3: learning-items 라우트 구현 (Green)**

`apps/backend/src/routes/learning-items.ts`:
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createClient } from '@supabase/supabase-js'
import {
  LearningItemInsertSchema,
  LearningItemUpdateSchema,
} from '@learning-tracker/shared-types'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

// user_id는 JWT에서 주입 — request body에서 제외
const InsertBodySchema = LearningItemInsertSchema.omit({ user_id: true })
const UpdateBodySchema = LearningItemUpdateSchema.omit({ user_id: true })

const learningItems = new Hono<{ Bindings: Bindings; Variables: Variables }>()

learningItems
  .get('/', async (c) => {
    const userId = c.get('userId')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('learning_items')
      .select('*')
      .eq('user_id', userId)
      .order('order_index')
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data)
  })
  .post('/', zValidator('json', InsertBodySchema), async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('learning_items')
      .insert({ ...body, user_id: userId })
      .select()
      .single()
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data, 201)
  })
  .get('/:id', async (c) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('learning_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (error || !data) return c.json({ error: 'Not found' }, 404)
    return c.json(data)
  })
  .put('/:id', zValidator('json', UpdateBodySchema), async (c) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('learning_items')
      .update(body)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) return c.json({ error: error.message }, 500)
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json(data)
  })
  .delete('/:id', async (c) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await supabase
      .from('learning_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return c.json({ error: error.message }, 500)
    return c.json({ success: true })
  })

export default learningItems
```

- [ ] **Step 4: 테스트 실행 — 통과 확인 (Green)**

```bash
bun test apps/backend/src/routes/learning-items.test.ts 2>&1
```

Expected: `3 pass, 0 fail`

---

## Task 7: Hono CRUD — progress-logs

**Files:**
- Create: `apps/backend/src/routes/progress-logs.ts`
- Create: `apps/backend/src/routes/progress-logs.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성 (Red)**

`apps/backend/src/routes/progress-logs.test.ts`:
```typescript
import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import progressLogs from './progress-logs'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

const makeApp = () => {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  app.use('*', async (c, next) => {
    c.set('userId', 'test-user-id')
    await next()
  })
  app.route('/', progressLogs)
  return app
}

const ENV = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
}

describe('progress-logs routes', () => {
  test('GET / — 라우트 존재 (404 아님)', async () => {
    const app = makeApp()
    const res = await app.request('/', { method: 'GET' }, ENV)
    expect(res.status).not.toBe(404)
  })

  test('POST / — learning_item_id 없으면 400 반환', async () => {
    const app = makeApp()
    const res = await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_date: '2026-03-28', duration_minutes: 30 }),
      },
      ENV
    )
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인 (Red)**

```bash
bun test apps/backend/src/routes/progress-logs.test.ts 2>&1 | head -5
```

- [ ] **Step 3: progress-logs 라우트 구현 (Green)**

`apps/backend/src/routes/progress-logs.ts`:
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createClient } from '@supabase/supabase-js'
import { ProgressLogInsertSchema } from '@learning-tracker/shared-types'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

// user_id는 JWT에서 주입
const InsertBodySchema = ProgressLogInsertSchema.omit({ user_id: true })

const progressLogs = new Hono<{ Bindings: Bindings; Variables: Variables }>()

progressLogs
  .get('/', async (c) => {
    const userId = c.get('userId')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('progress_logs')
      .select('*')
      .eq('user_id', userId)
      .order('study_date', { ascending: false })
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data)
  })
  .post('/', zValidator('json', InsertBodySchema), async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('progress_logs')
      .insert({ ...body, user_id: userId })
      .select()
      .single()
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data, 201)
  })
  .delete('/:id', async (c) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await supabase
      .from('progress_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return c.json({ error: error.message }, 500)
    return c.json({ success: true })
  })

export default progressLogs
```

- [ ] **Step 4: 테스트 실행 — 통과 확인 (Green)**

```bash
bun test apps/backend/src/routes/progress-logs.test.ts 2>&1
```

Expected: `2 pass, 0 fail`

---

## Task 8: Backend 라우트 통합 + AppType export + Frontend RPC 클라이언트

**Files:**
- Modify: `apps/backend/src/index.ts`
- Modify: `apps/backend/package.json` (exports 추가)
- Modify: `apps/frontend/package.json` (backend devDep 추가)
- Create: `apps/frontend/src/lib/api/client.ts`
- Modify: `apps/frontend/.env.local` (API URL 추가)

- [ ] **Step 1: backend index.ts 전체 교체 (라우트 마운트 + AppType export)**

`apps/backend/src/index.ts`:
```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from './middleware/auth'
import topics from './routes/topics'
import learningItems from './routes/learning-items'
import progressLogs from './routes/progress-logs'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS (로컬 개발용)
app.use('*', cors({ origin: ['http://localhost:3000'] }))

// 공개 엔드포인트
app.get('/', (c) => c.json({ message: 'Learning Tracker API', status: 'ok' }))
app.get('/health', (c) =>
  c.json({ status: 'healthy', timestamp: new Date().toISOString() })
)

// 보호된 API 라우트 (auth 미들웨어 적용 후 라우트 마운트)
app.use('/api/*', authMiddleware)

const routes = app
  .route('/api/topics', topics)
  .route('/api/learning-items', learningItems)
  .route('/api/progress-logs', progressLogs)

// Hono RPC 타입 추론용 export
export type AppType = typeof routes
export default app
```

- [ ] **Step 2: backend package.json에 exports 필드 추가**

`apps/backend/package.json`의 `"name"` 바로 다음에 추가 (shared-types 패턴 통일):
```json
"exports": {
  ".": {
    "types": "./src/index.ts",
    "import": "./src/index.ts"
  }
},
```

- [ ] **Step 3: frontend devDependencies에 backend 추가**

`apps/frontend/package.json`의 `"devDependencies"`에 추가:
```json
"@learning-tracker/backend": "workspace:*"
```

- [ ] **Step 4: 루트에서 bun install**

```bash
bun install
```

Expected: 에러 없음

- [ ] **Step 5: Hono RPC 클라이언트 작성**

```bash
mkdir -p apps/frontend/src/lib/api
```

`apps/frontend/src/lib/api/client.ts`:
```typescript
import { hc } from 'hono/client'
import type { AppType } from '@learning-tracker/backend'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787'

export const apiClient = hc<AppType>(API_URL)
```

- [ ] **Step 6: .env.local에 API URL 추가**

`apps/frontend/.env.local`에 아래 줄 추가:
```
NEXT_PUBLIC_API_URL=http://localhost:8787
```

- [ ] **Step 7: backend typecheck 확인**

```bash
bun run --cwd apps/backend typecheck 2>&1 | grep -E "error TS" | head -10
```

Expected: 에러 없음

---

## Task 9: TanStack Query 설정 + 루트 레이아웃 업데이트

**Files:**
- Create: `apps/frontend/src/providers/query-provider.tsx`
- Modify: `apps/frontend/src/app/layout.tsx`

- [ ] **Step 1: TanStack Query 설치**

```bash
bun add @tanstack/react-query @tanstack/react-query-devtools --cwd apps/frontend
```

Expected: 설치 완료, 에러 없음

- [ ] **Step 2: QueryProvider 컴포넌트 작성**

```bash
mkdir -p apps/frontend/src/providers
```

`apps/frontend/src/providers/query-provider.tsx`:
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

- [ ] **Step 3: 루트 layout.tsx 업데이트 (QueryProvider + 메타데이터)**

`apps/frontend/src/app/layout.tsx` 전체 교체:
```typescript
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Learning Tracker',
  description: 'AI 기반 마이크로 러닝 트래커',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: frontend 빌드 최종 확인**

```bash
bun run --cwd apps/frontend build 2>&1 | tail -15
```

Expected: 빌드 성공 (`✓ Compiled` 또는 `Generating static pages`)

- [ ] **Step 5: 백엔드 전체 테스트 실행**

```bash
bun test apps/backend/src/ 2>&1
```

Expected: 전체 테스트 통과 (`8 pass, 0 fail` 이상)

- [ ] **Step 6: 최종 커밋**

```bash
cd "/c/Users/mack/Desktop/projects/study/classmanage/my-learning-tracker"
git add apps/ packages/
git commit -m "feat: Phase 2 — Supabase Auth + Hono CRUD API + RPC client + TanStack Query"
```

---

## 수동 확인 체크리스트 (구현 후 브라우저에서 검증)

> Supabase 실제 키 설정 후 `bun run dev:frontend` + `bun run dev:backend` 동시 실행

- [ ] `http://localhost:3000` 접근 → `/login`으로 리다이렉트 확인
- [ ] 이메일/패스워드 회원가입 → 이메일 확인 안내 메시지 확인
- [ ] 이메일 확인 후 로그인 → 대시보드(`/`) 진입 및 이메일 표시 확인
- [ ] 로그아웃 버튼 → `/login`으로 리다이렉트 확인
- [ ] `http://localhost:8787/health` → `{"status":"healthy"}` 확인
- [ ] `http://localhost:8787/api/topics` (토큰 없이) → `{"error":"Unauthorized"}` 401 확인
