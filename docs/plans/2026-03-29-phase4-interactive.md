# Phase 4: Interactive Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zustand 전역 상태 + 칸반 보드 고도화 + React Hook Form/Zod 모달 시스템을 구축하여 인터랙티브 UX를 완성한다.

**Architecture:** Zustand 스토어 2개(UI/Filter)로 전역 상태 관리, dnd-kit으로 칸반 카드 정렬 + 컬럼 이동, React Hook Form + Zod로 3개 입력 모달 구현. 기존 TanStack Query mutation 훅과 연동.

**Tech Stack:** Next.js 16, React 19, Zustand, React Hook Form, @hookform/resolvers, Zod, dnd-kit, @base-ui/react, Tailwind CSS v4

**Working Directory:** `/c/Users/mack/Desktop/projects/study/classmanage/my-learning-tracker/`

**Spec:** `docs/superpowers/specs/2026-03-29-phase4-interactive-design.md`

> **shadcn 패턴:** 이 프로젝트는 `@base-ui/react` 래핑 패턴. UI 컴포넌트는 HTML + Tailwind로 직접 작성, headless 라이브러리 불필요.

> **Hono RPC:** `apiClient.api['learning-items'].$get({}, { headers })` 형태. 브래킷 표기법 필수.

> **CSS 다크 모드:** `globals.css`에 `@custom-variant dark (&:is(.dark *))` 설정됨. `dark:` 유틸리티 사용 가능.

---

## Step 1: 패키지 설치

- [ ] `apps/frontend/`에서 `bun add zustand react-hook-form @hookform/resolvers` 실행
- [ ] import 확인 — `zustand`, `react-hook-form`, `@hookform/resolvers/zod` 정상 resolve 확인

**Verify:** `bun pm ls` 또는 `package.json`에서 세 패키지 확인

---

## Step 2: Zustand 스토어 생성

### 2a. `useUIStore` — 모달 상태 스토어

- [ ] `apps/frontend/src/stores/use-ui-store.ts` 생성

```typescript
import { create } from 'zustand'

type ModalType = 'learning-item' | 'topic' | 'progress-log'
type ModalMode = 'create' | 'edit'

interface UIState {
  modalType: ModalType | null
  modalMode: ModalMode
  modalData: Record<string, unknown> | null
  openModal: (type: ModalType, mode: ModalMode, data?: Record<string, unknown>) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  modalType: null,
  modalMode: 'create',
  modalData: null,
  openModal: (type, mode, data = null) => set({ modalType: type, modalMode: mode, modalData: data }),
  closeModal: () => set({ modalType: null, modalMode: 'create', modalData: null }),
}))
```

### 2b. `useFilterStore` — 필터 상태 스토어

- [ ] `apps/frontend/src/stores/use-filter-store.ts` 생성

```typescript
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
  resetFilters: () => set({ statusFilter: [], topicFilter: null, searchQuery: '' }),
}))
```

**Verify:** TypeScript 컴파일 — `bun run --filter frontend build` 또는 `tsc --noEmit`

---

## Step 3: UI 기본 컴포넌트 생성

### 3a. Dialog 컴포넌트

- [ ] `apps/frontend/src/components/ui/dialog.tsx` 생성
- 모달 Backdrop (반투명 검정, 클릭 시 닫기)
- 모달 Content (중앙 정렬, 최대 너비 md, 라운드/그림자)
- fade + scale 진입 애니메이션 (CSS transition 또는 tw-animate-css)
- ESC 키로 닫기 (`useEffect` + keydown)
- `useUIStore.closeModal` 연동
- Props: `open: boolean`, `onClose: () => void`, `title: string`, `children`

### 3b. Select 컴포넌트

- [ ] `apps/frontend/src/components/ui/select.tsx` 생성
- HTML `<select>` + Tailwind 스타일링 (기존 Input 패턴과 동일)
- Props: `options: { value: string; label: string }[]` + 표준 select props

### 3c. Textarea 컴포넌트

- [ ] `apps/frontend/src/components/ui/textarea.tsx` 생성
- HTML `<textarea>` + Tailwind 스타일링 (기존 Input 패턴과 동일)

### 3d. Label 컴포넌트

