'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Flame } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))

    const result = isSignUp
      ? await authClient.signUp.email({ email, password, name: String(form.get('name')) })
      : await authClient.signIn.email({ email, password })

    setPending(false)
    if (result.error) {
      console.error('Auth error', result.error)
      setError(
        isSignUp
          ? 'Could not create your account. Check your details and try again.'
          : 'Invalid email or password.',
      )
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Flame className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            {isSignUp ? 'Create your Bitewise account' : 'Welcome back to Bitewise'}
          </h1>
          <p className="text-pretty text-sm text-muted-foreground">
            {isSignUp
              ? 'Track calories from your favorite restaurants and fast food chains.'
              : 'Sign in to keep tracking your daily calories.'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" autoComplete="name" required />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={8}
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full">
            {pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account? ' : 'New to Bitewise? '}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </main>
  )
}
