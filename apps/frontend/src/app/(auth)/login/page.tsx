import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card text-card-foreground p-6 shadow-sm">
        <h1 className="text-center text-2xl font-bold tracking-tight">
          Learning Tracker
        </h1>

        {params.error && (
          <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="rounded-md bg-green-500/15 px-3 py-2 text-sm text-green-600 dark:text-green-400">
            {params.message}
          </p>
        )}

        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              placeholder="••••••••"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              formAction={login}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              로그인
            </button>
            <button
              formAction={signup}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
