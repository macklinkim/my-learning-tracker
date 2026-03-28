import { createClient } from '@/lib/supabase/server'
import { signout } from '@/app/(auth)/login/actions'

export default async function DashboardPage() {
  // layout.tsx에서 이미 getUser() 호출 후 리다이렉트 처리.
  // page에서 재호출하는 것은 중복이지만 user 데이터를 직접 사용하기 위해 허용.
  // Phase 3에서 데이터 fetching이 추가되면 통합 검토.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="p-8">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold">Learning Tracker</h1>
        <form action={signout}>
          <button
            type="submit"
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            로그아웃
          </button>
        </form>
      </div>
      <p className="mt-6 text-gray-600">
        안녕하세요, <span className="font-medium">{user!.email}</span>님!
      </p>
      <p className="mt-2 text-sm text-gray-400">
        Phase 3에서 학습 대시보드가 여기에 구현됩니다.
      </p>
    </main>
  )
}
