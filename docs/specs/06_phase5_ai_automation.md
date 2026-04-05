# 개발 진행 과정 (Development Phases)

## Phase 5: AI 자동화 및 알림 (AI & Automation)

**목표:** Vercel AI SDK와 메신저 봇을 연동하여 지능적인 피드백 시스템 및 알림 기능을 구현합니다.

### 상세 작업 내용
- Hono 백엔드에 Telegraf.js를 연동하여 사용자의 Telegram 계정과 시스템 연결(Webhook 기반).
- Vercel AI SDK를 활용하여 사용자의 일주일간 `progress_logs` 데이터를 분석하고, 다음 학습 방향을 추천하는 프롬프트 엔지니어링 및 API 엔드포인트 구현.
- Cloudflare `Cron Triggers`를 설정하여 매일 정해진 시간에 Telegram으로 AI 학습 브리핑 메시지 발송 로직 구현 (이때 `date-fns`를 통해 정확한 시간 계산 및 메시지 내 날짜 포맷팅 적용).
