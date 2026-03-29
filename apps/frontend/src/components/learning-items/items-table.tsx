'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { formatDate } from '@/lib/format'
import { StatusBadge, ContentTypeBadge } from '@/components/ui/badge'
import { InlineCell } from './inline-cell'
import { useLearningItems, useUpdateLearningItem } from '@/lib/api/hooks/use-learning-items'
import { useFilterStore } from '@/stores/use-filter-store'
import type { LearningItem } from '@learning-tracker/shared-types'

const col = createColumnHelper<LearningItem>()

export function ItemsTable() {
  const { data: rawItems = [], isLoading } = useLearningItems()
  const { mutate: updateItem } = useUpdateLearningItem()
  const { statusFilter, topicFilter, searchQuery } = useFilterStore()
  const [sorting, setSorting] = useState<SortingState>([])

  const items = useMemo(() => {
    let filtered = rawItems as LearningItem[]
    if (statusFilter.length > 0) {
      filtered = filtered.filter((i) => statusFilter.includes(i.status))
    }
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
  }, [rawItems, statusFilter, topicFilter, searchQuery])

  // columns을 useMemo로 메모이제이션 — 매 렌더마다 재생성 방지
  const columns = useMemo<ColumnDef<LearningItem, any>[]>(
    () => [
      col.accessor('title', {
        header: '제목',
        cell: (info) => (
          <InlineCell
            value={info.getValue()}
            onSave={(title) =>
              updateItem({ id: info.row.original.id, body: { title } })
            }
          />
        ),
      }),
      col.accessor('status', {
        header: '상태',
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      col.accessor('content_type', {
        header: '유형',
        cell: (info) => <ContentTypeBadge type={info.getValue()} />,
      }),
      col.accessor('due_date', {
        header: '마감일',
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue(), 'yyyy-MM-dd')}
          </span>
        ),
      }),
      col.accessor('created_at', {
        header: '생성일',
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue(), 'yyyy-MM-dd')}
          </span>
        ),
      }),
    ],
    [updateItem]
  )

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">불러오는 중...</div>
  }

  return (
    <div className="overflow-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-border bg-muted/50">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2.5 text-left font-medium text-muted-foreground"
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="py-10 text-center text-muted-foreground">
                학습 항목이 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
