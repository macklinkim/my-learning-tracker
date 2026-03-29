'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/get-auth-headers'
import { apiClient } from '@/lib/api/client'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const res = await (apiClient as any).api.profile.$get({}, { headers })
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      telegram_chat_id?: string | null
      briefing_hour?: number
      username?: string | null
    }) => {
      const headers = await getAuthHeaders()
      const res = await (apiClient as any).api.profile.$put({ json: body }, { headers })
      if (!res.ok) throw new Error('Failed to update profile')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}
