import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-center text-2xl font-bold tracking-tight">
          Learning Tracker
        </h1>

        {params.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-600">
            {params.message}
          </p>
        )}

        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <div className="flex gap-2">
            <button
              formAction={login}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              로그인
            </button>
            <button
              formAction={signup}
              className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
