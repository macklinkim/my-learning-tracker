import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import { authMiddleware } from './auth'

type Bindings = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }
type Variables = { userId: string }

const makeApp = () => {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()
  app.use('/protected/*', authMiddleware)
  app.get('/protected/resource', (c) => c.json({ ok: true }))
  return app
}

const ENV = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
}

describe('authMiddleware', () => {
  test('Authorization 헤더 없으면 401 반환', async () => {
    const app = makeApp()
    const res = await app.request('/protected/resource', { method: 'GET' }, ENV)
    expect(res.status).toBe(401)
    const body = await res.json() as { error: string }
    expect(body.error).toBeDefined()
  })

  test('Bearer 형식이 아닌 헤더면 401 반환', async () => {
    const app = makeApp()
    const res = await app.request(
      '/protected/resource',
      { method: 'GET', headers: { Authorization: 'Basic invalidtoken' } },
      ENV
    )
    expect(res.status).toBe(401)
  })

  test('Bearer 형식이지만 유효하지 않은 토큰이면 401 반환', async () => {
    // 실제 Supabase 호출 발생 — test.supabase.co는 존재하지 않으므로 네트워크 에러 → 401 반환 확인
    const app = makeApp()
    const res = await app.request(
      '/protected/resource',
      { method: 'GET', headers: { Authorization: 'Bearer malformed.invalid.token' } },
      ENV
    )
    expect(res.status).toBe(401)
  })

  test('보호되지 않은 경로는 미들웨어 통과', async () => {
    const app = new Hono<{ Bindings: Bindings }>()
    app.use('/protected/*', authMiddleware)
    app.get('/public', (c) => c.json({ ok: true }))
    const res = await app.request('/public', { method: 'GET' }, ENV)
    expect(res.status).toBe(200)
  })
})
