'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProfile, useUpdateProfile } from '@/lib/api/hooks/use-profile'

// KST 시간 옵션 (KST = UTC + 9)
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String((i + 15) % 24), // KST → UTC 변환: UTC = (KST - 9 + 24) % 24
  label: `${String(i).padStart(2, '0')}:00 KST`,
}))

export function TelegramSettings() {
  const { data: profile, isLoading } = useProfile()
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const [chatId, setChatId] = useState('')
  const [briefingHour, setBriefingHour] = useState('0')

  useEffect(() => {
    if (profile) {
      setChatId(profile.telegram_chat_id ?? '')
      setBriefingHour(String(profile.briefing_hour ?? 0))
    }
  }, [profile])

  const handleSave = () => {
    updateProfile({
      telegram_chat_id: chatId || null,
      briefing_hour: Number(briefingHour),
    })
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">불러오는 중...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram 연동</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="chat-id">Telegram Chat ID</Label>
          <Input
            id="chat-id"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="봇에서 /start 입력 후 받은 Chat ID"
          />
          <p className="text-xs text-muted-foreground">
            Telegram에서 @YourBot에게 /start를 보내면 Chat ID를 확인할 수 있습니다.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="briefing-hour">일일 브리핑 시간</Label>
          <Select
            id="briefing-hour"
            value={briefingHour}
            onChange={(e) => setBriefingHour(e.target.value)}
            options={HOUR_OPTIONS}
          />
          <p className="text-xs text-muted-foreground">
            매일 선택한 시간에 AI 학습 브리핑이 Telegram으로 발송됩니다.
          </p>
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? '저장 중...' : '저장'}
        </Button>
      </CardContent>
    </Card>
  )
}
