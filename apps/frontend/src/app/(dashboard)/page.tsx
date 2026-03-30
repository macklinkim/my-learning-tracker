'use client'

import { useMemo } from 'react'
import { BookOpen, FolderPlus, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StudyHeatmap } from '@/components/charts/study-heatmap'
import { TopicPieChart } from '@/components/charts/topic-pie'
import { TopicBarChart } from '@/components/charts/topic-bar'
import { TopicTreemap } from '@/components/charts/topic-treemap'
import { useTopics } from '@/lib/api/hooks/use-topics'
import { useLearningItems } from '@/lib/api/hooks/use-learning-items'
import { useProgressLogs } from '@/lib/api/hooks/use-progress-logs'
import { useBriefing } from '@/lib/api/hooks/use-briefing'
import { useUIStore } from '@/stores/use-ui-store'
import type { LearningItem, ProgressLog } from '@learning-tracker/shared-types'

export default function DashboardPage() {
  const { data: topics = [] } = useTopics()
  const { data: rawLearningItems = [] } = useLearningItems()
  const { data: rawProgressLogs = [] } = useProgressLogs()
  const openModal = useUIStore((s) => s.openModal)
  const { mutate: requestBriefing, data: briefingResult, isPending: isBriefingLoading } = useBriefing()
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">대시보드</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openModal('progress-log', 'create')}>
            <BookOpen className="size-4" data-icon="inline-start" />
            학습 기록
          </Button>
          <Button variant="outline" size="sm" onClick={() => openModal('topic', 'create')}>
            <FolderPlus className="size-4" data-icon="inline-start" />
            새 토픽
          </Button>
        </div>
      </div>

      {/* 요약 카드 3개 */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">전체 학습 항목</p>
          <p className="text-2xl font-bold">{learningItems.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">완료</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {completedCount}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">총 학습 시간</p>
          <p className="text-2xl font-bold">
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </p>
        </Card>
      </div>

      {/* AI 브리핑 */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">AI 학습 브리핑</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => requestBriefing()}
              disabled={isBriefingLoading}
            >
              <Sparkles className="size-4" data-icon="inline-start" />
              {isBriefingLoading ? '분석 중...' : '브리핑 받기'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {briefingResult?.briefing ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {briefingResult.briefing}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              버튼을 클릭하면 최근 7일 학습 데이터를 AI가 분석합니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 학습 히트맵 */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">학습 히트맵 (최근 1년)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto pb-3">
          <StudyHeatmap logs={progressLogs} />
        </CardContent>
      </Card>

      {/* 토픽별 차트 — 2열 그리드 */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">토픽별 학습 비중</CardTitle></CardHeader>
          <CardContent className="pb-3">
            <TopicPieChart topics={topics} learningItems={learningItems} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">토픽별 학습 시간 비교</CardTitle></CardHeader>
          <CardContent className="pb-3">
            <TopicBarChart topics={topics} progressLogs={progressLogs} learningItems={learningItems} />
          </CardContent>
        </Card>
      </div>

      {/* Treemap */}
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">토픽별 학습량 Treemap</CardTitle></CardHeader>
        <CardContent className="pb-3">
          <TopicTreemap topics={topics} progressLogs={progressLogs} learningItems={learningItems} />
        </CardContent>
      </Card>
    </div>
  )
}
