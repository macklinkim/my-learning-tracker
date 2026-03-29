import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'
import { generateBriefing } from '../services/ai-analysis'
import { sendMessage } from '../services/telegram'
import type { Bindings } from '../index'

type Variables = { userId: string }

const ai = new Hono<{ Bindings: Bindings; Variables: Variables }>()

ai.post('/briefing', async (c) => {
  const userId = c.get('userId')

  const result = await generateBriefing(c.env, userId)

  // Telegram 발송 (chat_id가 있으면, 비동기 — 실패해도 API 응답에 영향 없음)
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: profile } = await supabase
    .from('profiles')
    .select('telegram_chat_id')
    .eq('id', userId)
    .single()

  if (profile?.telegram_chat_id) {
    // fire-and-forget
    sendMessage(c.env.TELEGRAM_BOT_TOKEN, profile.telegram_chat_id, result.briefing).catch(() => {})
  }

  return c.json(result)
})

export default ai
