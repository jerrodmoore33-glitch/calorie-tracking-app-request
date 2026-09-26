'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { localDateString, shiftDate } from '@/lib/meals'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DateRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(`/?date=${localDateString()}`)
  }, [router])
  return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
      Loading your day…
    </div>
  )
}

function formatHeading(date: string, today: string | null) {
  if (today && date === today) return 'Today'
  if (today && date === shiftDate(today, -1)) return 'Yesterday'
  if (today && date === shiftDate(today, 1)) return 'Tomorrow'
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long' })
}

export function DateNav({ date }: { date: string }) {
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => setToday(localDateString()), [])

  const [y, m, d] = date.split('-').map(Number)
  const full = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold tracking-tight">{formatHeading(date, today)}</h1>
        <p className="text-sm text-muted-foreground">{full}</p>
      </div>
      <nav aria-label="Change day" className="flex items-center gap-1">
        <Link
          href={`/?date=${shiftDate(date, -1)}`}
          className={buttonVariants({ variant: 'outline', size: 'icon' })}
          aria-label="Previous day"
        >
          <ChevronLeft />
        </Link>
        {today && date !== today && (
          <Link href={`/?date=${today}`} className={cn(buttonVariants({ variant: 'outline' }))}>
            Today
          </Link>
        )}
        <Link
          href={`/?date=${shiftDate(date, 1)}`}
          className={buttonVariants({ variant: 'outline', size: 'icon' })}
          aria-label="Next day"
        >
          <ChevronRight />
        </Link>
      </nav>
    </div>
  )
}
