# Phase 3: Core Dashboard UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인한 사용자의 학습 데이터를 시각화하는 대시보드를 구축한다 — LeetCode 스타일 히트맵 + 파이 차트, Notion 스타일 인라인 편집 테이블, Linear 스타일 칸반 보드, 다크 모드 지원.

**Architecture:** Next.js 16 App Router + TanStack Query v5로 Hono RPC 클라이언트를 호출해 데이터를 fetch/mutate한다. `next-themes`로 다크 모드를 관리하고, Tailwind v4 CSS-first 설정(`@custom-variant dark` 이미 세팅됨)을 그대로 활용한다. `@base-ui/react` 기반 shadcn 컴포넌트(Button 이미 존재)와 동일한 패턴으로 Card/Badge/Input을 작성하고, Recharts로 차트, TanStack Table v8로 데이터 그리드, dnd-kit으로 칸반 DnD를 구현한다.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, @base-ui/react, next-themes, TanStack Query v5, TanStack Table v8, Recharts, dnd-kit, date-fns v4, Bun test

**Working Directory:** `/c/Users/mack/Desktop/projects/study/classmanage/my-learning-tracker/`

> **CSS 다크 모드:** `globals.css`에 `@custom-variant dark (&:is(.dark *))` 이미 설정됨. `next-themes`는 `<html>`에 `class="dark"` 추가 → Tailwind v4 `dark:` 유틸리티가 자동으로 동작.

> **shadcn 주의:** 이 프로젝트는 `shadcn@4.1.1` + `@base-ui/react`를 사용. 기존 `button.tsx`가 `@base-ui/react/button` 래핑 패턴을 따름. Card/Badge/Input은 HTML + Tailwind로 직접 작성 (headless 라이브러리 불필요).

> **Next.js 16:** `middleware.ts`는 deprecated → `proxy.ts` 사용 (이미 구현됨). 새 파일 작성 전 `node_modules/next/dist/docs/` 참조.

> **Hono RPC 클라이언트:** `apiClient.api['learning-items'].$get({}, { headers })` 형태로 호출. `-`가 포함된 경로는 브래킷 표기법 필수.

---

## 파일 구조 (생성/수정 대상)

```
apps/frontend/src/
├── providers/
│   └── theme-provider.tsx              # (Create) next-themes ThemeProvider 래퍼
├── components/
│   ├── ui/
│   │   ├── card.tsx                    # (Create) Card, CardHeader, CardTitle, CardContent
│   │   ├── badge.tsx                   # (Create) StatusBadge, ContentTypeBadge
│   │   ├── input.tsx                   # (Create) Input 컴포넌트
│   │   └── theme-toggle.tsx            # (Create) 다크/라이트 모드 토글 버튼
│   ├── layout/
│   │   ├── sidebar-nav.tsx             # (Create) 네비게이션 링크 (대시보드/목록/칸반)
│   │   ├── header.tsx                  # (Create) 헤더 (유저 이메일 + 테마 토글 + 로그아웃)
│   │   └── dashboard-shell.tsx         # (Create) Sidebar + Header + 본문 래퍼
│   ├── charts/
│   │   ├── study-heatmap.tsx           # (Create) GitHub 잔디 스타일 히트맵 (date-fns + Tailwind)
│   │   └── topic-pie.tsx               # (Create) 토픽별 비중 파이 차트 (Recharts)
│   ├── learning-items/
│   │   ├── inline-cell.tsx             # (Create) 클릭→input 인라인 편집 셀
│   │   └── items-table.tsx             # (Create) TanStack Table + 인라인 편집
│   └── kanban/
│       ├── kanban-card.tsx             # (Create) dnd-kit SortableItem 카드
│       └── kanban-board.tsx            # (Create) 4컬럼 칸반 보드 (DndContext + useDroppable)
├── lib/
│   ├── format.ts                       # (Create) date-fns 날짜 포맷 유틸 + groupLogsByDate
│   ├── format.test.ts                  # (Create) 포맷 유틸 단위 테스트
│   └── api/
│       ├── get-auth-headers.ts         # (Create) 공유 Supabase Bearer 토큰 헬퍼
│       └── hooks/
│           ├── use-topics.ts           # (Create) topics CRUD TanStack Query 훅
│           ├── use-learning-items.ts   # (Create) learning-items CRUD TanStack Query 훅
│           └── use-progress-logs.ts   # (Create) progress-logs CRUD TanStack Query 훅
└── app/
    └── (dashboard)/
        ├── layout.tsx                  # (Modify) DashboardShell로 래핑
        ├── page.tsx                    # (Replace) 요약 카드 + 히트맵 + 파이 차트
        ├── items/
        │   └── page.tsx                # (Create) 학습 목록 테이블 페이지
        └── kanban/
            └── page.tsx                # (Create) 칸반 보드 페이지
```

