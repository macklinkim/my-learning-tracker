import { generateText } from 'ai'
import { createClient } from '@supabase/supabase-js'
import { format, subDays } from 'date-fns'
import { getModel } from './ai-provider'
import type { Bindings } from '../index'

const SYSTEM_PROMPT = `당신은 학습 코치입니다. 사용자의 최근 7일 학습 데이터를 분석하고, 한국어로 간결하게 피드백을 제공합니다.

응답 형식 (이모지 포함, 마크다운 사용하지 말 것):
📊 요약: (1-2줄)
💪 잘한 점: (1-2개)
📈 개선점: (1-2개)
🎯 다음 추천: (구체적 학습 항목 1-2개)`

export async function generateBriefing(
  env: Bindings,
  userId: string
): Promise<{ briefing: string }> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')

  // 병렬 데이터 조회
  const [logsResult, itemsResult, topicsResult] = await Promise.all([
    supabase
      .from('progress_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('study_date', sevenDaysAgo)
      .order('study_date', { ascending: false }),
    supabase
      .from('learning_items')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId),
  ])

  const logs = logsResult.data ?? []
  const items = itemsResult.data ?? []
  const topics = topicsResult.data ?? []

  // 데이터 없으면 기본 메시지
  if (logs.length === 0) {
    return {
      briefing:
        '📊 최근 7일간 학습 기록이 없습니다.\n\n' +
        '🎯 오늘부터 작은 학습이라도 시작해보세요!\n' +
        '대시보드에서 학습 항목을 추가하고 진행 기록을 남겨보세요.',
    }
  }

  // 통계 계산
  const totalMinutes = logs.reduce((sum: number, l: any) => sum + (l.duration_minutes ?? 0), 0)

  const dailyMap: Record<string, number> = {}
  for (const log of logs) {
    dailyMap[log.study_date] = (dailyMap[log.study_date] ?? 0) + (log.duration_minutes ?? 0)
  }
  const studyDays = Object.keys(dailyMap).length

  // 토픽별 비중
  const topicMinutes: Record<string, number> = {}
  for (const log of logs) {
    const item = items.find((i: any) => i.id === log.learning_item_id)
    const topic = item?.topic_id
      ? topics.find((t: any) => t.id === item.topic_id)
      : null
    const topicName = topic?.name ?? '미분류'
    topicMinutes[topicName] = (topicMinutes[topicName] ?? 0) + (log.duration_minutes ?? 0)
  }

  const completedCount = items.filter((i: any) => i.status === 'completed').length
  const totalItems = items.length
  const inProgressItems = items.filter((i: any) => i.status === 'in_progress')

  const stats = {
    period: `${sevenDaysAgo} ~ ${format(new Date(), 'yyyy-MM-dd')}`,
    totalMinutes,
    totalHours: Math.floor(totalMinutes / 60),
    studyDays,
    dailyAverage: Math.round(totalMinutes / 7),
    topicBreakdown: topicMinutes,
    completedCount,
    totalItems,
    inProgressItems: inProgressItems.map((i: any) => ({
      title: i.title,
      content_type: i.content_type,
    })),
  }

  const model = getModel(env)
  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `사용자의 최근 7일 학습 데이터입니다:\n\n${JSON.stringify(stats, null, 2)}\n\n이 데이터를 바탕으로 분석해주세요.`,
  })

  return { briefing: result.text }
}
