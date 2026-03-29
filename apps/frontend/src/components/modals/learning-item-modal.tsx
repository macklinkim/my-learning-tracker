'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/use-ui-store'
import { useTopics } from '@/lib/api/hooks/use-topics'
import {
  useCreateLearningItem,
  useUpdateLearningItem,
} from '@/lib/api/hooks/use-learning-items'
import { LearningItemFormSchema, type LearningItemFormValues } from '@/lib/schemas'

const CONTENT_TYPE_OPTIONS = [
  { value: 'url', label: 'URL' },
  { value: 'article', label: '아티클' },
  { value: 'video', label: '비디오' },
  { value: 'book', label: '도서' },
  { value: 'note', label: '노트' },
  { value: 'problem', label: '문제' },
]

const STATUS_OPTIONS = [
  { value: 'inbox', label: '수신함' },
  { value: 'todo', label: '할 일' },
  { value: 'in_progress', label: '진행 중' },
  { value: 'completed', label: '완료' },
]

export function LearningItemModal() {
  const { modalMode, modalData, closeModal } = useUIStore()
  const { data: topics = [] } = useTopics()
  const { mutate: createItem, isPending: isCreating } = useCreateLearningItem()
  const { mutate: updateItem, isPending: isUpdating } = useUpdateLearningItem()

  const isEdit = modalMode === 'edit'
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LearningItemFormValues>({
    resolver: zodResolver(LearningItemFormSchema),
    defaultValues: {
      title: '',
      url: '',
      content_type: 'url',
      topic_id: null,
      status: 'inbox',
      estimated_minutes: null,
      due_date: null,
    },
  })

  useEffect(() => {
    if (isEdit && modalData) {
      reset({
        title: (modalData.title as string) ?? '',
        url: (modalData.url as string) ?? '',
        content_type: (modalData.content_type as LearningItemFormValues['content_type']) ?? 'url',
        topic_id: (modalData.topic_id as string) ?? null,
        status: (modalData.status as LearningItemFormValues['status']) ?? 'inbox',
        estimated_minutes: (modalData.estimated_minutes as number) ?? null,
        due_date: (modalData.due_date as string) ?? null,
      })
    }
  }, [isEdit, modalData, reset])

  const onSubmit = (values: LearningItemFormValues) => {
    const minutes = values.estimated_minutes
    const body = {
      ...values,
      url: values.url || null,
      topic_id: values.topic_id || null,
      prerequisite_id: null,
      description: null,
      order_index: 0,
      estimated_minutes: (minutes != null && !Number.isNaN(minutes)) ? minutes : null,
      due_date: values.due_date || null,
    }

    if (isEdit && modalData?.id) {
      updateItem(
        { id: modalData.id as string, body },
        { onSuccess: closeModal }
      )
    } else {
      createItem(body, { onSuccess: closeModal })
    }
  }

  const topicOptions = [
    { value: '', label: '토픽 없음' },
    ...(topics as { id: string; name: string }[]).map((t) => ({
      value: t.id,
      label: t.name,
    })),
  ]

  return (
    <Dialog
      open
      onClose={closeModal}
      title={isEdit ? '학습 항목 수정' : '새 학습 항목'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">제목 *</Label>
          <Input id="title" {...register('title')} placeholder="학습 항목 제목" />
          {errors.title && (
            <p className="text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="url">URL</Label>
          <Input id="url" {...register('url')} placeholder="https://..." />
          {errors.url && (
            <p className="text-xs text-red-500">{errors.url.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="content_type">콘텐츠 유형 *</Label>
            <Select
              id="content_type"
              options={CONTENT_TYPE_OPTIONS}
              {...register('content_type')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">상태 *</Label>
            <Select
              id="status"
              options={STATUS_OPTIONS}
              {...register('status')}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="topic_id">토픽</Label>
          <Select
            id="topic_id"
            options={topicOptions}
            {...register('topic_id')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="estimated_minutes">예상 시간 (분)</Label>
            <Input
              id="estimated_minutes"
              type="number"
              min={1}
              {...register('estimated_minutes', { valueAsNumber: true })}
              placeholder="30"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="due_date">마감일</Label>
            <Input id="due_date" type="date" {...register('due_date')} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={closeModal}>
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? '저장 중...' : isEdit ? '수정' : '추가'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
