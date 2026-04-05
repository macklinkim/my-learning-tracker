# Phase 5: AI & Automation — 구현 완료 보고

**구현일:** 2026-03-29
**상태:** 완료 (API 키 설정 후 실제 AI/Telegram 기능 사용 가능)

---

## 목표

Telegram Bot API 연동, Vercel AI SDK 학습 분석, Cloudflare Cron 일일 브리핑

## 설치된 패키지 (apps/backend)

- `ai` v6.0.141 — Vercel AI SDK 코어
- `@ai-sdk/google` v3.0.53 — Gemini provider
- `@ai-sdk/openai` v3.0.48 — OpenAI provider
- `date-fns` v4.1.0 — 날짜 계산/포맷

## 생성된 파일

### Backend 서비스 (4개)

| 파일 | 역할 |
|------|------|
| `services/telegram.ts` | Telegram Bot API fetch 래퍼 (sendMessage, setWebhook) |
| `services/ai-provider.ts` | AI 모델 팩토리 — `AI_PROVIDER` 환경변수로 Gemini/OpenAI 전환 |
| `services/ai-analysis.ts` | 7일 progress_logs 분석 → 통계 계산 → generateText() 호출 |
| `services/cron-briefing.ts` | Scheduled 핸들러 — briefing_hour 매칭 사용자에게 브리핑 발송 |

### Backend 라우트 (3개)

| 파일 | 역할 |
|------|------|
| `routes/telegram-webhook.ts` | `/webhook/telegram` — /start, /briefing 명령 처리 (secret 검증) |
| `routes/ai.ts` | `POST /api/ai/briefing` — AI 브리핑 생성 + Telegram 동시 발송 |
| `routes/profile.ts` | `GET/PUT /api/profile` — 프로필 조회/수정 (telegram_chat_id, briefing_hour) |

### Backend 문서 (1개)

| 파일 | 역할 |
|------|------|
| `ENV_SETUP.md` | 환경변수 설정 가이드 (Telegram 봇 생성, API 키 발급, Webhook 등록, DB 마이그레이션) |

### Frontend (4개)

| 파일 | 역할 |
|------|------|
| `lib/api/hooks/use-briefing.ts` | POST /api/ai/briefing mutation 훅 |
| `lib/api/hooks/use-profile.ts` | 프로필 조회/업데이트 훅 |
| `components/settings/telegram-settings.tsx` | Telegram chat_id 입력 + 브리핑 시간(KST) 선택 |
| `app/(dashboard)/settings/page.tsx` | 설정 페이지 |

## 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `backend/src/index.ts` | Bindings 확장 (7개 환경변수), 라우트 마운트 (telegram-webhook, ai, profile), scheduled export 추가 |
| `backend/wrangler.toml` | AI_PROVIDER 변수, cron trigger (`0 * * * *`), secret 주석 가이드 |
| `backend/.dev.vars` | Telegram/AI 환경변수 플레이스홀더 추가 |
| `frontend sidebar-nav.tsx` | 설정(Settings) 링크 추가 |
| `frontend (dashboard)/page.tsx` | AI 브리핑 카드 (Sparkles 아이콘 + "브리핑 받기" 버튼 + 결과 표시) |

## API 엔드포인트 요약

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/webhook/telegram` | Secret header | Telegram Webhook 수신 |
| POST | `/api/ai/briefing` | Bearer JWT | AI 학습 브리핑 생성 |
| GET | `/api/profile` | Bearer JWT | 프로필 조회 |
| PUT | `/api/profile` | Bearer JWT | 프로필 수정 |

## 테스트 결과 (2026-03-29)

| 테스트 | 기대 | 결과 |
|--------|------|------|
| `GET /` | 200 | OK |
| `GET /health` | 200 | OK |
| `POST /api/ai/briefing` (no auth) | 401 | Unauthorized |
| `GET /api/profile` (no auth) | 401 | Unauthorized |
| Webhook no secret | 403 | Forbidden |
| Webhook `/start` with secret | 200 | OK |
| Webhook `/briefing` with secret | 200 | OK |
| Webhook unknown cmd | 200 | OK |
| Cron trigger | OK | OK |

## 사용 전 필수 설정

1. **Telegram 봇 생성:** @BotFather에서 봇 토큰 발급 → `.dev.vars`의 `TELEGRAM_BOT_TOKEN` 교체
2. **Gemini API 키:** https://aistudio.google.com/apikey → `.dev.vars`의 `GOOGLE_GENERATIVE_AI_API_KEY` 교체
3. **DB 마이그레이션:** Supabase SQL 에디터에서 실행:
   ```sql
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS briefing_hour integer DEFAULT 0;
   ```
4. **Webhook 등록:** 배포 후 Telegram setWebhook API 호출 (상세: `ENV_SETUP.md` 참조)

## 아키텍처 결정 사항

- **Telegram:** Telegraf.js 대신 Bot API 직접 호출 (Workers 호환성, 의존성 최소화)
- **AI Provider:** Vercel AI SDK + createGoogleGenerativeAI/createOpenAI 팩토리 패턴 (API 키 명시 전달 — Workers 환경에서 process.env 미지원)
- **Cron:** 매 정시 실행 (`0 * * * *`) → briefing_hour 매칭 사용자 조회 → 개별 발송
- **브리핑 시간:** 사용자별 설정 가능 (KST 시간 선택 → UTC 변환 저장)
- **export default:** `app` → `{ fetch: app.fetch, scheduled }` (Cloudflare Workers scheduled handler 지원)
