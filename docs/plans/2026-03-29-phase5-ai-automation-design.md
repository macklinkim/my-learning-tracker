# Phase 5: AI & Automation — Design Spec

**Date:** 2026-03-29
**Goal:** Telegram Bot API 직접 연동, Vercel AI SDK 기반 학습 분석, Cloudflare Cron 일일 브리핑 구현

---

## 1. Telegram Bot API 직접 연동

### 1.1 서비스 — `services/telegram.ts`

Telegram Bot API를 `fetch()`로 직접 호출. 별도 라이브러리 없음.

```typescript
// 핵심 함수
sendMessage(botToken: string, chatId: string, text: string, parseMode?: 'Markdown' | 'HTML'): Promise<boolean>
setWebhook(botToken: string, url: string, secret: string): Promise<boolean>
```

### 1.2 Webhook 수신 — `routes/telegram-webhook.ts`

- `POST /webhook/telegram` — 공개 엔드포인트 (auth 미들웨어 미적용)
- `X-Telegram-Bot-Api-Secret-Token` 헤더로 요청 검증
- 지원 명령:
  - `/start` → chat_id 반환 + 연동 안내 메시지
  - `/briefing` → 즉시 AI 브리핑 트리거 (chat_id로 사용자 조회 → 분석 → 발송)

### 1.3 환경변수

| 변수 | 용도 | 저장 위치 |
|------|------|-----------|
| `TELEGRAM_BOT_TOKEN` | Bot Father 발급 토큰 | `.dev.vars` + `wrangler secret` |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook 검증용 시크릿 | `.dev.vars` + `wrangler secret` |

---

## 2. AI 학습 분석 (Vercel AI SDK)

### 2.1 Provider 팩토리 — `services/ai-provider.ts`

- `AI_PROVIDER` 환경변수로 `gemini` | `openai` 선택 (기본값: `gemini`)
- `@ai-sdk/google` + `@ai-sdk/openai` 패키지 사용
- `getModel(env)` → 선택된 provider의 모델 인스턴스 반환

```typescript
// gemini → google('gemini-2.0-flash')
// openai → openai('gpt-4o-mini')
```

### 2.2 분석 서비스 — `services/ai-analysis.ts`

**`generateBriefing(env, userId)`** — 핵심 함수:

1. Supabase에서 최근 7일 데이터 조회:
   - `progress_logs` (study_date >= 7일 전)
   - 관련 `learning_items` (JOIN)
   - `topics`
2. 통계 계산:
   - 총 학습 시간 (분)
   - 일별 학습 분포
   - 토픽별 비중
   - 완료된 항목 수 / 전체 항목 수
3. 프롬프트 구성 → `generateText()` 호출
4. 반환: `{ summary, strengths, improvements, recommendations }`

**프롬프트:**
```
시스템: 당신은 학습 코치입니다. 사용자의 최근 7일 학습 데이터를 분석하고,
한국어로 간결하게 피드백을 제공합니다.

응답 형식:
📊 요약: (1-2줄)
💪 잘한 점: (1-2개)
📈 개선점: (1-2개)
🎯 다음 추천: (구체적 학습 항목 1-2개)

유저: [통계 데이터 JSON]
```

### 2.3 API 엔드포인트 — `routes/ai.ts`

- `POST /api/ai/briefing` — 인증 필요
  - 현재 사용자의 브리핑 생성
  - Telegram chat_id가 있으면 Telegram에도 발송
  - 응답: `{ briefing: string }` (프론트엔드 표시용)

### 2.4 환경변수

| 변수 | 용도 | 저장 위치 |
|------|------|-----------|
| `AI_PROVIDER` | `gemini` \| `openai` (기본: `gemini`) | `wrangler.toml [vars]` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API 키 | `.dev.vars` + `wrangler secret` |
| `OPENAI_API_KEY` | OpenAI API 키 (선택) | `.dev.vars` + `wrangler secret` |

