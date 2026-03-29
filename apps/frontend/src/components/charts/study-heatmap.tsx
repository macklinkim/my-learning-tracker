'use client'

import { useMemo } from 'react'
import { eachDayOfInterval, subDays, format, getDay } from 'date-fns'
import { groupLogsByDate } from '@/lib/format'
import type { ProgressLog } from '@learning-tracker/shared-types'

function getIntensityClass(minutes: number): string {
  if (minutes === 0) return 'bg-muted'
  if (minutes < 30) return 'bg-green-200 dark:bg-green-900'
  if (minutes < 60) return 'bg-green-400 dark:bg-green-700'
  if (minutes < 120) return 'bg-green-600 dark:bg-green-500'
  return 'bg-green-800 dark:bg-green-300'
}

export function StudyHeatmap({ logs }: { logs: ProgressLog[] }) {
  const dateMap = useMemo(() => groupLogsByDate(logs), [logs])

  const { today, start, days } = useMemo(() => {
    const today = new Date()
    const start = subDays(today, 364)
    const days = eachDayOfInterval({ start, end: today })
    return { today, start, days }
  }, [])

  // 첫 날의 요일만큼 빈 셀 앞에 추가 (일요일=0)
  const firstDayOfWeek = getDay(start)

  return (
    <div className="space-y-2">
      {/*
        grid-auto-flow: column → 열(주) 단위로 셀을 채움 (GitHub 잔디 방향)
        gridTemplateRows: 7행 = 월~일
        각 열은 1주(7일)를 담고, 53열 = 최대 53주
      */}
      <div
        className="grid gap-[3px]"
        style={{
          gridAutoFlow: 'column',
          gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
        }}
      >
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`pad-${i}`} className="size-3" />
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const minutes = dateMap[key] ?? 0
          return (
            <div
              key={key}
              title={`${key}: ${minutes}분`}
              className={`size-3 rounded-[2px] ${getIntensityClass(minutes)}`}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>적음</span>
        {['bg-muted', 'bg-green-200 dark:bg-green-900', 'bg-green-400 dark:bg-green-700', 'bg-green-600 dark:bg-green-500', 'bg-green-800 dark:bg-green-300'].map((cls, i) => (
          <div key={i} className={`size-3 rounded-[2px] ${cls}`} />
        ))}
        <span>많음</span>
      </div>
    </div>
  )
}
