'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  onSave: (value: string) => void
}

export function InlineCell({ value, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commit = () => {
    setEditing(false)
    if (draft.trim() && draft !== value) onSave(draft.trim())
    else setDraft(value)
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        className="h-7 w-full"
      />
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className="block cursor-pointer rounded px-1 py-0.5 hover:bg-muted"
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true) }}
    >
      {value || <span className="text-muted-foreground italic">클릭하여 편집</span>}
    </span>
  )
}
