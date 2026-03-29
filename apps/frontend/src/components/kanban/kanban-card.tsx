'use client'

import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ContentTypeBadge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import { useUIStore } from '@/stores/use-ui-store'
import type { LearningItem, Topic } from '@learning-tracker/shared-types'

interface KanbanCardContentProps {
  item: LearningItem
  topic?: Topic | null
}

export function KanbanCardContent({ item, topic }: KanbanCardContentProps) {
  return (
    <Card
      className="mb-2 overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: topic?.color ?? '#94a3b8' }}
    >
      <CardContent className="p-3">
        <div className="min-w-0 space-y-1.5">
          <p className="truncate text-sm font-medium leading-tight">{item.title}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <ContentTypeBadge type={item.content_type} />
            {item.estimated_minutes != null && item.estimated_minutes > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {item.estimated_minutes}분
              </span>
            )}
            {item.due_date && (
              <span className="text-xs text-muted-foreground">
                {formatDate(item.due_date, 'MM/dd')}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface KanbanCardProps {
  item: LearningItem
  topic?: Topic | null
}

export function KanbanCard({ item, topic }: KanbanCardProps) {
  const hasDragged = useRef(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const openModal = useUIStore((s) => s.openModal)

  const handleClick = () => {
    if (hasDragged.current) {
      hasDragged.current = false
      return
    }
    openModal('learning-item', 'edit', item as unknown as Record<string, unknown>)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      className="cursor-grab active:cursor-grabbing"
      onClick={handleClick}
      onPointerMove={() => { hasDragged.current = true }}
      onPointerDown={() => { hasDragged.current = false }}
      {...attributes}
      {...listeners}
    >
      <KanbanCardContent item={item} topic={topic} />
    </div>
  )
}
