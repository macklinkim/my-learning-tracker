# Phase 5: AI & Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Telegram Bot API 직접 연동 + Vercel AI SDK(Gemini/OpenAI) 학습 분석 + Cloudflare Cron 일일 브리핑 시스템을 구축한다.

**Architecture:** Telegram Bot API를 fetch()로 직접 호출, Vercel AI SDK의 generateText()로 학습 데이터 분석, Cloudflare Cron Triggers로 매 정시 브리핑 발송. 기존 Hono API + Supabase + TanStack Query 패턴을 그대로 따른다.

**Tech Stack:** Hono, Vercel AI SDK (ai, @ai-sdk/google, @ai-sdk/openai), Supabase, Cloudflare Workers (Cron Triggers), date-fns

**Working Directory:** `/c/Users/mack/Desktop/projects/study/classmanage/my-learning-tracker/`

**Spec:** `docs/superpowers/specs/2026-03-29-phase5-ai-automation-design.md`

> **Bindings 타입:** `index.ts`의 `Bindings` 타입에 새 환경변수를 추가해야 함. 각 서비스/라우트 파일에서도 동일한 Bindings 타입 사용.

> **인증:** `/webhook/telegram`은 auth 미들웨어 미적용 (Telegram 서버 호출). 대신 `X-Telegram-Bot-Api-Secret-Token` 헤더로 검증. `/api/*` 경로는 기존 authMiddleware 적용.

> **Cloudflare Workers:** `nodejs_compat` 플래그 이미 활성화됨. Vercel AI SDK가 Workers에서 동작하려면 이 플래그 필요.

---

## Step 1: 패키지 설치

- [ ] `apps/backend/`에서 AI SDK 패키지 설치:
  ```bash
  bun add ai @ai-sdk/google @ai-sdk/openai
  ```
- [ ] `date-fns`가 backend에 없으면 추가:
  ```bash
  bun add date-fns
  ```

**Verify:** `package.json`에서 `ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `date-fns` 확인

---

## Step 2: 환경변수 및 Bindings 타입 확장

### 2a. Bindings 타입 업데이트

- [ ] `apps/backend/src/index.ts`의 `Bindings` 타입에 추가:

```typescript
type Bindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_WEBHOOK_SECRET: string
  AI_PROVIDER: string          // 'gemini' | 'openai'
  GOOGLE_GENERATIVE_AI_API_KEY: string
  OPENAI_API_KEY: string
}
```

### 2b. wrangler.toml 업데이트

- [ ] `wrangler.toml`의 `[vars]` 섹션에 추가:

```toml
AI_PROVIDER = "gemini"
```

- [ ] `[triggers]` 섹션 추가:

```toml
[triggers]
crons = ["0 * * * *"]
```

### 2c. .dev.vars 가이드 문서

- [ ] `apps/backend/ENV_SETUP.md` 파일 생성 — 환경변수 설정 가이드:
  - `.dev.vars`에 추가할 변수 목록 (TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, GOOGLE_GENERATIVE_AI_API_KEY, OPENAI_API_KEY)
  - Cloudflare 배포 시 `wrangler secret put` 명령어 목록
  - Telegram 봇 생성 절차 (@BotFather)
  - Gemini API 키 발급 절차
  - Webhook 등록 방법

**Verify:** TypeScript에서 `c.env.TELEGRAM_BOT_TOKEN` 등 접근 가능

---

## Step 3: Telegram 서비스 구현

- [ ] `apps/backend/src/services/telegram.ts` 생성

```typescript
const TELEGRAM_API = 'https://api.telegram.org/bot'

export async function sendMessage(
  botToken: string,
  chatId: string,
  text: string,
  parseMode: 'Markdown' | 'HTML' = 'Markdown'
): Promise<boolean> {
  const res = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  })
  return res.ok
}

