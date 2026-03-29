import { z } from 'zod'
import { ContentTypeSchema, ItemStatusSchema } from '@learning-tracker/shared-types'

export const LearningItemFormSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요'),
  url: z.string().url('올바른 URL을 입력하세요').or(z.literal('')).optional(),
  content_type: ContentTypeSchema,
  topic_id: z.string().nullable().optional(),
  status: ItemStatusSchema,
  estimated_minutes: z.number().int().positive().nullable().optional(),
  due_date: z.string().nullable().optional(),
})

export type LearningItemFormValues = z.infer<typeof LearningItemFormSchema>

export const TopicFormSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
  color: z.string().min(1),
  parent_id: z.string().uuid().nullable().optional(),
})

export type TopicFormValues = z.infer<typeof TopicFormSchema>

export const ProgressLogFormSchema = z.object({
  learning_item_id: z.string().uuid('학습 항목을 선택하세요'),
  duration_minutes: z.number().int().positive('1분 이상 입력하세요'),
  notes: z.string().nullable().optional(),
})

export type ProgressLogFormValues = z.infer<typeof ProgressLogFormSchema>