---

## Task 1: 의존성 설치 + 다크 모드 설정

**Files:**
- Create: `apps/frontend/src/providers/theme-provider.tsx`
- Create: `apps/frontend/src/components/ui/theme-toggle.tsx`
- Modify: `apps/frontend/src/app/layout.tsx`

- [ ] **Step 1: 패키지 설치**

```bash
bun add next-themes @tanstack/react-table recharts @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities --cwd apps/frontend
```

Expected: 에러 없음, `apps/frontend/package.json` dependencies 업데이트됨

- [ ] **Step 2: ThemeProvider 작성**

`apps/frontend/src/providers/theme-provider.tsx`:
```typescript
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
```

- [ ] **Step 3: ThemeToggle 컴포넌트 작성**

> **주의:** `useTheme().theme`는 `"system"` 값을 가질 수 있어 직접 비교하면 버그 발생. 반드시 `resolvedTheme`으로 실제 적용된 테마를 확인해야 함.

`apps/frontend/src/components/ui/theme-toggle.tsx`:
```typescript
'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="테마 전환"
    >
      <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

- [ ] **Step 3-b: globals.css에 dark variant 설정 확인**

```bash
grep -n "custom-variant dark" apps/frontend/src/app/globals.css
```

Expected: `@custom-variant dark (&:is(.dark *));` 라인이 출력됨. 없으면 `globals.css` 상단에 추가:
```css
@custom-variant dark (&:is(.dark *));
```

- [ ] **Step 4: layout.tsx에 ThemeProvider 추가**

`apps/frontend/src/app/layout.tsx` 전체 교체:
```typescript
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'

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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

> **주의:** `suppressHydrationWarning`은 next-themes가 `<html>`에 class를 주입할 때 발생하는 hydration mismatch를 억제하기 위해 필요.

- [ ] **Step 5: 타입 검사**

```bash
cd apps/frontend && bunx tsc --noEmit 2>&1 | grep -E "error TS" | head -10
cd ../..
```

Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add apps/frontend/src/providers/theme-provider.tsx apps/frontend/src/components/ui/theme-toggle.tsx apps/frontend/src/app/layout.tsx apps/frontend/package.json apps/frontend/bun.lock 2>/dev/null; git add bun.lock 2>/dev/null
git commit -m "feat: add dark mode with next-themes, install recharts/dnd-kit/tanstack-table"
```

---

## Task 2: 날짜 포맷 유틸 (TDD)

**Files:**
- Create: `apps/frontend/src/lib/format.ts`
- Create: `apps/frontend/src/lib/format.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성 (Red)**

> **TZ 주의:** `date-fns` `format()`은 로컬 시간 기준. UTC 환경(CI 포함)에서 테스트가 깨지지 않으려면 타임존 독립적인 날짜 문자열 `'2026-03-28'`을 직접 파싱하거나 `parseISO`를 사용해야 함. 아래 테스트는 `'2026-03-28'` (날짜만, 시간 없음) 파싱을 사용해 UTC offset 문제를 회피함.

`apps/frontend/src/lib/format.test.ts`:
```typescript
import { describe, test, expect } from 'bun:test'
import { formatDate, formatRelative, groupLogsByDate } from './format'
import type { ProgressLog } from '@learning-tracker/shared-types'

describe('formatDate', () => {
  test('날짜 문자열(yyyy-MM-dd)을 지정 포맷으로 변환', () => {
    // 날짜 문자열만 사용 — 시간 없는 ISO는 로컬 자정으로 파싱되어 TZ 독립적
    expect(formatDate('2026-03-28', 'yyyy-MM-dd')).toBe('2026-03-28')
  })

  test('null 입력 시 빈 문자열 반환', () => {
    expect(formatDate(null)).toBe('')
  })

  test('undefined 입력 시 빈 문자열 반환', () => {
    expect(formatDate(undefined)).toBe('')
  })
})

describe('formatRelative', () => {
  test('null 입력 시 빈 문자열 반환', () => {
    expect(formatRelative(null)).toBe('')
  })

  test('유효한 날짜 입력 시 비어있지 않은 문자열 반환', () => {
    const result = formatRelative(new Date().toISOString())
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('groupLogsByDate', () => {
  test('같은 날짜의 duration_minutes 합산', () => {
    const logs: ProgressLog[] = [
      { id: '1', user_id: 'u', learning_item_id: 'i', study_date: '2026-03-28', duration_minutes: 30, notes: null, created_at: '' },
      { id: '2', user_id: 'u', learning_item_id: 'i', study_date: '2026-03-28', duration_minutes: 20, notes: null, created_at: '' },
      { id: '3', user_id: 'u', learning_item_id: 'i', study_date: '2026-03-27', duration_minutes: 45, notes: null, created_at: '' },
    ]
    const result = groupLogsByDate(logs)
    expect(result['2026-03-28']).toBe(50)
    expect(result['2026-03-27']).toBe(45)
  })

  test('빈 배열 입력 시 빈 객체 반환', () => {
    expect(groupLogsByDate([])).toEqual({})
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인 (Red)**

```bash
bun test apps/frontend/src/lib/format.test.ts 2>&1 | head -10
```

Expected: FAIL — `Cannot find module './format'`

- [ ] **Step 3: format.ts 구현 (Green)**

`apps/frontend/src/lib/format.ts`:
```typescript
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ProgressLog } from '@learning-tracker/shared-types'

