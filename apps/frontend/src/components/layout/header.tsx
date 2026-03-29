import { createClient } from '@/lib/supabase/server'
import { signout } from '@/app/(auth)/login/actions'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <span className="text-sm text-muted-foreground">{user?.email}</span>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <form action={signout}>
          <Button variant="ghost" size="sm" type="submit">
            로그아웃
          </Button>
        </form>
      </div>
    </header>
  )
}
