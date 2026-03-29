'use client'

import { TelegramSettings } from '@/components/settings/telegram-settings'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">설정</h2>
      <TelegramSettings />
    </div>
  )
}
