import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ContentTypeSchema = z.enum(['url', 'article', 'video', 'book', 'note', 'problem'])
export const ItemStatusSchema = z.enum(['inbox', 'todo', 'in_progress', 'completed'])

export type ContentType = z.infer<typeof ContentTypeSchema>
export type ItemStatus = z.infer<typeof ItemStatusSchema>

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
