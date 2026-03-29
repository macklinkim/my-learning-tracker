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
import {
  useTopics,
  useCreateTopic,
  useUpdateTopic,
} from '@/lib/api/hooks/use-topics'
import { TopicFormSchema, type TopicFormValues } from '@/lib/schemas'

export function TopicModal() {
  const { modalMode, modalData, closeModal } = useUIStore()
  const { data: topics = [] } = useTopics()
  const { mutate: createTopic, isPending: isCreating } = useCreateTopic()
  const { mutate: updateTopic, isPending: isUpdating } = useUpdateTopic()

  const isEdit = modalMode === 'edit'
  const isPending = isCreating || isUpdating

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TopicFormValues>({
    resolver: zodResolver(TopicFormSchema),
    defaultValues: {
      name: '',
      color: '#6366f1',
      parent_id: null,
    },
  })

  useEffect(() => {
    if (isEdit && modalData) {
      reset({
        name: (modalData.name as string) ?? '',
        color: (modalData.color as string) ?? '#6366f1',
        parent_id: (modalData.parent_id as string) ?? null,
      })
    }
  }, [isEdit, modalData, reset])

  const onSubmit = (values: TopicFormValues) => {
    const body = {
      ...values,
      parent_id: values.parent_id || null,
      description: null,
      order_index: 0,
      icon: null,
    }

    if (isEdit && modalData?.id) {
      updateTopic(
        { id: modalData.id as string, body },
        { onSuccess: closeModal }
      )
    } else {
      createTopic(body, { onSuccess: closeModal })
    }
  }

  const parentOptions = [
    { value: '', label: '상위 토픽 없음' },
    ...(topics as { id: string; name: string }[])
      .filter((t) => !isEdit || t.id !== modalData?.id)
      .map((t) => ({ value: t.id, label: t.name })),
  ]

  return (
    <Dialog
      open
      onClose={closeModal}
      title={isEdit ? '토픽 수정' : '새 토픽'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">이름 *</Label>
          <Input id="name" {...register('name')} placeholder="토픽 이름" />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="color">색상</Label>
          <div className="flex items-center gap-2">
            <Input
              id="color"
              type="color"
              className="h-8 w-12 cursor-pointer p-0.5"
              {...register('color')}
            />
            <Input {...register('color')} placeholder="#6366f1" className="flex-1" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="parent_id">상위 토픽</Label>
          <Select
            id="parent_id"
            options={parentOptions}
            {...register('parent_id')}
          />
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