- [ ] `apps/frontend/src/components/ui/label.tsx` 생성
- HTML `<label>` + `text-sm font-medium` 스타일

**Verify:** 각 컴포넌트가 export되고 TypeScript 에러 없음

---

## Step 4: 모달 시스템 구축

### 4a. Zod 폼 스키마 정의

- [ ] `apps/frontend/src/lib/schemas.ts` 생성

```typescript
import { z } from 'zod'
import { ContentTypeSchema, ItemStatusSchema } from '@learning-tracker/shared-types'

// 학습 항목 폼 스키마
export const LearningItemFormSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요'),
  url: z.string().url('올바른 URL을 입력하세요').or(z.literal('')).optional(),
  content_type: ContentTypeSchema,
  topic_id: z.string().uuid().nullable().optional(),
  status: ItemStatusSchema,
  estimated_minutes: z.coerce.number().int().positive().nullable().optional(),
  due_date: z.string().nullable().optional(),
})

// 토픽 폼 스키마
export const TopicFormSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요'),
  color: z.string().default('#6366f1'),
  parent_id: z.string().uuid().nullable().optional(),
})

// 진행 기록 폼 스키마
export const ProgressLogFormSchema = z.object({
  learning_item_id: z.string().uuid('학습 항목을 선택하세요'),
  duration_minutes: z.coerce.number().int().positive('1분 이상 입력하세요'),
  notes: z.string().nullable().optional(),
})
```

### 4b. ModalManager

- [ ] `apps/frontend/src/components/modals/modal-manager.tsx` 생성
- `useUIStore`의 `modalType`을 읽어 조건부 렌더링
- `modalType === 'learning-item'` → `<LearningItemModal />`
- `modalType === 'topic'` → `<TopicModal />`
- `modalType === 'progress-log'` → `<ProgressLogModal />`

### 4c. 학습 항목 모달

- [ ] `apps/frontend/src/components/modals/learning-item-modal.tsx` 생성
- `useForm` + `zodResolver(LearningItemFormSchema)`
- `useUIStore`에서 `modalMode`, `modalData` 읽기 → edit 모드면 `reset(modalData)`
- 필드: title (Input), url (Input), content_type (Select), topic_id (Select — useTopics), status (Select), estimated_minutes (Input type=number), due_date (Input type=date)
- 제출: `modalMode === 'create'` → `useCreateLearningItem`, `'edit'` → `useUpdateLearningItem`
- 성공 시 `closeModal()`
- 에러 시 필드별 에러 메시지 표시 (react-hook-form `formState.errors`)

### 4d. 토픽 모달

- [ ] `apps/frontend/src/components/modals/topic-modal.tsx` 생성
- `useForm` + `zodResolver(TopicFormSchema)`
- 필드: name (Input), color (Input type=color), parent_id (Select — useTopics에서 목록)
- 제출: `useCreateTopic` / `useUpdateTopic`

### 4e. 진행 기록 모달

- [ ] `apps/frontend/src/components/modals/progress-log-modal.tsx` 생성
- `useForm` + `zodResolver(ProgressLogFormSchema)`
- 필드: learning_item_id (Select — useLearningItems), duration_minutes (Input type=number), notes (Textarea)
- 제출: `useCreateProgressLog`

**Verify:** 각 모달이 독립적으로 렌더 가능한지 확인 — Dialog 내부에서 폼이 표시되고 유효성 검증이 동작

---

## Step 5: 레이아웃에 ModalManager 통합

- [ ] `apps/frontend/src/app/(dashboard)/layout.tsx` 수정
- `<ModalManager />` 를 레이아웃 최하단에 추가 (한 번만 마운트)

**Verify:** 브라우저에서 아무 모달도 안 열린 상태에서 레이아웃이 정상 렌더

---

## Step 6: 필터 바 컴포넌트

- [ ] `apps/frontend/src/components/filters/filter-bar.tsx` 생성

UI 구성:
- 검색 입력 (Input — `searchQuery` 바인딩, debounce 300ms)
- 상태 필터 (다중 선택 토글 버튼 — inbox/todo/in_progress/completed)
- 토픽 필터 (Select — useTopics 목록 + "전체" 옵션)
- 초기화 버튼 (`resetFilters`)

