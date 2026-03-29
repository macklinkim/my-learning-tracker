'use client'

import { Plus } from 'lucide-react'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { FilterBar } from '@/components/filters/filter-bar'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/use-ui-store'

export default function KanbanPage() {
  const openModal = useUIStore((s) => s.openModal)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">칸반 보드</h2>
        <Button onClick={() => openModal('learning-item', 'create')}>
          <Plus className="size-4" data-icon="inline-start" />
          새 항목
        </Button>
      </div>
      <FilterBar />
      <KanbanBoard />
    </div>
  )
}
