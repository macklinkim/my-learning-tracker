-- 공통 코드 테이블: content_type, item_status 등 key-value 코드를 관리
create table if not exists codes (
  id          uuid primary key default gen_random_uuid(),
  group_code  text not null,
  code        text not null,
  label       text not null,
  order_index integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),

  unique (group_code, code)
);

-- RLS: 인증된 사용자만 읽기 가능
alter table codes enable row level security;

create policy "Authenticated users can read codes"
  on codes for select
  to authenticated
  using (true);

-- 초기 데이터: content_type
insert into codes (group_code, code, label, order_index) values
  ('content_type', 'url',     'URL',    0),
  ('content_type', 'article', '아티클', 1),
  ('content_type', 'video',   '비디오', 2),
  ('content_type', 'book',    '도서',   3),
  ('content_type', 'note',    '노트',   4),
  ('content_type', 'problem', '문제',   5);

-- 초기 데이터: item_status
insert into codes (group_code, code, label, order_index) values
  ('item_status', 'inbox',       '수신함',  0),
  ('item_status', 'todo',        '할 일',   1),
  ('item_status', 'in_progress', '진행 중', 2),
  ('item_status', 'completed',   '완료',    3);
