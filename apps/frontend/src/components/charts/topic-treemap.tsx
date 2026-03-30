'use client'

import { useMemo } from 'react'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import type { Topic, LearningItem, ProgressLog } from '@learning-tracker/shared-types'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#14b8a6']

interface Props {
  topics: Topic[]
  learningItems: LearningItem[]
  progressLogs: ProgressLog[]
}

interface TreemapContentProps {
  x: number
  y: number
  width: number
  height: number
  name: string
  color: string
  minutes: number
}

function CustomContent({ x, y, width, height, name, color, minutes }: TreemapContentProps) {
  if (width < 30 || height < 20) return null

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={color} opacity={0.85} stroke="#fff" strokeWidth={2} />
      {width > 50 && height > 35 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={600}>
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#fff" fontSize={10} opacity={0.9}>
            {minutes}분
          </text>
        </>
      )}
    </g>
  )
}

export function TopicTreemap({ topics, learningItems, progressLogs }: Props) {
  const data = useMemo(() => {
    const itemTopicMap = new Map(
      learningItems.map((i) => [i.id, i.topic_id]),
    )

    const topicMinutes = new Map<string, number>()
    for (const log of progressLogs) {
      const topicId = itemTopicMap.get(log.learning_item_id)
      if (topicId) {
        topicMinutes.set(topicId, (topicMinutes.get(topicId) ?? 0) + log.duration_minutes)
      }
    }

    return topics
      .map((t, i) => ({
        name: t.name,
        size: topicMinutes.get(t.id) ?? 0,
        minutes: topicMinutes.get(t.id) ?? 0,
        color: t.color || COLORS[i % COLORS.length],
      }))
      .filter((d) => d.size > 0)
  }, [topics, learningItems, progressLogs])

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        학습 기록 없음
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <Treemap
        data={data}
        dataKey="size"
        aspectRatio={4 / 3}
        content={<CustomContent x={0} y={0} width={0} height={0} name="" color="" minutes={0} />}
      >
        <Tooltip formatter={(value: number) => [`${value}분`, '학습 시간']} />
      </Treemap>
    </ResponsiveContainer>
  )
}
