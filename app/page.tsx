import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, asc, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { foodLogs, userGoals } from '@/lib/db/schema'
import { AppHeader } from '@/components/app-header'
import { DateNav, DateRedirect } from '@/components/date-nav'
import { DailySummary } from '@/components/daily-summary'
import { FoodLogList } from '@/components/food-log-list'
import { FoodSearch } from '@/components/food-search'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const { date } = await searchParams
  if (!date || !DATE_RE.test(date)) return <DateRedirect />

  const userId = session.user.id
  const [logs, goalRows] = await Promise.all([
    db
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.userId, userId), eq(foodLogs.logDate, date)))
      .orderBy(asc(foodLogs.createdAt)),
    db.select().from(userGoals).where(eq(userGoals.userId, userId)).limit(1),
  ])
  const goal = goalRows[0]?.calorieGoal ?? 2000

  return (
    <div className="min-h-svh bg-background">
      <AppHeader name={session.user.name} />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:py-8">
        <DateNav date={date} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className="flex flex-col gap-6">
            <DailySummary logs={logs} goal={goal} />
            <FoodLogList logs={logs} />
          </div>
          <FoodSearch date={date} />
        </div>
      </main>
    </div>
  )
}
