# 환경변수 설정 가이드

## 1. 로컬 개발 (.dev.vars)

`apps/backend/.dev.vars` 파일에 아래 변수를 추가합니다:

```
# 기존
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_WEBHOOK_SECRET=my-random-secret-string

# AI (Gemini 기본)
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# AI (OpenAI, 선택)
OPENAI_API_KEY=sk-...
```

## 2. Cloudflare 배포 (Secrets)

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_WEBHOOK_SECRET
wrangler secret put GOOGLE_GENERATIVE_AI_API_KEY
wrangler secret put OPENAI_API_KEY       # OpenAI 사용 시
```

`wrangler.toml`에 이미 설정된 공개 변수:
- `SUPABASE_URL`
- `AI_PROVIDER` (기본값: `gemini`)

## 3. Telegram 봇 생성

1. Telegram 앱에서 **@BotFather** 검색
2. `/newbot` 입력 → 봇 이름 입력 → 유저네임 입력 (xxx_bot)
3. 발급된 토큰을 `TELEGRAM_BOT_TOKEN`에 설정
4. `TELEGRAM_WEBHOOK_SECRET`에 임의의 시크릿 문자열 설정

## 4. Webhook 등록

배포 후 아래 URL로 POST 요청:

```
POST https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook
Content-Type: application/json

{
  "url": "https://{your-worker-domain}/webhook/telegram",
  "secret_token": "{TELEGRAM_WEBHOOK_SECRET}"
}
```

또는 `curl` 사용:

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-worker.workers.dev/webhook/telegram","secret_token":"your-secret"}'
```

## 5. Gemini API 키 발급

1. https://aistudio.google.com/apikey 접속
2. "Create API Key" 클릭
3. 발급된 키를 `GOOGLE_GENERATIVE_AI_API_KEY`에 설정

## 6. OpenAI API 키 발급 (선택)

1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. 발급된 키를 `OPENAI_API_KEY`에 설정
4. `wrangler.toml`에서 `AI_PROVIDER = "openai"` 로 변경

## 7. DB 마이그레이션

Supabase SQL 에디터에서 실행:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS briefing_hour integer DEFAULT 0;
-- 0 = UTC 00:00 = KST 09:00
```
