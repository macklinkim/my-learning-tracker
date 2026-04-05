# 배포 가이드 (Vercel + Cloudflare Workers)

## 사전 준비

- GitHub 계정 + 리포지토리
- Vercel 계정 (https://vercel.com)
- Cloudflare 계정 (Workers 배포용, 백엔드)
- Supabase 프로젝트 (이미 설정됨)

---

## 1단계: Git 커밋

```bash
cd my-learning-tracker

# Phase 4 커밋
git add apps/frontend/src/stores/ \
        apps/frontend/src/components/ui/dialog.tsx \
        apps/frontend/src/components/ui/select.tsx \
        apps/frontend/src/components/ui/textarea.tsx \
        apps/frontend/src/components/ui/label.tsx \
        apps/frontend/src/components/modals/ \
        apps/frontend/src/components/filters/ \
        apps/frontend/src/lib/schemas.ts \
        apps/frontend/src/components/kanban/ \
        apps/frontend/src/components/learning-items/ \
        apps/frontend/src/components/layout/dashboard-shell.tsx \
        apps/frontend/src/app/\(dashboard\)/items/ \
        apps/frontend/src/app/\(dashboard\)/kanban/ \
        apps/frontend/src/app/\(dashboard\)/page.tsx \
        apps/frontend/package.json \
        bun.lock

git commit -m "feat: Phase 4 - Zustand 전역 상태, 칸반 고도화, React Hook Form 모달 시스템"

# Phase 5 커밋
git add apps/backend/src/services/ \
        apps/backend/src/routes/ai.ts \
        apps/backend/src/routes/profile.ts \
        apps/backend/src/routes/telegram-webhook.ts \
        apps/backend/src/index.ts \
        apps/backend/wrangler.toml \
        apps/backend/package.json \
        apps/backend/ENV_SETUP.md \
        apps/frontend/src/lib/api/hooks/use-briefing.ts \
        apps/frontend/src/lib/api/hooks/use-profile.ts \
        apps/frontend/src/components/settings/ \
        apps/frontend/src/app/\(dashboard\)/settings/ \
        apps/frontend/src/components/layout/sidebar-nav.tsx \
        bun.lock

git commit -m "feat: Phase 5 - AI 학습 분석, Telegram 봇, Cron 일일 브리핑"
```

## 2단계: GitHub 리포지토리 생성 + 푸시

```bash
# GitHub CLI 사용 (또는 웹에서 수동 생성)
gh repo create my-learning-tracker --private --source=. --push

# 또는 수동으로:
git remote add origin https://github.com/<username>/my-learning-tracker.git
git branch -M main
git push -u origin main
```

## 3단계: Vercel 프론트엔드 배포

### 방법 A: Vercel CLI

```bash
# Vercel CLI 설치
bun add -g vercel

# 로그인
vercel login

# 프로젝트 연결 + 배포
vercel --cwd apps/frontend
```

### 방법 B: Vercel 대시보드 (권장)

1. https://vercel.com/new 에서 "Import Git Repository"
2. GitHub 리포지토리 선택
3. **Framework Preset:** Next.js
4. **Root Directory:** `apps/frontend` (중요!)
5. **Build Command:** `bun run build` (자동 감지)
6. **환경변수 설정:**

| 변수 | 값 |
|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://crouyvsnxlyysvoxzkhc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 대시보드 → Settings → API → anon key |
| `NEXT_PUBLIC_API_URL` | 백엔드 Workers URL (4단계에서 확인) |

7. "Deploy" 클릭

### 모노레포 설정 주의사항

Vercel이 모노레포를 인식하도록:
- Root Directory를 `apps/frontend`로 설정
- Install Command: `bun install` (루트에서 실행됨)
- Vercel은 자동으로 workspace 의존성 처리

## 4단계: Cloudflare Workers 백엔드 배포

```bash
cd apps/backend

# Cloudflare 로그인
bunx wrangler login

# Secrets 등록
bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
bunx wrangler secret put TELEGRAM_BOT_TOKEN
bunx wrangler secret put TELEGRAM_WEBHOOK_SECRET
bunx wrangler secret put GOOGLE_GENERATIVE_AI_API_KEY
# bunx wrangler secret put OPENAI_API_KEY  # OpenAI 사용 시

# 배포
bunx wrangler deploy
```

배포 후 출력되는 URL 확인 (예: `https://learning-tracker-backend.your-subdomain.workers.dev`)

## 5단계: 배포 후 설정

### 5a. Vercel 환경변수 업데이트

Vercel 대시보드 → Settings → Environment Variables:
- `NEXT_PUBLIC_API_URL` = 4단계에서 받은 Workers URL

재배포:
```bash
vercel --prod --cwd apps/frontend
# 또는 Vercel 대시보드에서 "Redeploy"
```

### 5b. CORS 업데이트

`apps/backend/src/index.ts`에서 CORS origin을 Vercel 도메인으로 변경:

```typescript
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',  // ← 추가
  ]
}))
```

변경 후 다시 배포:
```bash
cd apps/backend && bunx wrangler deploy
```

### 5c. Telegram Webhook 등록

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://learning-tracker-backend.your-subdomain.workers.dev/webhook/telegram",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

### 5d. Supabase DB 마이그레이션

Supabase 대시보드 → SQL Editor:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS briefing_hour integer DEFAULT 0;
```

### 5e. Supabase Redirect URL 설정

Supabase 대시보드 → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs에 추가: `https://your-app.vercel.app/auth/callback`

## 배포 체크리스트

- [ ] GitHub에 코드 푸시
- [ ] Vercel에 프론트엔드 배포 (Root: `apps/frontend`)
- [ ] Vercel 환경변수 설정 (SUPABASE_URL, ANON_KEY, API_URL)
- [ ] Cloudflare Workers에 백엔드 배포
- [ ] Cloudflare Secrets 등록 (5개)
- [ ] CORS origin에 Vercel 도메인 추가 → 재배포
- [ ] Telegram Webhook URL 등록
- [ ] Supabase 마이그레이션 (briefing_hour)
- [ ] Supabase Redirect URL 설정
- [ ] 배포된 사이트 접속 테스트
