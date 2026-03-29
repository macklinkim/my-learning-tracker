'use client'

import { useUIStore } from '@/stores/use-ui-store'
import { LearningItemModal } from './learning-item-modal'
import { TopicModal } from './topic-modal'
import { ProgressLogModal } from './progress-log-modal'

export function ModalManager() {
  const modalType = useUIStore((s) => s.modalType)

  return (
    <>
      {modalType === 'learning-item' && <LearningItemModal />}
      {modalType === 'topic' && <TopicModal />}
      {modalType === 'progress-log' && <ProgressLogModal />}
    </>
  )
}
