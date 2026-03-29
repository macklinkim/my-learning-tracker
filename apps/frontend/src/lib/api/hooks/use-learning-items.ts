'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/get-auth-headers'
import { apiClient } from '@/lib/api/client'
import type { LearningItemInsert, LearningItemUpdate } from '@learning-tracker/shared-types'

const items = ((apiClient as any).api as any)['learning-items']

export function useLearningItems() {
  return useQuery({
    queryKey: ['learning-items'],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const res = await items.$get({}, { headers })
      if (!res.ok) throw new Error('Failed to fetch learning items')
      return res.json()
    },
  })
}

export function useCreateLearningItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Omit<LearningItemInsert, 'user_id'>) => {
      const headers = await getAuthHeaders()
      const res = await items.$post({ json: body }, { headers })
      if (!res.ok) throw new Error('Failed to create learning item')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning-items'] }),
  })
}

export function useUpdateLearningItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: LearningItemUpdate }) => {
      const headers = await getAuthHeaders()
      const res = await items[':id'].$put({ param: { id }, json: body }, { headers })
      if (!res.ok) throw new Error('Failed to update learning item')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning-items'] }),
  })
}

export function useDeleteLearningItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders()
      const res = await items[':id'].$delete({ param: { id } }, { headers })
      if (!res.ok) throw new Error('Failed to delete learning item')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning-items'] }),
  })
}
