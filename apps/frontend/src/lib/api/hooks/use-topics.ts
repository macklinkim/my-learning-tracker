'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/get-auth-headers'
import { apiClient } from '@/lib/api/client'
import type { TopicInsert } from '@learning-tracker/shared-types'

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const res = await ((apiClient as any).api.topics.$get as any)({}, { headers })
      if (!res.ok) throw new Error('Failed to fetch topics')
      return res.json()
    },
  })
}

export function useCreateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Omit<TopicInsert, 'user_id'>) => {
      const headers = await getAuthHeaders()
      const res = await ((apiClient as any).api.topics.$post as any)({ json: body }, { headers })
      if (!res.ok) throw new Error('Failed to create topic')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics'] }),
  })
}

export function useUpdateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<Omit<TopicInsert, 'user_id'>> }) => {
      const headers = await getAuthHeaders()
      const res = await ((apiClient as any).api.topics[':id'].$put as any)({ param: { id }, json: body }, { headers })
      if (!res.ok) throw new Error('Failed to update topic')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics'] }),
  })
}

export function useDeleteTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders()
      const res = await ((apiClient as any).api.topics[':id'].$delete as any)({ param: { id } }, { headers })
      if (!res.ok) throw new Error('Failed to delete topic')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topics'] }),
  })
}