---

## 3. Cron 일일 브리핑

### 3.1 DB 마이그레이션

```sql
ALTER TABLE profiles ADD COLUMN briefing_hour integer DEFAULT 0;
-- 0 = UTC 00:00 = KST 09:00
```

### 3.2 Cron Trigger — `wrangler.toml`

```toml
[triggers]
crons = ["0 * * * *"]  # 매 정시 실행
```

### 3.3 Scheduled 핸들러 — `index.ts`

```typescript
export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    // 현재 UTC 시간의 hour
    const currentHour = new Date(event.scheduledTime).getUTCHours()
    // briefing_hour가 currentHour인 사용자 + telegram_chat_id IS NOT NULL 조회
    // 각 사용자에 대해: generateBriefing() → sendMessage()
  },
}
```

### 3.4 수동 트리거

`POST /api/ai/briefing` 호출 시:
- AI 분석 결과를 JSON으로 응답 (프론트엔드 표시)
- `telegram_chat_id`가 있으면 Telegram에도 동시 발송

### 3.5 프론트엔드 연동

- 대시보드에 "지금 브리핑 받기" 버튼 → `POST /api/ai/briefing` 호출
- 설정: 브리핑 시간 선택 (KST 시간 → UTC 변환 저장)
- 설정: Telegram chat_id 입력 필드

---

## 4. 신규 패키지

**Backend (`apps/backend/`):**
- `ai` — Vercel AI SDK 코어
- `@ai-sdk/google` — Gemini provider
- `@ai-sdk/openai` — OpenAI provider

**Frontend (`apps/frontend/`):**
- 추가 패키지 없음 (기존 TanStack Query mutation으로 API 호출)

---

## 5. 파일 구조

```
apps/backend/src/
├── index.ts                          # (Modify) scheduled 핸들러 추가, Bindings 타입 확장
├── services/
│   ├── telegram.ts                   # (Create) Telegram Bot API fetch 래퍼
│   ├── ai-provider.ts               # (Create) Vercel AI SDK provider 팩토리
│   └── ai-analysis.ts               # (Create) 학습 데이터 분석 + 브리핑 생성
├── routes/
│   ├── telegram-webhook.ts           # (Create) Webhook 수신 + 명령 처리
│   └── ai.ts                        # (Create) AI 브리핑 API

apps/frontend/src/
├── lib/api/hooks/
│   └── use-briefing.ts              # (Create) POST /api/ai/briefing mutation
├── components/
│   └── settings/
│       └── telegram-settings.tsx     # (Create) Telegram chat_id + 브리핑 시간 설정
├── app/(dashboard)/
│   └── page.tsx                     # (Modify) "지금 브리핑 받기" 버튼 추가
```

---

## 6. 환경변수 설정 가이드

### 로컬 개발 (.dev.vars)

```
# 기존
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Phase 5 추가
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_WEBHOOK_SECRET=my-webhook-secret-string
AI_PROVIDER=gemini
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
OPENAI_API_KEY=sk-...   # (선택, OpenAI 사용 시)
```

### Cloudflare 배포 시

```bash
# Secrets
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_WEBHOOK_SECRET
wrangler secret put GOOGLE_GENERATIVE_AI_API_KEY
wrangler secret put OPENAI_API_KEY  # 선택

# wrangler.toml [vars]에 추가
# AI_PROVIDER = "gemini"
```

### Telegram 봇 생성

1. Telegram에서 @BotFather 검색
2. `/newbot` → 봇 이름 + 유저네임 입력
3. 발급된 토큰을 `TELEGRAM_BOT_TOKEN`에 설정
4. Webhook 등록: 배포 후 `POST /webhook/telegram/setup` 또는 수동으로 `setWebhook()` 호출

### Gemini API 키

1. https://aistudio.google.com/apikey 에서 API 키 발급
2. `GOOGLE_GENERATIVE_AI_API_KEY`에 설정
