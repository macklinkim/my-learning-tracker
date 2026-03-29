'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/use-ui-store'
import { useLearningItems } from '@/lib/api/hooks/use-learning-items'
import { useCreateProgressLog } from '@/lib/api/hooks/use-progress-logs'
import { ProgressLogFormSchema, type ProgressLogFormValues } from '@/lib/schemas'

export function ProgressLogModal() {
  const { closeModal } = useUIStore()
  const { data: items = [] } = useLearningItems()
  const { mutate: createLog, isPending } = useCreateProgressLog()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProgressLogFormValues>({
    resolver: zodResolver(ProgressLogFormSchema),
    defaultValues: {
      learning_item_id: '',
      duration_minutes: undefined,
      notes: null,
    },
  })

  const onSubmit = (values: ProgressLogFormValues) => {
    createLog(
      {
        ...values,
        study_date: new Date().toISOString().split('T')[0],
        notes: values.notes || null,
      },
      { onSuccess: closeModal }
    )
  }

  const itemOptions = (items as { id: string; title: string }[]).map((i) => ({
    value: i.id,
    label: i.title,
  }))

  return (
    <Dialog open onClose={closeModal} title="학습 기록 추가">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="learning_item_id">학습 항목 *</Label>
          <Select
            id="learning_item_id"
            options={itemOptions}
            placeholder="항목을 선택하세요"
            {...register('learning_item_id')}
          />
          {errors.learning_item_id && (
            <p className="text-xs text-red-500">{errors.learning_item_id.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="duration_minutes">학습 시간 (분) *</Label>
          <Input
            id="duration_minutes"
            type="number"
            min={1}
            {...register('duration_minutes', { valueAsNumber: true })}
            placeholder="30"
          />
          {errors.duration_minutes && (
            <p className="text-xs text-red-500">{errors.duration_minutes.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">메모</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="학습 내용을 간단히 기록하세요"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={closeModal}>
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? '저장 중...' : '추가'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
