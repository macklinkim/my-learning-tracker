import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import topics from './topics'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

const makeApp = () => {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  app.use('*', async (c, next) => {
    c.set('userId', 'test-user-id')
    await next()
  })
  app.route('/', topics)
  return app
}

const ENV = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
}

describe('topics routes', () => {
  test('GET / — 라우트 존재 (404 아님)', async () => {
    const app = makeApp()
    const res = await app.request('/', { method: 'GET' }, ENV)
    expect(res.status).not.toBe(404)
  })

  test('POST / — name 없으면 400 반환', async () => {
    const app = makeApp()
    const res = await app.request(
      '/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: '설명만 있고 name 없음' }),
      },
      ENV
    )
    expect(res.status).toBe(400)
  })

  test('PUT /:id — 빈 body는 허용 (partial update)', async () => {
    const app = makeApp()
    const res = await app.request(
      '/some-uuid',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
      ENV
    )
    expect(res.status).not.toBe(400)
  })
})
