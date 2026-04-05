# 개발 진행 과정 (Development Phases)

## Phase 2: API 계층 및 인증 (API & Auth)

**목표:** 사용자 인증 체계를 구축하고 클라이언트와 서버 간의 안전한 데이터 통신 API를 연동합니다.

### 상세 작업 내용
- Supabase Auth 연동 (Next.js 미들웨어 및 서버 컴포넌트에서 세션 처리).
- Hono 백엔드에 CRUD API 엔드포인트 작성 및 `@hono/zod-validator` 적용.
- Next.js 프론트엔드에 Hono RPC 클라이언트를 설정하여 타입 안전하게 백엔드와 연결.
- TanStack Query를 세팅하여 기초 데이터 Fetching 테스트.
