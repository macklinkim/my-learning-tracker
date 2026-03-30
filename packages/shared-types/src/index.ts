import { z } from 'zod'

// ─── Code (공통 코드 테이블) ──────────────────────────────────────────────────

export const CodeSchema = z.object({
  id: z.string().uuid(),
  group_code: z.string(),
  code: z.string(),
  label: z.string(),
  order_index: z.number().int().default(0),
  is_active: z.boolean().default(true),
  created_at: z.string(),
})

export type Code = z.infer<typeof CodeSchema>

// ─── Enums (DB codes 테이블에서 관리, 타입은 string으로 유연하게) ────────────

export const ContentTypeSchema = z.string()
export const ItemStatusSchema = z.string()

export type ContentType = string
export type ItemStatus = string

// ─── Profile ──────────────────────────────────────────────────────────────────

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string().nullable(),
  avatar_url: z.string().nullable(),
  telegram_chat_id: z.string().nullable(),
  streak_count: z.number().int().default(0),
  last_study_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const ProfileInsertSchema = ProfileSchema.omit({
  streak_count: true,
  created_at: true,
  updated_at: true,
}).partial({ last_study_date: true, telegram_chat_id: true })

export type Profile = z.infer<typeof ProfileSchema>
export type ProfileInsert = z.infer<typeof ProfileInsertSchema>

// ─── Topic ────────────────────────────────────────────────────────────────────

export const TopicSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
  name: z.string().min(1),
  description: z.string().nullable(),
  color: z.string().default('#6366f1'),
  icon: z.string().nullable(),
  order_index: z.number().int().default(0),
  created_at: z.string(),
  updated_at: z.string(),
})

export const TopicInsertSchema = TopicSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type Topic = z.infer<typeof TopicSchema>
export type TopicInsert = z.infer<typeof TopicInsertSchema>

// ─── LearningItem ─────────────────────────────────────────────────────────────

export const LearningItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  topic_id: z.string().uuid().nullable(),
  prerequisite_id: z.string().uuid().nullable(),
  title: z.string().min(1),
  description: z.string().nullable(),
  url: z.string().nullable(),
  content_type: ContentTypeSchema,
  status: ItemStatusSchema,
  estimated_minutes: z.number().int().nullable(),
  actual_minutes: z.number().int().default(0),
  order_index: z.number().int().default(0),
  due_date: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const LearningItemInsertSchema = LearningItemSchema.omit({
  id: true,
  actual_minutes: true,
  completed_at: true,
  created_at: true,
  updated_at: true,
})

export const LearningItemUpdateSchema = LearningItemInsertSchema.partial()

export type LearningItem = z.infer<typeof LearningItemSchema>
export type LearningItemInsert = z.infer<typeof LearningItemInsertSchema>
export type LearningItemUpdate = z.infer<typeof LearningItemUpdateSchema>

// ─── ProgressLog ──────────────────────────────────────────────────────────────

export const ProgressLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  learning_item_id: z.string().uuid(),
  study_date: z.string(),
  duration_minutes: z.number().int().default(0),
  notes: z.string().nullable(),
  created_at: z.string(),
})

export const ProgressLogInsertSchema = ProgressLogSchema.omit({
  id: true,
  created_at: true,
})

export type ProgressLog = z.infer<typeof ProgressLogSchema>
export type ProgressLogInsert = z.infer<typeof ProgressLogInsertSchema>
