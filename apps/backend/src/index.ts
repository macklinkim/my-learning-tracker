import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from './middleware/auth'
import topics from './routes/topics'
import learningItems from './routes/learning-items'
import progressLogs from './routes/progress-logs'
import aiRoutes from './routes/ai'
import profileRoutes from './routes/profile'
import telegramWebhook from './routes/telegram-webhook'
import { handleScheduledBriefing } from './services/cron-briefing'

export type Bindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_WEBHOOK_SECRET: string
  AI_PROVIDER: string
  GOOGLE_GENERATIVE_AI_API_KEY: string
  OPENAI_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS (로컬 개발용)
app.use('*', cors({ origin: ['http://localhost:3000'] }))

// 공개 엔드포인트
app.get('/', (c) => c.json({ message: 'Learning Tracker API', status: 'ok' }))
app.get('/health', (c) =>
  c.json({ status: 'healthy', timestamp: new Date().toISOString() })
)

// Telegram Webhook (auth 미적용 — Telegram 서버에서 호출)
app.route('/webhook/telegram', telegramWebhook)

// 보호된 API 라우트 (auth 미들웨어 적용 후 라우트 마운트)
app.use('/api/*', authMiddleware)

const routes = app
  .route('/api/topics', topics)
  .route('/api/learning-items', learningItems)
  .route('/api/progress-logs', progressLogs)
  .route('/api/ai', aiRoutes)
  .route('/api/profile', profileRoutes)

// Hono RPC 타입 추론용 export
export type AppType = typeof routes

export default {
  fetch: app.fetch,
  async scheduled(
    event: { scheduledTime: number; cron: string },
    env: Bindings,
    ctx: { waitUntil(promise: Promise<unknown>): void }
  ) {
    ctx.waitUntil(handleScheduledBriefing(env, event.scheduledTime))
  },
}
