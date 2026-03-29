'use client'

import { useMutation } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/get-auth-headers'
import { apiClient } from '@/lib/api/client'

export function useBriefing() {
  return useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeaders()
      const res = await (apiClient as any).api.ai.briefing.$post({}, { headers })
      if (!res.ok) throw new Error('Failed to generate briefing')
      return res.json() as Promise<{ briefing: string }>
    },
  })
}