export function formatDate(
  iso: string | null | undefined,
  fmt = 'yyyy-MM-dd HH:mm'
): string {
  if (!iso) return ''
  return format(new Date(iso), fmt)
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return ''
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ko })
}

export function groupLogsByDate(logs: ProgressLog[]): Record<string, number> {
  return logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.study_date] = (acc[log.study_date] ?? 0) + log.duration_minutes
    return acc
  }, {})
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인 (Green)**

```bash
bun test apps/frontend/src/lib/format.test.ts 2>&1
```

Expected: `7 pass, 0 fail`

- [ ] **Step 5: 커밋**

```bash
git add apps/frontend/src/lib/format.ts apps/frontend/src/lib/format.test.ts
git commit -m "feat: add date formatting utilities with unit tests"
```

---

## Task 3: UI 컴포넌트 (Card, Badge, Input)

**Files:**
- Create: `apps/frontend/src/components/ui/card.tsx`
- Create: `apps/frontend/src/components/ui/badge.tsx`
- Create: `apps/frontend/src/components/ui/input.tsx`

- [ ] **Step 1: Card 컴포넌트 작성**

`apps/frontend/src/components/ui/card.tsx`:
```typescript
import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="card-title"
      className={cn('text-base font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('p-6 pt-0', className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardTitle, CardContent }
```

- [ ] **Step 2: Badge 컴포넌트 작성**

`apps/frontend/src/components/ui/badge.tsx`:
```typescript
import { cn } from '@/lib/utils'
import type { ItemStatus, ContentType } from '@learning-tracker/shared-types'

const statusStyles: Record<ItemStatus, string> = {
  inbox:       'bg-gray-100   text-gray-700   dark:bg-gray-800     dark:text-gray-300',
  todo:        'bg-blue-100   text-blue-700   dark:bg-blue-900/40  dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  completed:   'bg-green-100  text-green-700  dark:bg-green-900/40 dark:text-green-300',
}

const statusLabels: Record<ItemStatus, string> = {
  inbox: '수신함',
  todo: '할 일',
  in_progress: '진행 중',
  completed: '완료',
}

const contentTypeStyles: Record<ContentType, string> = {
  url:     'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  article: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  video:   'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300',
  book:    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  note:    'bg-teal-100   text-teal-700   dark:bg-teal-900/40   dark:text-teal-300',
  problem: 'bg-pink-100   text-pink-700   dark:bg-pink-900/40   dark:text-pink-300',
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

export function ContentTypeBadge({ type }: { type: ContentType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        contentTypeStyles[type]
      )}
    >
      {type}
    </span>
  )
}
```

- [ ] **Step 3: Input 컴포넌트 작성**

`apps/frontend/src/components/ui/input.tsx`:
```typescript
import { cn } from '@/lib/utils'

function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-input dark:bg-input/30',
        className
      )}
      {...props}
    />
  )
}

export { Input }
```

- [ ] **Step 4: 타입 검사 + 커밋**

```bash
cd apps/frontend && bunx tsc --noEmit 2>&1 | grep -E "error TS" | head -10
cd ../..
git add apps/frontend/src/components/ui/
git commit -m "feat: add Card, Badge, Input UI components"
```

---

## Task 4: TanStack Query API 훅

**Files:**
- Create: `apps/frontend/src/lib/api/get-auth-headers.ts`
- Create: `apps/frontend/src/lib/api/hooks/use-topics.ts`
- Create: `apps/frontend/src/lib/api/hooks/use-learning-items.ts`
- Create: `apps/frontend/src/lib/api/hooks/use-progress-logs.ts`

> **인증 헤더:** 브라우저 Supabase 클라이언트(`createClient()`)의 `getSession()`으로 access_token을 가져와 `Authorization: Bearer <token>` 헤더로 전달. 공통 함수는 `get-auth-headers.ts`에 분리해 DRY 유지.

