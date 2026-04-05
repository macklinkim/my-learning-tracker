# Phase 4: Interactive Features — 구현 완료 보고

**구현일:** 2026-03-29
**상태:** 완료

---

## 목표

Zustand 전역 상태 관리, 칸반 보드 고도화, React Hook Form + Zod 모달 시스템 구축

## 설치된 패키지 (apps/frontend)

- `zustand` v5.0.12 — 전역 클라이언트 상태 관리
- `react-hook-form` v7.72.0 — 폼 관리
- `@hookform/resolvers` v5.2.2 — Zod resolver
- `zod` v4.3.6 — 프론트엔드 폼 검증용

## 생성된 파일

### Zustand 스토어 (2개)

| 파일 | 역할 |
|------|------|
| `stores/use-ui-store.ts` | 모달 열림/닫힘, 모드(create/edit), 편집 데이터 관리 |
| `stores/use-filter-store.ts` | 상태 필터, 토픽 필터, 검색어 전역 관리 |

### UI 기본 컴포넌트 (4개)

| 파일 | 역할 |
|------|------|
| `components/ui/dialog.tsx` | 모달 다이얼로그 (backdrop, ESC 닫기, fade 애니메이션) |
| `components/ui/select.tsx` | HTML select + Tailwind 스타일링 |
| `components/ui/textarea.tsx` | HTML textarea + Tailwind 스타일링 |
| `components/ui/label.tsx` | HTML label + 폰트 스타일링 |

### 모달 시스템 (5개)

| 파일 | 역할 |
|------|------|
| `lib/schemas.ts` | Zod 폼 스키마 3개 (LearningItem, Topic, ProgressLog) |
| `components/modals/modal-manager.tsx` | modalType에 따른 조건부 렌더링 |
| `components/modals/learning-item-modal.tsx` | 학습 항목 생성/수정 폼 (7필드) |
| `components/modals/topic-modal.tsx` | 토픽 생성/수정 폼 (name, color, parent) |
| `components/modals/progress-log-modal.tsx` | 진행 기록 생성 폼 (item, duration, notes) |

### 필터 바 (1개)

| 파일 | 역할 |
|------|------|
| `components/filters/filter-bar.tsx` | 검색(debounce), 상태 토글, 토픽 셀렉트, 초기화 |

## 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `kanban/kanban-board.tsx` | 필터 연동, 같은 컬럼 내 순서 변경(arrayMove + order_index), 드래그 오버레이(rotate-2 scale-105), 토픽 정보 전달 |
| `kanban/kanban-card.tsx` | 좌측 토픽 컬러 바, 예상 시간 표시, 카드 클릭→수정 모달(드래그/클릭 구분) |
| `learning-items/items-table.tsx` | useFilterStore 연동 (status/topic/search 클라이언트 필터링) |
| `layout/dashboard-shell.tsx` | ModalManager 마운트 |
| `(dashboard)/items/page.tsx` | FilterBar + "새 항목" 버튼 |
| `(dashboard)/kanban/page.tsx` | FilterBar + "새 항목" 버튼 |
| `(dashboard)/page.tsx` | "학습 기록"/"새 토픽" 버튼 |

## 아키텍처 결정 사항

- **Zustand 범위:** 모달 + 필터 상태만 관리. 서버 데이터는 TanStack Query 유지
- **필터링:** 클라이언트 사이드 (이미 fetch된 데이터에서 filter)
- **칸반 필터:** topicFilter + searchQuery만 적용 (statusFilter는 컬럼이 status이므로 미적용)
- **모달 패턴:** ModalManager가 레이아웃에 한 번 마운트, useUIStore로 제어
- **폼 검증:** Zod v4 + @hookform/resolvers v5 (Zod v4 네이티브 지원)
