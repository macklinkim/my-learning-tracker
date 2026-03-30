'use client'

import { Plus, BookOpen } from 'lucide-react'
import { ItemsTable } from '@/components/learning-items/items-table'
import { FilterBar } from '@/components/filters/filter-bar'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/use-ui-store'

export default function ItemsPage() {
  const openModal = useUIStore((s) => s.openModal)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">학습 목록</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openModal('progress-log', 'create')}>
            <BookOpen className="size-4" data-icon="inline-start" />
            학습 기록
          </Button>
          <Button onClick={() => openModal('learning-item', 'create')}>
            <Plus className="size-4" data-icon="inline-start" />
            새 항목
          </Button>
        </div>
      </div>
      <FilterBar />
      <ItemsTable />
    </div>
  )
}