> **Hono RPC 타입 에러:** `hc` 클라이언트의 타입 추론이 실패하는 경우 `as any` 캐스트 허용. 기능 우선.

- [ ] **Step 1: 공유 인증 헤더 헬퍼 작성**

```bash
mkdir -p apps/frontend/src/lib/api/hooks
```

`apps/frontend/src/lib/api/get-auth-headers.ts`:
```typescript
import { createClient } from '@/lib/supabase/client'

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token ?? ''}` }
}
```

- [ ] **Step 2: use-topics.ts 작성**

`apps/frontend/src/lib/api/hooks/use-topics.ts`:
```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/get-auth-headers'
import { apiClient } from '@/lib/api/client'
import type { TopicInsert } from '@learning-tracker/shared-types'

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const res = await (apiClient.api.topics.$get as any)({}, { headers })
      if (!res.ok) throw new Error('Failed to fetch topics')
      return res.json()
    },
  })
}

export function useCreateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Omit<TopicInsert, 'user_id'>) => {
      const headers = await getAuthHeaders()
      const res = await (apiClient.api.topics.$post as any)({ json: body }, { headers })
      if (!res.ok) throw new Error('Failed to create topic')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics'] }),
  })
}

export function useUpdateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<Omit<TopicInsert, 'user_id'>> }) => {
      const headers = await getAuthHeaders()
      const res = await (apiClient.api.topics[':id'].$put as any)({ param: { id }, json: body }, { headers })
      if (!res.ok) throw new Error('Failed to update topic')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics'] }),
  })
}

export function useDeleteTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders()
      const res = await (apiClient.api.topics[':id'].$delete as any)({ param: { id } }, { headers })
      if (!res.ok) throw new Error('Failed to delete topic')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics'] }),
  })
}
```

- [ ] **Step 3: use-learning-items.ts 작성**

`apps/frontend/src/lib/api/hooks/use-learning-items.ts`:
```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/get-auth-headers'
import { apiClient } from '@/lib/api/client'
import type { LearningItemInsert, LearningItemUpdate } from '@learning-tracker/shared-types'

const items = (apiClient.api as any)['learning-items']

export function useLearningItems() {
  return useQuery({
    queryKey: ['learning-items'],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const res = await items.$get({}, { headers })
      if (!res.ok) throw new Error('Failed to fetch learning items')
      return res.json()
    },
  })
}

export function useCreateLearningItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Omit<LearningItemInsert, 'user_id'>) => {
      const headers = await getAuthHeaders()
      const res = await items.$post({ json: body }, { headers })
      if (!res.ok) throw new Error('Failed to create learning item')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning-items'] }),
  })
}

export function useUpdateLearningItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: LearningItemUpdate }) => {
      const headers = await getAuthHeaders()
      const res = await items[':id'].$put({ param: { id }, json: body }, { headers })
      if (!res.ok) throw new Error('Failed to update learning item')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning-items'] }),
  })
}

export function useDeleteLearningItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders()
      const res = await items[':id'].$delete({ param: { id } }, { headers })
      if (!res.ok) throw new Error('Failed to delete learning item')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning-items'] }),
  })
}
```

- [ ] **Step 4: use-progress-logs.ts 작성**

`apps/frontend/src/lib/api/hooks/use-progress-logs.ts`:
```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/get-auth-headers'
import { apiClient } from '@/lib/api/client'
import type { ProgressLogInsert } from '@learning-tracker/shared-types'

const logs = (apiClient.api as any)['progress-logs']

export function useProgressLogs() {
  return useQuery({
    queryKey: ['progress-logs'],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const res = await logs.$get({}, { headers })
      if (!res.ok) throw new Error('Failed to fetch progress logs')
      return res.json()
    },
  })
}

export function useCreateProgressLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Omit<ProgressLogInsert, 'user_id'>) => {
      const headers = await getAuthHeaders()
      const res = await logs.$post({ json: body }, { headers })
      if (!res.ok) throw new Error('Failed to create progress log')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-logs'] }),
  })
}

export function useDeleteProgressLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders()
      const res = await logs[':id'].$delete({ param: { id } }, { headers })
      if (!res.ok) throw new Error('Failed to delete progress log')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-logs'] }),
  })
}
```

- [ ] **Step 5: 타입 검사 + 커밋**

```bash
cd apps/frontend && bunx tsc --noEmit 2>&1 | grep -E "error TS" | head -10
cd ../..
git add apps/frontend/src/lib/api/get-auth-headers.ts apps/frontend/src/lib/api/hooks/
git commit -m "feat: add TanStack Query hooks for topics, learning-items, progress-logs"
```

---

## Task 5: 대시보드 셸 (레이아웃 + 사이드바 + 헤더)

**Files:**
- Create: `apps/frontend/src/components/layout/sidebar-nav.tsx`
- Create: `apps/frontend/src/components/layout/header.tsx`
- Create: `apps/frontend/src/components/layout/dashboard-shell.tsx`
- Modify: `apps/frontend/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: SidebarNav 작성**