`useFilterStore` 액션 직접 호출.

**Verify:** 필터 바 렌더 + 각 필터 상태 변경 시 스토어 값 업데이트 확인

---

## Step 7: 칸반 보드 고도화

### 7a. 칸반 카드 리디자인

- [ ] `apps/frontend/src/components/kanban/kanban-card.tsx` 수정

변경점:
- `topic` 정보 표시를 위해 props에 `topics` 배열 전달 또는 `useTopics` 직접 호출
- 카드 좌측에 세로 컬러 바 (`border-l-4` + `style={{ borderColor: topic.color }}`)
- `estimated_minutes` 표시 (⏱ 아이콘 + 분)
- 카드 클릭 이벤트 → `useUIStore.openModal('learning-item', 'edit', item)` (드래그와 클릭 구분 — `isDragging` 체크)

### 7b. 같은 컬럼 내 순서 변경

- [ ] `apps/frontend/src/components/kanban/kanban-board.tsx` 수정

변경점:
- `handleDragEnd`에서 같은 컬럼 드롭 감지:
  - `active`와 `over`가 같은 status의 아이템이면 → `arrayMove`로 순서 변경
  - 낙관적 업데이트: QueryClient 캐시 직접 수정 → mutation 실패 시 롤백
  - `order_index` 재계산: 이동된 아이템의 새 인덱스 기반으로 서버에 PUT
- `SortableContext`에 `items`를 `order_index` 기준 정렬해서 전달

### 7c. 필터 연동

- [ ] `kanban-board.tsx`에 `useFilterStore` 연동
- `rawItems`를 `filterItems(items, { statusFilter, topicFilter, searchQuery })` 유틸로 필터
  - `statusFilter`가 비어있지 않으면 → 단, 칸반에서는 컬럼이 status이므로 칸반에서는 `topicFilter`와 `searchQuery`만 적용
- 칸반 페이지 상단에 `<FilterBar />` 배치

### 7d. 드래그 오버레이 애니메이션

- [ ] `DragOverlay` 스타일 개선
- 드래그 중 카드: `rotate-2 scale-105 shadow-xl` 클래스
- 원본 카드: `opacity-30` (기존 0.4 → 0.3)

**Verify:**
1. 카드에 토픽 컬러, 예상 시간 표시 확인
2. 같은 컬럼 내 드래그로 순서 변경 가능 확인
3. 필터 바에서 토픽/검색어 변경 시 칸반 카드 필터링 확인
4. 카드 클릭 시 수정 모달 오픈 확인

---

## Step 8: 테이블 뷰 필터 + 추가 버튼 연동

- [ ] `apps/frontend/src/app/(dashboard)/items/page.tsx` 수정
- 상단에 `<FilterBar />` 추가
- "새 항목 추가" 버튼 → `useUIStore.openModal('learning-item', 'create')`
- `items-table.tsx`에서 `useFilterStore` 읽어 클라이언트 필터링 적용

- [ ] `apps/frontend/src/app/(dashboard)/kanban/page.tsx` 수정
- 상단에 `<FilterBar />` 추가
- "새 항목 추가" 버튼 추가

**Verify:** 테이블/칸반 양쪽에서 필터가 동기화되어 작동

---

## Step 9: 대시보드에 액션 버튼 추가

- [ ] `apps/frontend/src/app/(dashboard)/page.tsx` 수정
- "학습 기록 추가" 버튼 → `openModal('progress-log', 'create')`
- "새 토픽 추가" 버튼 → `openModal('topic', 'create')`

**Verify:** 대시보드에서 각 모달이 열리고 데이터 생성 가능

---

## Step 10: 통합 테스트 및 정리

- [ ] `bun run --filter frontend build` 빌드 성공 확인
- [ ] 전체 플로우 수동 검증:
  1. 칸반에서 카드 드래그 → 컬럼 이동 + 순서 변경
  2. 카드 클릭 → 수정 모달 → 저장 → 캐시 무효화 → UI 업데이트
  3. 필터 바 → 토픽/검색어 필터링 → 칸반+테이블 동기화
  4. 각 모달에서 유효성 검증 에러 표시
  5. 다크 모드에서 모달/필터 바 스타일 정상
