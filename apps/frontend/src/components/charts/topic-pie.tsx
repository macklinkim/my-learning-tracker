'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type PieLabelRenderProps,
} from 'recharts'
import type { Topic, LearningItem } from '@learning-tracker/shared-types'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316']

interface Props {
  topics: Topic[]
  learningItems: LearningItem[]
}

export function TopicPieChart({ topics, learningItems }: Props) {
  const data = topics
    .map((topic) => ({
      name: topic.name,
      value: learningItems.filter((item) => item.topic_id === topic.id).length,
    }))
    .filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        토픽 데이터 없음
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          label={({ name, percent }: PieLabelRenderProps) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
