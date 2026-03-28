import { describe, test, expect } from 'bun:test'
import {
  ContentTypeSchema,
  ItemStatusSchema,
  LearningItemInsertSchema,
  LearningItemUpdateSchema,
  ProgressLogInsertSchema,
} from './index'

describe('ContentTypeSchema', () => {
  test('accepts valid content types', () => {
    const validTypes = ['url', 'article', 'video', 'book', 'note', 'problem'] as const
    validTypes.forEach(type => {
      expect(ContentTypeSchema.parse(type)).toBe(type)
    })
  })
  test('rejects invalid content type', () => {
    expect(() => ContentTypeSchema.parse('invalid')).toThrow()
    expect(() => ContentTypeSchema.parse('')).toThrow()
  })
})

describe('ItemStatusSchema', () => {
  test('accepts valid statuses', () => {
    const validStatuses = ['inbox', 'todo', 'in_progress', 'completed'] as const
    validStatuses.forEach(status => {
      expect(ItemStatusSchema.parse(status)).toBe(status)
    })
  })
  test('rejects invalid status', () => {
    expect(() => ItemStatusSchema.parse('done')).toThrow()
    expect(() => ItemStatusSchema.parse('pending')).toThrow()
  })
})

describe('LearningItemInsertSchema', () => {
  test('accepts valid insert payload', () => {
    const payload = {
      user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Next.js 공식 문서',
      content_type: 'url',
      status: 'inbox',
      topic_id: null,
      prerequisite_id: null,
      description: null,
      url: null,
      estimated_minutes: 60,
      order_index: 0,
      due_date: null,
    }
    expect(() => LearningItemInsertSchema.parse(payload)).not.toThrow()
  })
  test('requires title', () => {
    expect(() =>
      LearningItemInsertSchema.parse({
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        content_type: 'url',
        status: 'inbox',
      })
    ).toThrow()
  })
})

describe('LearningItemUpdateSchema', () => {
  test('allows partial update', () => {
    expect(() => LearningItemUpdateSchema.parse({ status: 'in_progress' })).not.toThrow()
    expect(() => LearningItemUpdateSchema.parse({ title: '수정된 제목' })).not.toThrow()
    expect(() => LearningItemUpdateSchema.parse({})).not.toThrow()
  })
})

describe('ProgressLogInsertSchema', () => {
  test('accepts valid progress log', () => {
    const payload = {
      user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      learning_item_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      study_date: '2026-03-28',
      duration_minutes: 45,
      notes: null,
    }
    expect(() => ProgressLogInsertSchema.parse(payload)).not.toThrow()
  })
})
