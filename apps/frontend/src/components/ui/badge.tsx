import { cn } from '@/lib/utils'
import type { ItemStatus, ContentType } from '@learning-tracker/shared-types'

const statusStyles: Record<ItemStatus, string> = {
  inbox:       'bg-gray-100   text-gray-700   dark:bg-gray-800     dark:text-gray-300',
  todo:        'bg-blue-100   text-blue-700   dark:bg-blue-900/40  dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  completed:   'bg-green-100  text-green-700  dark:bg-green-900/40 dark:text-green-300',
}

const statusLabels: Record<ItemStatus, string> = {
  inbox: '수신함',
  todo: '할 일',
  in_progress: '진행 중',
  completed: '완료',
}

const contentTypeStyles: Record<ContentType, string> = {
  url:     'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  article: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  video:   'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300',
  book:    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  note:    'bg-teal-100   text-teal-700   dark:bg-teal-900/40   dark:text-teal-300',
  problem: 'bg-pink-100   text-pink-700   dark:bg-pink-900/40   dark:text-pink-300',
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

export function ContentTypeBadge({ type }: { type: ContentType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        contentTypeStyles[type]
      )}
    >
      {type}
    </span>
  )
}
