'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useFilterStore } from '@/stores/use-filter-store'
import { useTopics } from '@/lib/api/hooks/use-topics'
import type { ItemStatus } from '@learning-tracker/shared-types'

const STATUS_LABELS: Record<ItemStatus, string> = {
  inbox: '수신함',
  todo: '할 일',
  in_progress: '진행 중',
  completed: '완료',
}

export function FilterBar() {
  const {
    statusFilter,
    topicFilter,
    searchQuery,
    setStatusFilter,
    setTopicFilter,
    setSearchQuery,
    resetFilters,
  } = useFilterStore()
  const { data: topics = [] } = useTopics()

  const [localSearch, setLocalSearch] = useState(searchQuery)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(localSearch), 300)
    return () => clearTimeout(timer)
  }, [localSearch, setSearchQuery])

  const toggleStatus = (status: ItemStatus) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter((s) => s !== status))
    } else {
      setStatusFilter([...statusFilter, status])
    }
  }

  const topicOptions = [
    { value: '', label: '전체 토픽' },
    ...(topics as { id: string; name: string }[]).map((t) => ({
      value: t.id,
      label: t.name,
    })),
  ]

  const hasFilters =
    statusFilter.length > 0 || topicFilter !== null || searchQuery !== ''

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder="검색..."
        className="w-48"
      />

      <div className="flex gap-1">
        {(Object.entries(STATUS_LABELS) as [ItemStatus, string][]).map(
          ([status, label]) => (
            <Button
              key={status}
              variant={statusFilter.includes(status) ? 'default' : 'outline'}
              size="xs"
              onClick={() => toggleStatus(status)}
            >
              {label}
            </Button>
          )
        )}
      </div>

      <Select
        value={topicFilter ?? ''}
        onChange={(e) => setTopicFilter(e.target.value || null)}
        options={topicOptions}
        className="w-40"
      />

      {hasFilters && (
        <Button variant="ghost" size="xs" onClick={resetFilters}>
          초기화
        </Button>
      )}
    </div>
  )
}
