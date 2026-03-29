import { create } from 'zustand'

type ModalType = 'learning-item' | 'topic' | 'progress-log'
type ModalMode = 'create' | 'edit'

interface UIState {
  modalType: ModalType | null
  modalMode: ModalMode
  modalData: Record<string, unknown> | null
  openModal: (type: ModalType, mode: ModalMode, data?: Record<string, unknown> | null) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  modalType: null,
  modalMode: 'create',
  modalData: null,
  openModal: (type, mode, data = null) =>
    set({ modalType: type, modalMode: mode, modalData: data }),
  closeModal: () =>
    set({ modalType: null, modalMode: 'create', modalData: null }),
}))
