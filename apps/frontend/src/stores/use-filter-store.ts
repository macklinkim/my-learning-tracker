import { create } from 'zustand'
import type { ItemStatus } from '@learning-tracker/shared-types'

interface FilterState {
  statusFilter: ItemStatus[]
  topicFilter: string | null
  searchQuery: string
  setStatusFilter: (statuses: ItemStatus[]) => void
  setTopicFilter: (topicId: string | null) => void
  setSearchQuery: (query: string) => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  statusFilter: [],
  topicFilter: null,
  searchQuery: '',
  setStatusFilter: (statuses) => set({ statusFilter: statuses }),
  setTopicFilter: (topicId) => set({ topicFilter: topicId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  resetFilters: () =>
    set({ statusFilter: [], topicFilter: null, searchQuery: '' }),
}))