```bash
mkdir -p apps/frontend/src/components/layout
```

`apps/frontend/src/components/layout/sidebar-nav.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, List, Kanban } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',       icon: LayoutDashboard, label: '대시보드' },
  { href: '/items',  icon: List,            label: '학습 목록' },
  { href: '/kanban', icon: Kanban,          label: '칸반 보드' },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-2">
      {navItems.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-muted hover:text-foreground',
            pathname === href
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground'
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Header 작성 (Server Component)**

`apps/frontend/src/components/layout/header.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { signout } from '@/app/(auth)/login/actions'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <span className="text-sm text-muted-foreground">{user?.email}</span>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <form action={signout}>
          <Button variant="ghost" size="sm" type="submit">
            로그아웃
          </Button>
        </form>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: DashboardShell 작성**

`apps/frontend/src/components/layout/dashboard-shell.tsx`:
```typescript
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Header } from '@/components/layout/header'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* 사이드바 */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-background py-4">
        <div className="px-4 pb-4">
          <h1 className="text-lg font-bold">Learning Tracker</h1>
        </div>
        <SidebarNav />
      </aside>
      {/* 본문 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: dashboard layout.tsx 수정**

`apps/frontend/src/app/(dashboard)/layout.tsx` 전체 교체:
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <DashboardShell>{children}</DashboardShell>
}
```

- [ ] **Step 5: 타입 검사 + 커밋**

```bash
cd apps/frontend && bunx tsc --noEmit 2>&1 | grep -E "error TS" | head -10
cd ../..
git add apps/frontend/src/components/layout/ apps/frontend/src/app/
git commit -m "feat: add dashboard shell with sidebar navigation and header"
```

---

## Task 6: 통계 대시보드 (히트맵 + 파이 차트)

**Files:**
- Create: `apps/frontend/src/components/charts/study-heatmap.tsx`
- Create: `apps/frontend/src/components/charts/topic-pie.tsx`
- Replace: `apps/frontend/src/app/(dashboard)/page.tsx`

- [ ] **Step 1: StudyHeatmap 작성**

```bash
mkdir -p apps/frontend/src/components/charts
```

> **히트맵 레이아웃:** GitHub 잔디처럼 열(week) 단위로 세로로 쌓이려면 `grid-auto-flow: column`과 `gridTemplateRows: 'repeat(7, ...)'`이 필요. `gridTemplateColumns`만 쓰면 행(row) 단위로 채워져서 레이아웃이 깨짐.

`apps/frontend/src/components/charts/study-heatmap.tsx`:
```typescript
'use client'

import { useMemo } from 'react'
import { eachDayOfInterval, subDays, format, getDay } from 'date-fns'
import { groupLogsByDate } from '@/lib/format'
import type { ProgressLog } from '@learning-tracker/shared-types'

function getIntensityClass(minutes: number): string {
  if (minutes === 0) return 'bg-muted'
  if (minutes < 30) return 'bg-green-200 dark:bg-green-900'
  if (minutes < 60) return 'bg-green-400 dark:bg-green-700'
  if (minutes < 120) return 'bg-green-600 dark:bg-green-500'
  return 'bg-green-800 dark:bg-green-300'
}

export function StudyHeatmap({ logs }: { logs: ProgressLog[] }) {
  const dateMap = useMemo(() => groupLogsByDate(logs), [logs])

  const today = new Date()
  const start = subDays(today, 364)
  const days = eachDayOfInterval({ start, end: today })

  // 첫 날의 요일만큼 빈 셀 앞에 추가 (일요일=0)
  const firstDayOfWeek = getDay(start)

  return (
    <div className="space-y-2">
      {/*
        grid-auto-flow: column → 열(주) 단위로 셀을 채움 (GitHub 잔디 방향)
        gridTemplateRows: 7행 = 월~일
        각 열은 1주(7일)를 담고, 53열 = 최대 53주
      */}
      <div
        className="grid gap-[3px]"
        style={{
          gridAutoFlow: 'column',
          gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
        }}
      >
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`pad-${i}`} className="size-3" />
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const minutes = dateMap[key] ?? 0
          return (
            <div
              key={key}
              title={`${key}: ${minutes}분`}
              className={`size-3 rounded-[2px] ${getIntensityClass(minutes)}`}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>적음</span>
        {['bg-muted', 'bg-green-200 dark:bg-green-900', 'bg-green-400 dark:bg-green-700', 'bg-green-600 dark:bg-green-500', 'bg-green-800 dark:bg-green-300'].map((cls, i) => (
          <div key={i} className={`size-3 rounded-[2px] ${cls}`} />
        ))}
        <span>많음</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TopicPieChart 작성**

`apps/frontend/src/components/charts/topic-pie.tsx`:
```typescript
'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { Topic, LearningItem } from '@learning-tracker/shared-types'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316']

