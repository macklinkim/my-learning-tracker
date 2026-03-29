import { createClient } from '@supabase/supabase-js'
import { generateBriefing } from './ai-analysis'
import { sendMessage } from './telegram'
import type { Bindings } from '../index'

export async function handleScheduledBriefing(
  env: Bindings,
  scheduledTime: number
) {
  const currentHour = new Date(scheduledTime).getUTCHours()
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  // briefing_hour가 currentHour이고 telegram_chat_id가 있는 사용자 조회
  const { data: users } = await supabase
    .from('profiles')
    .select('id, telegram_chat_id')
    .eq('briefing_hour', currentHour)
    .not('telegram_chat_id', 'is', null)

  if (!users?.length) return

  for (const user of users) {
    try {
      const result = await generateBriefing(env, user.id)
      await sendMessage(
        env.TELEGRAM_BOT_TOKEN,
        user.telegram_chat_id,
        result.briefing
      )
    } catch {
      // 개별 사용자 실패 시 다음 사용자 계속 처리
    }
  }
}
