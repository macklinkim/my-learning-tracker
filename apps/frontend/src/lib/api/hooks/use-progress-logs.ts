'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/get-auth-headers'
import { apiClient } from '@/lib/api/client'
import type { ProgressLogInsert } from '@learning-tracker/shared-types'

const logs = ((apiClient as any).api as any)['progress-logs']

export function useProgressLogs() {
  return useQuery({
    queryKey: ['progress-logs'],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const res = await logs.$get({}, { headers })
      if (!res.ok) throw new Error('Failed to fetch progress logs')
      return res.json()
    },
  })
}

export function useCreateProgressLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Omit<ProgressLogInsert, 'user_id'>) => {
      const headers = await getAuthHeaders()
      const res = await logs.$post({ json: body }, { headers })
      if (!res.ok) throw new Error('Failed to create progress log')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-logs'] }),
  })
}

export function useDeleteProgressLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders()
      const res = await logs[':id'].$delete({ param: { id } }, { headers })
      if (!res.ok) throw new Error('Failed to delete progress log')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-logs'] }),
  })
}
