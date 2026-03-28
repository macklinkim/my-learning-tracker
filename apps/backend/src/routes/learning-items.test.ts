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
        body: JSON.stringify({ content_type: 'url', status: 'inbox' }),
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
    expect(res.status).not.toBe(400)
  })
})