export async function setWebhook(
  botToken: string,
  url: string,
  secretToken: string
): Promise<boolean> {
  const res = await fetch(`${TELEGRAM_API}${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, secret_token: secretToken }),
  })
  return res.ok
}
```

**Verify:** 함수 시그니처가 올바르고 TypeScript 에러 없음

---

## Step 4: Telegram Webhook 라우트

- [ ] `apps/backend/src/routes/telegram-webhook.ts` 생성

구현 내용:
- `POST /` — Telegram 업데이트 수신
  - `X-Telegram-Bot-Api-Secret-Token` 헤더 검증 → 불일치 시 403
  - `update.message.text` 파싱
  - `/start` → chat_id + 연동 안내 메시지 응답 ("당신의 Chat ID: {chat_id}\n대시보드 설정에서 이 ID를 입력하세요.")
  - `/briefing` → chat_id로 profiles 테이블에서 user_id 조회 → `generateBriefing()` → `sendMessage()` 발송
  - 알 수 없는 명령 → 도움말 메시지

- [ ] `apps/backend/src/index.ts`에 webhook 라우트 마운트:
  - `app.route('/webhook/telegram', telegramWebhook)` — `/api/*` 아래가 아님 (auth 미적용)

**Verify:** webhook 라우트가 auth 미들웨어를 거치지 않는지 확인 (마운트 위치)

---

## Step 5: AI Provider 팩토리

- [ ] `apps/backend/src/services/ai-provider.ts` 생성

```typescript
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'

export function getModel(env: { AI_PROVIDER: string; GOOGLE_GENERATIVE_AI_API_KEY: string; OPENAI_API_KEY: string }) {
  switch (env.AI_PROVIDER) {
    case 'openai':
      return openai('gpt-4o-mini', { apiKey: env.OPENAI_API_KEY })
    case 'gemini':
    default:
      return google('gemini-2.0-flash', { apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })
  }
}
```

> **주의:** Cloudflare Workers에서 AI SDK 사용 시 `@ai-sdk/google`과 `@ai-sdk/openai`의 API 키를 함수 인자로 전달해야 함 (환경변수 자동 감지 안 됨). 실제 API가 `apiKey` 옵션을 어떻게 받는지 설치 후 확인 필요.

**Verify:** TypeScript 컴파일 통과

---

## Step 6: AI 분석 서비스

- [ ] `apps/backend/src/services/ai-analysis.ts` 생성

**`generateBriefing(env, userId)`** 함수:

1. Supabase 클라이언트 생성
2. 데이터 조회 (최근 7일):
   ```typescript
   const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')
   // progress_logs WHERE study_date >= sevenDaysAgo AND user_id = userId
   // learning_items WHERE user_id = userId
   // topics WHERE user_id = userId
   ```
3. 통계 계산:
   - 총 학습 시간 (분), 일별 분포, 토픽별 비중, 완료율
4. 프롬프트 구성:
   ```
   시스템: 당신은 학습 코치입니다. 사용자의 최근 7일 학습 데이터를 분석하고,
   한국어로 간결하게 피드백을 제공합니다.

   응답 형식:
   📊 요약: (1-2줄)
   💪 잘한 점: (1-2개)
   📈 개선점: (1-2개)
   🎯 다음 추천: (구체적 학습 항목 1-2개)
   ```
5. `generateText({ model: getModel(env), system, prompt })` 호출
6. 반환: `{ briefing: string }` (LLM 응답 텍스트)

- 데이터가 없는 경우 (학습 기록 0건) → AI 호출 없이 기본 메시지 반환

**Verify:** TypeScript 컴파일 + 함수 시그니처 확인

---

## Step 7: AI 브리핑 API 엔드포인트

- [ ] `apps/backend/src/routes/ai.ts` 생성

- `POST /briefing` — 인증 필요 (authMiddleware 적용)
  1. `c.get('userId')` → `generateBriefing(c.env, userId)` 호출
  2. 결과를 JSON 응답: `{ briefing: string }`
  3. `profiles.telegram_chat_id`가 있으면 → `sendMessage()` 로 Telegram에도 발송 (비동기, 실패해도 API 응답에 영향 없음)

- [ ] `index.ts`에 라우트 마운트:
  - `.route('/api/ai', aiRoutes)` — `/api/*` 아래이므로 auth 자동 적용

**Verify:** `POST /api/ai/briefing` 호출 시 200 응답 (실제 AI 호출은 API 키 설정 후 테스트)

---

## Step 8: Cron Scheduled 핸들러

### 8a. DB 마이그레이션

- [ ] Supabase SQL 에디터에서 실행할 마이그레이션 SQL 문서화 (`apps/backend/ENV_SETUP.md`에 추가):
  ```sql
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS briefing_hour integer DEFAULT 0;
  -- 0 = UTC 00:00 = KST 09:00
  ```

### 8b. Scheduled 핸들러

- [ ] `apps/backend/src/services/cron-briefing.ts` 생성

```typescript
export async function handleScheduledBriefing(env: Bindings, scheduledTime: number) {
  const currentHour = new Date(scheduledTime).getUTCHours()
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  // briefing_hour가 currentHour이고 telegram_chat_id가 있는 사용자 조회
  const { data: users } = await supabase
    .from('profiles')
    .select('id, telegram_chat_id')
    .eq('briefing_hour', currentHour)
    .not('telegram_chat_id', 'is', null)

  if (!users?.length) return

  // 각 사용자에게 브리핑 생성 + 발송
  for (const user of users) {
    const result = await generateBriefing(env, user.id)
    await sendMessage(env.TELEGRAM_BOT_TOKEN, user.telegram_chat_id, result.briefing)
  }
}
```

### 8c. index.ts에 scheduled export

- [ ] `apps/backend/src/index.ts` 수정:

```typescript
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduledBriefing(env, event.scheduledTime))
  },
}
```

기존 `export default app` → `export default { fetch: app.fetch, scheduled }` 로 변경.

> **주의:** 이 변경은 Hono RPC 타입 export (`AppType`)에 영향을 줄 수 있음. 프론트엔드의 `client.ts`에서 `AppType` 참조 방식 확인 필요.

**Verify:** `wrangler dev` 실행 시 cron trigger 등록 메시지 확인

---

## Step 9: 프론트엔드 연동

### 9a. 브리핑 API 훅

- [ ] `apps/frontend/src/lib/api/hooks/use-briefing.ts` 생성
- `useBriefing()` — `POST /api/ai/briefing` mutation
- 로딩 중 상태 + 결과 텍스트 저장

### 9b. 프로필 업데이트 훅

- [ ] `apps/frontend/src/lib/api/hooks/use-profile.ts` 생성 (또는 기존 파일에 추가)
- `useProfile()` — 현재 사용자 프로필 조회
- `useUpdateProfile()` — `telegram_chat_id`, `briefing_hour` 업데이트

### 9c. Telegram 설정 컴포넌트

- [ ] `apps/frontend/src/components/settings/telegram-settings.tsx` 생성
- Telegram Chat ID 입력 (Input)
- 브리핑 시간 선택 (Select, KST 기준 00시~23시 → UTC 변환 저장)
- 저장 버튼 → `useUpdateProfile()` mutation

### 9d. 대시보드에 브리핑 버튼 + 결과 표시

- [ ] `apps/frontend/src/app/(dashboard)/page.tsx` 수정
- "AI 브리핑 받기" 버튼 추가 → `useBriefing()` 호출
- 브리핑 결과를 Card로 표시 (Markdown → 줄바꿈 처리)

### 9e. 설정 페이지 추가

- [ ] `apps/frontend/src/app/(dashboard)/settings/page.tsx` 생성
- `<TelegramSettings />` 컴포넌트 렌더
- [ ] `apps/frontend/src/components/layout/sidebar-nav.tsx` 수정 — 설정 링크 추가

**Verify:** 프론트엔드 빌드 성공 (`bun run --filter frontend build`)

---

## Step 10: 프로필 API 엔드포인트 (백엔드)

- [ ] `apps/backend/src/routes/profile.ts` 생성 (또는 기존 파일에 추가)
- `GET /api/profile` — 현재 사용자 프로필 조회
- `PUT /api/profile` — 프로필 업데이트 (telegram_chat_id, briefing_hour 등)

- [ ] `index.ts`에 라우트 마운트

**Verify:** `GET /api/profile`, `PUT /api/profile` 정상 동작

---

## Step 11: 빌드 확인 및 통합 테스트

- [ ] `bun run --filter frontend build` 빌드 성공 확인
- [ ] `bun run --filter backend typecheck` 타입체크 성공 확인
- [ ] 통합 플로우 검증 (API 키 설정 필요):
  1. Telegram 봇 생성 + 토큰 설정
  2. Webhook 등록
  3. `/start` 명령 → chat_id 반환
  4. 대시보드에서 chat_id 입력 + 브리핑 시간 설정
  5. "AI 브리핑 받기" 클릭 → 분석 결과 표시 + Telegram 메시지 수신
  6. Cron 시뮬레이션 (`wrangler dev --test-scheduled`)