interface Props {
  topics: Topic[]
  learningItems: LearningItem[]
}

export function TopicPieChart({ topics, learningItems }: Props) {
  const data = topics
    .map((topic) => ({
      name: topic.name,
      value: learningItems.filter((item) => item.topic_id === topic.id).length,
    }))
    .filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        토픽 데이터 없음
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3: 대시보드 홈 페이지 교체**

`apps/frontend/src/app/(dashboard)/page.tsx` 전체 교체:
```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StudyHeatmap } from '@/components/charts/study-heatmap'
import { TopicPieChart } from '@/components/charts/topic-pie'
import { useTopics } from '@/lib/api/hooks/use-topics'
import { useLearningItems } from '@/lib/api/hooks/use-learning-items'
import { useProgressLogs } from '@/lib/api/hooks/use-progress-logs'

export default function DashboardPage() {
  const { data: topics = [] } = useTopics()
  const { data: learningItems = [] } = useLearningItems()
  const { data: progressLogs = [] } = useProgressLogs()

  const completedCount  = learningItems.filter((i: any) => i.status === 'completed').length
  const inProgressCount = learningItems.filter((i: any) => i.status === 'in_progress').length
  const totalMinutes    = progressLogs.reduce((sum: number, log: any) => sum + log.duration_minutes, 0)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">대시보드</h2>

      {/* 요약 카드 3개 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>전체 학습 항목</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{learningItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>완료</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {completedCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>총 학습 시간</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 학습 히트맵 */}
      <Card>
        <CardHeader><CardTitle>학습 히트맵 (최근 1년)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <StudyHeatmap logs={progressLogs} />
        </CardContent>
      </Card>

      {/* 토픽별 파이 차트 */}
      <Card>
        <CardHeader><CardTitle>토픽별 학습 비중</CardTitle></CardHeader>
        <CardContent>
          <TopicPieChart topics={topics} learningItems={learningItems} />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: 타입 검사 + 커밋**

```bash
cd apps/frontend && bunx tsc --noEmit 2>&1 | grep -E "error TS" | head -10
cd ../..
git add apps/frontend/src/components/charts/ apps/frontend/src/app/
git commit -m "feat: add dashboard stats page with study heatmap and topic pie chart"
```

---

## Task 7: 학습 목록 테이블 (TanStack Table + 인라인 편집)

**Files:**
- Create: `apps/frontend/src/components/learning-items/inline-cell.tsx`
- Create: `apps/frontend/src/components/learning-items/items-table.tsx`
- Create: `apps/frontend/src/app/(dashboard)/items/page.tsx`

- [ ] **Step 1: InlineCell 컴포넌트 작성**

```bash
mkdir -p apps/frontend/src/components/learning-items
```

`apps/frontend/src/components/learning-items/inline-cell.tsx`:
```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  onSave: (value: string) => void
}

export function InlineCell({ value, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commit = () => {
    setEditing(false)
    if (draft.trim() && draft !== value) onSave(draft.trim())
    else setDraft(value)
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        className="h-7 w-full"
      />
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className="block cursor-pointer rounded px-1 py-0.5 hover:bg-muted"
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true) }}
    >
      {value || <span className="text-muted-foreground italic">클릭하여 편집</span>}
    </span>
  )
}
```

- [ ] **Step 2: ItemsTable 작성**

> **TanStack Table 주의:** `columns` 배열을 컴포넌트 내부에서 매 렌더마다 새로 생성하면 TanStack Table이 매번 재초기화됨. `useMemo`로 메모이제이션 필수. `updateItem`이 참조가 바뀌므로 dependency array에 포함.

`apps/frontend/src/components/learning-items/items-table.tsx`:
```typescript
'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { formatDate } from '@/lib/format'
import { StatusBadge, ContentTypeBadge } from '@/components/ui/badge'
import { InlineCell } from './inline-cell'
import { useLearningItems, useUpdateLearningItem } from '@/lib/api/hooks/use-learning-items'
import type { LearningItem } from '@learning-tracker/shared-types'

const col = createColumnHelper<LearningItem>()

