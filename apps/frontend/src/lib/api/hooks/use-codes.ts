'use client'

import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/get-auth-headers'
import { apiClient } from '@/lib/api/client'
import type { Code } from '@learning-tracker/shared-types'

export function useCodes(group?: string) {
  return useQuery({
    queryKey: ['codes', group ?? 'all'],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const query = group ? `?group=${group}` : ''
      const res = await fetch(
        `${(apiClient as any).baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787'}/api/codes${query}`,
        { headers },
      )
      if (!res.ok) throw new Error('Failed to fetch codes')
      return res.json() as Promise<Code[]>
    },
    staleTime: 5 * 60 * 1000, // 코드 테이블은 자주 안 바뀌므로 5분 캐시
  })
}

/** group별 codes를 { code → label } Map으로 반환하는 유틸 */
export function useCodeMap(group: string) {
  const { data: codes = [] } = useCodes(group)
  const map = new Map(codes.map((c) => [c.code, c.label]))
  return map
}

/** group별 codes를 Select option 형태로 반환 */
export function useCodeOptions(group: string) {
  const { data: codes = [] } = useCodes(group)
  return codes.map((c) => ({ value: c.code, label: c.label }))
}
