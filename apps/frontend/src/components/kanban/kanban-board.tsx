'use client'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { KanbanCard, KanbanCardContent } from './kanban-card'
import { useLearningItems, useUpdateLearningItem } from '@/lib/api/hooks/use-learning-items'
import { useTopics } from '@/lib/api/hooks/use-topics'
import { useCodes } from '@/lib/api/hooks/use-codes'
import { useFilterStore } from '@/stores/use-filter-store'
import type { ItemStatus, LearningItem, Topic } from '@learning-tracker/shared-types'

function DroppableColumn({
  id,
  label,
  items,
  topicMap,
}: {
  id: ItemStatus
  label: string
  items: LearningItem[]
  topicMap: Map<string, Topic>
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[400px] w-64 shrink-0 flex-col rounded-xl p-3 transition-colors',
        isOver ? 'bg-muted/70 ring-1 ring-border' : 'bg-muted/40'
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {items.length}
        </span>
      </div>
      <SortableContext
        id={id}
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <KanbanCard
            key={item.id}
            item={item}
            topic={item.topic_id ? topicMap.get(item.topic_id) : null}
          />
        ))}
      </SortableContext>
    </div>
  )
}

function filterItems(
  items: LearningItem[],
  topicFilter: string | null,
  searchQuery: string
): LearningItem[] {
  let filtered = items

  if (topicFilter) {
    filtered = filtered.filter((i) => i.topic_id === topicFilter)
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q))
    )
  }

  return filtered
}

export function KanbanBoard() {
  const { data: rawItems = [], isLoading } = useLearningItems()
  const { data: rawTopics = [] } = useTopics()
  const { data: statusCodes = [] } = useCodes('item_status')

  const COLUMNS = useMemo(
    () => statusCodes.map((c) => ({ id: c.code as ItemStatus, label: c.label })),
    [statusCodes],
  )
  const { mutate: updateItem } = useUpdateLearningItem()
  const queryClient = useQueryClient()
  const { topicFilter, searchQuery } = useFilterStore()
  const [activeItem, setActiveItem] = useState<LearningItem | null>(null)

  const allItems = rawItems as LearningItem[]
  const topics = rawTopics as Topic[]

  const topicMap = useMemo(
    () => new Map(topics.map((t) => [t.id, t])),
    [topics]
  )

  const items = useMemo(
    () => filterItems(allItems, topicFilter, searchQuery),
    [allItems, topicFilter, searchQuery]
  )

  const sortedByColumn = useMemo(() => {
    const map = new Map<ItemStatus, LearningItem[]>()
    for (const col of COLUMNS) {
      map.set(
        col.id,
        items
          .filter((i) => i.status === col.id)
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      )
    }
    return map
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(allItems.find((i) => i.id === event.active.id) ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)
    if (!over || active.id === over.id) return

    const draggedItem = allItems.find((i) => i.id === active.id)
    if (!draggedItem) return

    const targetStatus: ItemStatus | undefined =
      COLUMNS.find((c) => c.id === over.id)?.id ??
      allItems.find((i) => i.id === over.id)?.status

    if (!targetStatus) return

    // Same column — reorder
    if (draggedItem.status === targetStatus) {
      const columnItems = sortedByColumn.get(targetStatus) ?? []
      const oldIndex = columnItems.findIndex((i) => i.id === active.id)
      const newIndex = columnItems.findIndex((i) => i.id === over.id)

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const reordered = arrayMove(columnItems, oldIndex, newIndex)

      // Optimistic update
      queryClient.setQueryData(['learning-items'], (old: LearningItem[] | undefined) => {
        if (!old) return old
        const updated = [...old]
        for (let i = 0; i < reordered.length; i++) {
          const idx = updated.findIndex((item) => item.id === reordered[i].id)
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], order_index: i }
          }
        }
        return updated
      })

      // Server update for the moved item
      updateItem({
        id: draggedItem.id,
        body: { order_index: newIndex },
      })
    } else {
      // Different column — change status
      updateItem({ id: draggedItem.id, body: { status: targetStatus } })
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">불러오는 중...</div>
  }

  const activeItemTopic = activeItem?.topic_id
    ? topicMap.get(activeItem.topic_id)
    : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            id={col.id}
            label={col.label}
            items={sortedByColumn.get(col.id) ?? []}
            topicMap={topicMap}
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="rotate-2 scale-105">
            <KanbanCardContent item={activeItem} topic={activeItemTopic} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