export function ItemsTable() {
  const { data: items = [], isLoading } = useLearningItems()
  const { mutate: updateItem } = useUpdateLearningItem()
  const [sorting, setSorting] = useState<SortingState>([])

  // columns을 useMemo로 메모이제이션 — 매 렌더마다 재생성 방지
  const columns = useMemo<ColumnDef<LearningItem, any>[]>(
    () => [
      col.accessor('title', {
        header: '제목',
        cell: (info) => (
          <InlineCell
            value={info.getValue()}
            onSave={(title) =>
              updateItem({ id: info.row.original.id, body: { title } })
            }
          />
        ),
      }),
      col.accessor('status', {
        header: '상태',
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      col.accessor('content_type', {
        header: '유형',
        cell: (info) => <ContentTypeBadge type={info.getValue()} />,
      }),
      col.accessor('due_date', {
        header: '마감일',
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue(), 'yyyy-MM-dd')}
          </span>
        ),
      }),
      col.accessor('created_at', {
        header: '생성일',
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue(), 'yyyy-MM-dd')}
          </span>
        ),
      }),
    ],
    [updateItem]
  )

  const table = useReactTable({
    data: items as LearningItem[],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">불러오는 중...</div>
  }

  return (
    <div className="overflow-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-border bg-muted/50">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2.5 text-left font-medium text-muted-foreground"
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {(items as LearningItem[]).length === 0 && (
            <tr>
              <td colSpan={5} className="py-10 text-center text-muted-foreground">
                학습 항목이 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: items 페이지 작성**

```bash
mkdir -p "apps/frontend/src/app/(dashboard)/items"
```

`apps/frontend/src/app/(dashboard)/items/page.tsx`:
```typescript
import { ItemsTable } from '@/components/learning-items/items-table'

export default function ItemsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">학습 목록</h2>
      <ItemsTable />
    </div>
  )
}
```

- [ ] **Step 4: 타입 검사 + 커밋**

```bash
cd apps/frontend && bunx tsc --noEmit 2>&1 | grep -E "error TS" | head -10
cd ../..
git add apps/frontend/src/components/learning-items/ apps/frontend/src/app/
git commit -m "feat: add learning items table with inline title editing"
```

---

## Task 8: 칸반 보드 (dnd-kit)

**Files:**
- Create: `apps/frontend/src/components/kanban/kanban-card.tsx`
- Create: `apps/frontend/src/components/kanban/kanban-board.tsx`
- Create: `apps/frontend/src/app/(dashboard)/kanban/page.tsx`

- [ ] **Step 1: KanbanCard 작성**

> **DragOverlay 주의:** `DragOverlay` 내부에서 렌더되는 컴포넌트는 `SortableContext` 바깥에 있으므로 `useSortable`을 호출하면 런타임 에러 발생. `KanbanCard`(드래그 핸들 포함)와 `KanbanCardContent`(순수 카드 UI)를 분리해 오버레이에서는 `KanbanCardContent`만 사용.

```bash
mkdir -p apps/frontend/src/components/kanban
```

`apps/frontend/src/components/kanban/kanban-card.tsx`:
```typescript
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ContentTypeBadge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import type { LearningItem } from '@learning-tracker/shared-types'

// 순수 카드 UI — DragOverlay에서도 안전하게 사용 가능 (useSortable 없음)
export function KanbanCardContent({ item }: { item: LearningItem }) {
  return (
    <Card className="mb-2">
      <CardContent className="p-3">
        <div className="min-w-0 space-y-1.5">
          <p className="truncate text-sm font-medium leading-tight">{item.title}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <ContentTypeBadge type={item.content_type} />
            {item.due_date && (
              <span className="text-xs text-muted-foreground">
                {formatDate(item.due_date, 'MM/dd')}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 드래그 가능한 카드 — SortableContext 내부에서만 사용
export function KanbanCard({ item }: { item: LearningItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <KanbanCardContent item={item} />
    </div>
  )
}
```

- [ ] **Step 2: KanbanColumn (드롭 영역) + KanbanBoard 작성**

`apps/frontend/src/components/kanban/kanban-board.tsx`:
```typescript
'use client'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { KanbanCard, KanbanCardContent } from './kanban-card'
import { useLearningItems, useUpdateLearningItem } from '@/lib/api/hooks/use-learning-items'
import type { ItemStatus, LearningItem } from '@learning-tracker/shared-types'

const COLUMNS: { id: ItemStatus; label: string }[] = [
  { id: 'inbox',       label: '수신함'  },
  { id: 'todo',        label: '할 일'   },
  { id: 'in_progress', label: '진행 중' },
  { id: 'completed',   label: '완료'    },
]

function DroppableColumn({
  id,
  label,
  items,
}: {
  id: ItemStatus
  label: string
  items: LearningItem[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[400px] w-64 shrink-0 flex-col rounded-xl p-3 transition-colors',
        isOver ? 'bg-muted/70 ring-1 ring-border' : 'bg-muted/40'
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {items.length}
        </span>
      </div>
      <SortableContext
        id={id}
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <KanbanCard key={item.id} item={item} />
        ))}
      </SortableContext>
    </div>
  )
}

export function KanbanBoard() {
  const { data: rawItems = [], isLoading } = useLearningItems()
  const { mutate: updateItem } = useUpdateLearningItem()
  const [activeItem, setActiveItem] = useState<LearningItem | null>(null)

  const items = rawItems as LearningItem[]

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(items.find((i) => i.id === event.active.id) ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)
    if (!over) return

    const draggedItem = items.find((i) => i.id === active.id)
    if (!draggedItem) return

    // over.id가 컬럼 id(ItemStatus)이면 직접 사용,
    // 아니면 over.id가 아이템 id → 해당 아이템의 status가 대상 컬럼
    const targetStatus: ItemStatus | undefined =
      (COLUMNS.find((c) => c.id === over.id)?.id) ??
      (items.find((i) => i.id === over.id)?.status)

    if (targetStatus && draggedItem.status !== targetStatus) {
      updateItem({ id: draggedItem.id, body: { status: targetStatus } })
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">불러오는 중...</div>
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            id={col.id}
            label={col.label}
            items={items.filter((i) => i.status === col.id)}
          />
        ))}
      </div>
      {/* DragOverlay: SortableContext 밖이므로 KanbanCardContent 사용 (useSortable 없음) */}
      <DragOverlay>
        {activeItem ? <KanbanCardContent item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
```

- [ ] **Step 3: kanban 페이지 작성**

```bash
mkdir -p "apps/frontend/src/app/(dashboard)/kanban"
```

`apps/frontend/src/app/(dashboard)/kanban/page.tsx`:
```typescript
import { KanbanBoard } from '@/components/kanban/kanban-board'

export default function KanbanPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">칸반 보드</h2>
      <KanbanBoard />
    </div>
  )
}
```

- [ ] **Step 4: 타입 검사 + 커밋**

```bash
cd apps/frontend && bunx tsc --noEmit 2>&1 | grep -E "error TS" | head -10
cd ../..
git add apps/frontend/src/components/kanban/ apps/frontend/src/app/
git commit -m "feat: add kanban board with dnd-kit drag-and-drop status update"
```

---

## Task 9: 최종 검증

- [ ] **Step 1: 유닛 테스트 실행**

```bash
bun test apps/frontend/src/lib/format.test.ts 2>&1
```

Expected: `7 pass, 0 fail`

- [ ] **Step 2: 전체 타입 검사**

```bash
cd apps/frontend && bunx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
cd ../..
```

Expected: 0 errors (또는 Hono RPC 제네릭 관련 에러만 존재 — `as any` 캐스트로 이미 처리됨)

- [ ] **Step 3: 빌드 확인**

```bash
bun run --cwd apps/frontend build 2>&1 | tail -20
```

Expected: 빌드 성공 (`✓ Compiled` 또는 `Generating static pages`)

> **빌드 실패 시:** Supabase 환경변수 없는 경우 정적 페이지 생성 단계에서 에러가 날 수 있음. `next.config.ts`에 `output: 'standalone'` 없으면 무시해도 됨. `NEXT_PUBLIC_SUPABASE_URL=dummy` 등 더미 값으로 빌드 통과 확인 가능.

- [ ] **Step 4: 변경사항 확인 후 커밋**

```bash
git status
# 예상치 못한 파일(.env.local 등)이 없는지 확인 후 스테이징
git add apps/frontend/src/ bun.lock
git commit -m "feat: Phase 3 complete — dashboard UI with heatmap, table, kanban, dark mode"
```

---

## 수동 확인 체크리스트 (브라우저에서 검증)

> `bun run dev:frontend` + `bun run dev:backend` 동시 실행 후 확인 (Supabase 키 필요)

- [ ] `/` 접속 → 요약 카드 3개 + 히트맵 + 파이 차트 표시
- [ ] 헤더 테마 토글 클릭 → 다크/라이트 전환 확인
- [ ] 새로고침 후 테마 유지 확인 (next-themes localStorage persist)
- [ ] 사이드바 네비게이션 클릭 → active 스타일 전환 확인
- [ ] `/items` → 학습 목록 테이블 표시
- [ ] 테이블 제목 셀 클릭 → 인라인 input 편집 → Enter 저장 → API 호출 확인
- [ ] 헤더 컬럼 클릭 → 정렬(↑/↓) 동작 확인
- [ ] `/kanban` → 4개 컬럼 칸반 표시
- [ ] 카드 드래그 → 다른 컬럼에 드롭 → status 변경 + 새로고침 후 유지
