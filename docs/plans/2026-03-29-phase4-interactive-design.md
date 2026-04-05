# Phase 4: Interactive Features — Design Spec

**Date:** 2026-03-29
**Goal:** Zustand 전역 UI 상태 관리, 칸반 보드 고도화, React Hook Form + Zod 모달 시스템 구축

---

## 1. Zustand 전역 상태 관리

### 1.1 `useUIStore` — 모달 상태

```typescript
type ModalType = 'learning-item' | 'topic' | 'progress-log'
type ModalMode = 'create' | 'edit'

interface UIState {
  modalType: ModalType | null
  modalMode: ModalMode
  modalData: Record<string, unknown> | null
  openModal: (type: ModalType, mode: ModalMode, data?: Record<string, unknown>) => void
  closeModal: () => void
}
```

- 모달 열림/닫힘, 생성/수정 모드, 편집 데이터를 하나의 스토어에서 관리
- `openModal('learning-item', 'edit', existingItem)` 형태로 호출

### 1.2 `useFilterStore` — 필터 상태

```typescript
interface FilterState {
  statusFilter: ItemStatus[]
  topicFilter: string | null
  searchQuery: string
  setStatusFilter: (statuses: ItemStatus[]) => void
  setTopicFilter: (topicId: string | null) => void
  setSearchQuery: (query: string) => void
  resetFilters: () => void
}
```

- 칸반 보드 + 학습 항목 테이블 양쪽에서 공유
- 클라이언트 사이드 필터링 (이미 fetch된 데이터에서 filter)

---

## 2. 칸반 보드 고도화

### 2.1 카드 리디자인 (`kanban-card.tsx` 수정)

기존: title + content_type 뱃지 + due_date만 표시

추가:
- **토픽 컬러 태그** — 좌측 세로 컬러 바 (topic.color 기반)
- **예상 시간** — `estimated_minutes`를 `⏱ 30분` 형태로 표시
- **카드 클릭** → `useUIStore.openModal('learning-item', 'edit', item)` 호출

### 2.2 같은 컬럼 내 순서 변경

- `@dnd-kit/sortable`의 `arrayMove` 활용 — 같은 컬럼 내 드래그 시 `order_index` 재계산
- `handleDragEnd`에서 같은 컬럼 드롭 감지 → 낙관적 업데이트 + API mutation

### 2.3 필터 연동

- `useFilterStore` 상태를 읽어 `items.filter()` 적용
- 컬럼 상단에 아이템 수가 필터 결과 반영

### 2.4 드래그 애니메이션

- `DragOverlay`에 `rotate-2 scale-105 shadow-xl` 스타일
- 드래그 중인 원본 카드 `opacity-30`

---

## 3. 모달 시스템

### 3.1 Dialog 컴포넌트 (`components/ui/dialog.tsx`)

- `@base-ui/react` 패턴에 맞춘 모달 래퍼
- Backdrop, 애니메이션(fade+scale), ESC/외부 클릭으로 닫기
- `useUIStore`의 `modalType`이 non-null이면 열림

### 3.2 ModalManager (`components/modals/modal-manager.tsx`)

```typescript
export function ModalManager() {
  const { modalType } = useUIStore()
  return (
    <>
      {modalType === 'learning-item' && <LearningItemModal />}
      {modalType === 'topic' && <TopicModal />}
      {modalType === 'progress-log' && <ProgressLogModal />}
    </>
  )
}
```

- 레이아웃에 한 번만 마운트, `modalType`에 따라 조건부 렌더링

### 3.3 학습 항목 모달 (`components/modals/learning-item-modal.tsx`)

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| title | text | ✓ | |
| url | url | | URL 유효성 검증 |
| content_type | select | ✓ | 6가지 enum |
| topic_id | select | | 토픽 목록에서 선택 |
| status | select | ✓ | 4가지 enum |
| estimated_minutes | number | | 양수 |
| due_date | date | | |

- Zod 스키마: shared-types의 `LearningItemInsertSchema`에서 `user_id`, `order_index`, `prerequisite_id` 제외 + url optional refinement
- 수정 모드: `modalData`에서 기본값 로드

### 3.4 토픽 모달 (`components/modals/topic-modal.tsx`)

| 필드 | 타입 | 필수 |
|------|------|------|
| name | text | ✓ |
| color | color picker | |
| parent_id | select | |

### 3.5 진행 기록 모달 (`components/modals/progress-log-modal.tsx`)

| 필드 | 타입 | 필수 |
|------|------|------|
| learning_item_id | select | ✓ |
| duration_minutes | number | ✓ |
| notes | textarea | |

---

## 4. 신규 패키지

- `zustand` — 전역 상태
- `react-hook-form` — 폼 관리
- `@hookform/resolvers` — Zod resolver

---

## 5. 파일 구조

```
apps/frontend/src/
├── stores/
│   ├── use-ui-store.ts          # (Create) 모달 상태
│   └── use-filter-store.ts      # (Create) 필터 상태
├── components/
│   ├── ui/
│   │   ├── dialog.tsx           # (Create) 모달 다이얼로그
│   │   ├── select.tsx           # (Create) 셀렉트 컴포넌트
│   │   ├── textarea.tsx         # (Create) 텍스트에어리어
│   │   └── label.tsx            # (Create) 라벨
│   ├── modals/
│   │   ├── modal-manager.tsx    # (Create) 모달 라우터
│   │   ├── learning-item-modal.tsx  # (Create) 학습 항목 폼
│   │   ├── topic-modal.tsx      # (Create) 토픽 폼
│   │   └── progress-log-modal.tsx   # (Create) 진행 기록 폼
│   ├── kanban/
│   │   ├── kanban-board.tsx     # (Modify) 필터 연동 + 순서 변경
│   │   ├── kanban-card.tsx      # (Modify) 카드 리디자인
│   │   └── kanban-filter-bar.tsx # (Create) 필터 바 UI
│   └── filters/
│       └── filter-bar.tsx       # (Create) 공통 필터 바 (테이블에서도 사용)
├── app/(dashboard)/
│   ├── layout.tsx               # (Modify) ModalManager 추가
│   ├── kanban/page.tsx          # (Modify) 필터 바 추가
│   └── items/page.tsx           # (Modify) 필터 바 + 추가 버튼
```
