import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'
import { sendMessage } from '../services/telegram'
import { generateBriefing } from '../services/ai-analysis'
import type { Bindings } from '../index'

type Variables = { userId: string }

const telegramWebhook = new Hono<{ Bindings: Bindings; Variables: Variables }>()

telegramWebhook.post('/', async (c) => {
  // Webhook secret 검증
  const secretHeader = c.req.header('X-Telegram-Bot-Api-Secret-Token')
  if (!c.env.TELEGRAM_WEBHOOK_SECRET || secretHeader !== c.env.TELEGRAM_WEBHOOK_SECRET) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const update = await c.req.json()
  const message = update?.message
  if (!message?.text) {
    return c.json({ ok: true })
  }

  const chatId = String(message.chat.id)
  const text = message.text.trim()
  const botToken = c.env.TELEGRAM_BOT_TOKEN

  if (text === '/start') {
    await sendMessage(
      botToken,
      chatId,
      `안녕하세요! Learning Tracker 봇입니다.\n\n` +
        `당신의 Chat ID: \`${chatId}\`\n\n` +
        `대시보드 설정 페이지에서 이 ID를 입력하면 일일 AI 학습 브리핑을 받을 수 있습니다.\n\n` +
        `명령어:\n` +
        `/briefing — 지금 바로 AI 학습 브리핑 받기`
    )
    return c.json({ ok: true })
  }

  if (text === '/briefing') {
    // chat_id로 사용자 조회
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_chat_id', chatId)
      .single()

    if (!profile) {
      await sendMessage(
        botToken,
        chatId,
        '아직 계정이 연동되지 않았습니다.\n대시보드 설정에서 Chat ID를 등록해주세요.'
      )
      return c.json({ ok: true })
    }

    const result = await generateBriefing(c.env, profile.id)
    await sendMessage(botToken, chatId, result.briefing)
    return c.json({ ok: true })
  }

  // 알 수 없는 명령
  await sendMessage(
    botToken,
    chatId,
    '사용 가능한 명령어:\n/start — 봇 시작 + Chat ID 확인\n/briefing — AI 학습 브리핑 받기'
  )
  return c.json({ ok: true })
})

export default telegramWebhook
