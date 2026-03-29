import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Header } from '@/components/layout/header'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* 사이드바 */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-background py-4">
        <div className="px-4 pb-4">
          <h1 className="text-lg font-bold">Learning Tracker</h1>
        </div>
        <SidebarNav />
      </aside>
      {/* 본문 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
