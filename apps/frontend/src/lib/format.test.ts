import { describe, test, expect } from 'bun:test'
import { formatDate, formatRelative, groupLogsByDate } from './format'
import type { ProgressLog } from '@learning-tracker/shared-types'

describe('formatDate', () => {
  test('날짜 문자열(yyyy-MM-dd)을 지정 포맷으로 변환', () => {
    expect(formatDate('2026-03-28', 'yyyy-MM-dd')).toBe('2026-03-28')
  })

  test('null 입력 시 빈 문자열 반환', () => {
    expect(formatDate(null)).toBe('')
  })

  test('undefined 입력 시 빈 문자열 반환', () => {
    expect(formatDate(undefined)).toBe('')
  })
})

describe('formatRelative', () => {
  test('null 입력 시 빈 문자열 반환', () => {
    expect(formatRelative(null)).toBe('')
  })

  test('유효한 날짜 입력 시 비어있지 않은 문자열 반환', () => {
    const result = formatRelative(new Date().toISOString())
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('groupLogsByDate', () => {
  test('같은 날짜의 duration_minutes 합산', () => {
    const logs: ProgressLog[] = [
      { id: '1', user_id: 'u', learning_item_id: 'i', study_date: '2026-03-28', duration_minutes: 30, notes: null, created_at: '' },
      { id: '2', user_id: 'u', learning_item_id: 'i', study_date: '2026-03-28', duration_minutes: 20, notes: null, created_at: '' },
      { id: '3', user_id: 'u', learning_item_id: 'i', study_date: '2026-03-27', duration_minutes: 45, notes: null, created_at: '' },
    ]
    const result = groupLogsByDate(logs)
    expect(result['2026-03-28']).toBe(50)
    expect(result['2026-03-27']).toBe(45)
  })

  test('빈 배열 입력 시 빈 객체 반환', () => {
    expect(groupLogsByDate([])).toEqual({})
  })
})
