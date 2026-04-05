# 개발 진행 과정 (Development Phases)

## Phase 1: 초기 설정 및 데이터베이스 (Foundation & DB)

**목표:** 프로젝트의 기본 뼈대를 구성하고 데이터베이스 스키마 및 프론트/백엔드 초기 구성을 완료합니다. Next.js 기반 Vercel 환경 세팅을 포함합니다.

### 상세 작업 내용
- Bun Workspaces를 이용한 모노레포 구조 스캐폴딩.
- Supabase 프로젝트 생성 및 SQL 스키마 작성 (`users`, `topics`, `learning_items`, `progress_logs`).
- 프론트엔드(`apps/frontend`) Next.js 초기화 및 Vercel 배포를 위한 설정 준비.
- UI 개발을 위한 Tailwind CSS 및 shadcn/ui 설정.
- 날짜/시간 처리를 위한 유틸리티로 `date-fns` 패키지 설치.
- 백엔드(`apps/backend`) Hono 초기화 및 Cloudflare Workers 배포 환경 구성(`wrangler.toml` 등 설정).
- `packages/shared-types`에 핵심 DB 모델에 대한 Zod 스키마 정의.

---

## DB 스키마 설계 (Supabase / PostgreSQL)

> Supabase Auth가 `auth.users`를 자동 관리하므로, 앱 데이터는 `public` 스키마에 별도 구성합니다.

### 테이블 구성도

```
auth.users (Supabase 관리)
    └── public.profiles         # 사용자 프로필 (1:1)
            └── public.topics   # 학습 카테고리 (트리 구조)
                    └── public.learning_items  # 학습 아이템
                            └── public.progress_logs  # 진도 기록
```

---

### 1. `profiles` (사용자 프로필)

```sql
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username          TEXT,
  avatar_url        TEXT,
  telegram_chat_id  TEXT,          -- Telegram 봇 알림 연동용
  streak_count      INT  DEFAULT 0, -- 연속 학습일 수
  last_study_date   DATE,           -- Streak 계산 기준
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Supabase Auth 신규 회원가입 시 자동 profiles 행 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 2. `topics` (학습 카테고리 / 로드맵 노드)

```sql
CREATE TABLE public.topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.topics(id) ON DELETE SET NULL, -- 로드맵 트리 계층
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#6366f1',  -- UI 컬러 (hex)
  icon        TEXT,                    -- lucide-react 아이콘 이름
  order_index INT  DEFAULT 0,          -- 같은 레벨 내 정렬 순서
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_user_id   ON public.topics(user_id);
CREATE INDEX idx_topics_parent_id ON public.topics(parent_id);
```

---

### 3. `learning_items` (학습 아이템)

```sql
-- 콘텐츠 타입 및 진행 상태 enum
CREATE TYPE content_type AS ENUM ('url', 'article', 'video', 'book', 'note', 'problem');
CREATE TYPE item_status   AS ENUM ('inbox', 'todo', 'in_progress', 'completed');

CREATE TABLE public.learning_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id           UUID REFERENCES public.topics(id) ON DELETE SET NULL, -- NULL = Inbox
  prerequisite_id    UUID REFERENCES public.learning_items(id) ON DELETE SET NULL, -- 선행 학습 (Learning Path)
  title              TEXT NOT NULL,
  description        TEXT,
  url                TEXT,
  content_type       content_type NOT NULL DEFAULT 'url',
  status             item_status  NOT NULL DEFAULT 'inbox',
  estimated_minutes  INT,           -- 예상 학습 시간(분)
  actual_minutes     INT DEFAULT 0, -- 실제 누적 학습 시간(분)
  order_index        INT DEFAULT 0, -- 칸반 보드 내 카드 순서
  due_date           DATE,          -- 목표 완료일
  completed_at       TIMESTAMPTZ,   -- 실제 완료 시각
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_items_user_id   ON public.learning_items(user_id);
CREATE INDEX idx_learning_items_topic_id  ON public.learning_items(topic_id);
CREATE INDEX idx_learning_items_status    ON public.learning_items(status);
```

---

### 4. `progress_logs` (학습 진도 기록)

> Activity Heatmap, Streak 계산, AI 주간 분석의 핵심 데이터 소스

```sql
CREATE TABLE public.progress_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learning_item_id UUID NOT NULL REFERENCES public.learning_items(id) ON DELETE CASCADE,
  study_date       DATE        NOT NULL DEFAULT CURRENT_DATE, -- 잔디 Heatmap 집계 기준
  duration_minutes INT         NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_progress_logs_user_id   ON public.progress_logs(user_id);
CREATE INDEX idx_progress_logs_study_date ON public.progress_logs(study_date);
```

---

### RLS (Row Level Security) 기본 정책

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs  ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 접근 허용 (각 테이블 공통 패턴)
CREATE POLICY "Users can manage their own data" ON public.profiles
  USING (id = auth.uid());

CREATE POLICY "Users can manage their own data" ON public.topics
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own data" ON public.learning_items
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own data" ON public.progress_logs
  USING (user_id = auth.uid());
```

---

### 테이블 관계 요약

| 테이블 | 역할 | 주요 관계 |
|--------|------|-----------|
| `profiles` | 사용자 프로필 + Streak | `auth.users` 1:1 |
| `topics` | 카테고리 / 로드맵 노드 | 자기참조(`parent_id`) 트리 |
| `learning_items` | 학습 자료 카드 | `topics` N:1, 자기참조(`prerequisite_id`) |
| `progress_logs` | 일별 학습 기록 | `learning_items` N:1 |
