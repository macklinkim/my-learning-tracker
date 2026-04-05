# 개발 진행 과정 (Development Phases)

## Phase 3: 핵심 대시보드 UI (Core UI & Data Grid)

**목표:** 로그인한 사용자의 핵심 데이터를 보여주는 대시보드와 데이터 그리드를 개발합니다.
**상태:** 완료

### 상세 작업 내용
- Tailwind CSS와 shadcn/ui 컴포넌트(Card, Button, Input 등)를 활용한 레이아웃 구성.
- TanStack Table을 활용하여 학습 목록 데이터 그리드 구현.
- 각 목록의 생성일, 마감일, 수정일 등 시간 관련 데이터를 다룰 때 `date-fns`를 활용하여 일관된 포맷(예: `yyyy-MM-dd HH:mm`)으로 가공 및 노출.
- 인라인 수정(Inline Editing) 기능 추가 및 수정 사항을 Hono API로 전송(Mutation).
- Recharts를 이용해 개인별 학습 진도율 및 카테고리별 비중을 차트로 시각화.
- **디자인 벤치마킹 및 다크 모드(Dark Mode) 적용**:
  - 사용자 환경(OS 설정) 및 토글 버튼에 따라 **전체 다크 모드(Dark Mode)**를 완벽하게 지원하도록 `next-themes`와 Tailwind CSS 설정(`darkMode: 'class'`)을 세팅합니다.
- **대시보드 (LeetCode 스타일):** 상단에 Recharts를 활용한 일일 학습 히트맵(잔디 심기)과 카테고리별 파이 차트를 배치하여 성취감을 시각화한다.
- **데이터 관리 (Notion 스타일):** TanStack Table을 활용해 엑셀처럼 빠르고 직관적인 인라인 텍스트 수정 및 태그 변경을 지원한다.
- **진척도 관리 (Linear 스타일):** dnd-kit을 적용한 칸반 보드로 '할 일 - 진행 중 - 완료' 카드를 부드럽게 드래그 앤 드롭할 수 있게 한다.

### 추가 구현 사항 (2026-04-05)

#### 대시보드 차트 확장
- **토픽별 막대그래프 (`topic-bar.tsx`):** 토픽별 학습 아이템 수를 수평 막대그래프로 시각화. Recharts BarChart 활용, 토픽 고유 컬러 반영.
- **토픽별 Treemap 차트 (`topic-treemap.tsx`):** 학습 아이템 분포를 Treemap으로 시각화. 면적으로 각 토픽의 비중을 직관적으로 파악 가능.
- **대시보드 반응형 레이아웃:** 기존 파이 차트 + 신규 막대그래프/Treemap을 반응형 그리드로 배치. Tooltip formatter 타입 에러 수정 포함.

#### 학습 목록 UX 개선
- **인라인 상태 변경 (`inline-status-cell.tsx`):** 학습 목록 테이블에서 상태(inbox/todo/in_progress/completed)를 클릭하여 즉시 변경 가능. 드롭다운 Select UI + 색상 배지 적용.
- **학습 기록 버튼:** 학습 목록 페이지(`items/page.tsx`)에 학습 기록(Progress Log) 추가 버튼 배치. 테이블 행에서 바로 기록 생성 가능.
