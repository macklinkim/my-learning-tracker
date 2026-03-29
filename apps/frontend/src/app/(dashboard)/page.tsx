'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StudyHeatmap } from '@/components/charts/study-heatmap'
import { TopicPieChart } from '@/components/charts/topic-pie'
import { useTopics } from '@/lib/api/hooks/use-topics'
import { useLearningItems } from '@/lib/api/hooks/use-learning-items'
import { useProgressLogs } from '@/lib/api/hooks/use-progress-logs'
import type { LearningItem, ProgressLog } from '@learning-tracker/shared-types'

export default function DashboardPage() {
  const { data: topics = [] } = useTopics()
  const { data: rawLearningItems = [] } = useLearningItems()
  const { data: rawProgressLogs = [] } = useProgressLogs()
  const learningItems = rawLearningItems as LearningItem[]
  const progressLogs = rawProgressLogs as ProgressLog[]

  const completedCount = useMemo(
    () => learningItems.filter((i) => i.status === 'completed').length,
    [learningItems],
  )
  const totalMinutes = useMemo(
    () => progressLogs.reduce((sum, log) => sum + log.duration_minutes, 0),
    [progressLogs],
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">대시보드</h2>

      {/* 요약 카드 3개 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>전체 학습 항목</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{learningItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>완료</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {completedCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>총 학습 시간</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 학습 히트맵 */}
      <Card>
        <CardHeader><CardTitle>학습 히트맵 (최근 1년)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <StudyHeatmap logs={progressLogs} />
        </CardContent>
      </Card>

      {/* 토픽별 파이 차트 */}
      <Card>
        <CardHeader><CardTitle>토픽별 학습 비중</CardTitle></CardHeader>
        <CardContent>
          <TopicPieChart topics={topics} learningItems={learningItems} />
        </CardContent>
      </Card>
    </div>
  )
}
