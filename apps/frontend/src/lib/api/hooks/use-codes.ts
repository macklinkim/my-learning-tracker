'use client'

import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/get-auth-headers'
import { API_URL } from '@/lib/api/client'
import type { Code } from '@learning-tracker/shared-types'

export function useCodes(group?: string) {
  return useQuery({
    queryKey: ['codes', group ?? 'all'],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const query = group ? `?group=${group}` : ''
      const res = await fetch(`${API_URL}/api/codes${query}`, { headers })
      if (!res.ok) throw new Error('Failed to fetch codes')
      return res.json() as Promise<Code[]>
    },
    staleTime: 5 * 60 * 1000,
  })
}

/** group별 codes를 { code → label } Map으로 반환 */
export function useCodeMap(group: string) {
  const { data: codes = [] } = useCodes(group)
  return new Map(codes.map((c) => [c.code, c.label]))
}

/** group별 codes를 Select option 형태로 반환 */
export function useCodeOptions(group: string) {
  const { data: codes = [] } = useCodes(group)
  return codes.map((c) => ({ value: c.code, label: c.label }))
}
