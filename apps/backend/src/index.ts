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
