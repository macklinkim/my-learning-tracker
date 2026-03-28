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
