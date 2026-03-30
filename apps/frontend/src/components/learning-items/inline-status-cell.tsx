'use client'

import { useState, useRef, useEffect } from 'react'
import { StatusBadge } from '@/components/ui/badge'
import { useCodeOptions } from '@/lib/api/hooks/use-codes'

interface Props {
  value: string
  onSave: (value: string) => void
}

export function InlineStatusCell({ value, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)
  const statusOptions = useCodeOptions('item_status')

  useEffect(() => {
    if (editing) selectRef.current?.focus()
  }, [editing])

  const handleChange = (newValue: string) => {
    setEditing(false)
    if (newValue !== value) onSave(newValue)
  }

  if (editing) {
    return (
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setEditing(false)}
        className="h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className="cursor-pointer"
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true) }}
    >
      <StatusBadge status={value} />
    </span>
  )
}
