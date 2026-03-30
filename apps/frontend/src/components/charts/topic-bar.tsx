'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { Topic, LearningItem, ProgressLog } from '@learning-tracker/shared-types'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316']

interface Props {
  topics: Topic[]
  learningItems: LearningItem[]
  progressLogs: ProgressLog[]
}

export function TopicBarChart({ topics, learningItems, progressLogs }: Props) {
  const data = useMemo(() => {
    // learning_item_id → topic_id 매핑
    const itemTopicMap = new Map(
      learningItems.map((i) => [i.id, i.topic_id]),
    )

    // topic_id → 총 학습 시간
    const topicMinutes = new Map<string, number>()
    for (const log of progressLogs) {
      const topicId = itemTopicMap.get(log.learning_item_id)
      if (topicId) {
        topicMinutes.set(topicId, (topicMinutes.get(topicId) ?? 0) + log.duration_minutes)
      }
    }

    return topics
      .map((t) => ({
        name: t.name,
        minutes: topicMinutes.get(t.id) ?? 0,
        color: t.color ?? COLORS[0],
      }))
      .filter((d) => d.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)
  }, [topics, learningItems, progressLogs])

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        학습 기록 없음
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} unit="분" />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
        <Tooltip formatter={(value) => [`${value}분`, '학습 시간']} />
        <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={d.color || COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
