import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ProgressLog } from '@learning-tracker/shared-types'

export function formatDate(
  iso: string | null | undefined,
  fmt = 'yyyy-MM-dd HH:mm'
): string {
  if (!iso) return ''
  return format(new Date(iso), fmt)
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return ''
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ko })
}

export function groupLogsByDate(logs: ProgressLog[]): Record<string, number> {
  return logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.study_date] = (acc[log.study_date] ?? 0) + log.duration_minutes
    return acc
  }, {})
}
