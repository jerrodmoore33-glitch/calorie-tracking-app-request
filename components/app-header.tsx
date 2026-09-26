'use client'

import { useRouter } from 'next/navigation'
import { Flame, LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function AppHeader({ name }: { name: string }) {
  const router = useRouter()

  async function signOut() {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="size-4" aria-hidden="true" />
          </div>
          <span className="font-semibold tracking-tight">Bitewise</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">Hi, {name}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
