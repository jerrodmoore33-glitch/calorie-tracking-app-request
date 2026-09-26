import type { FoodLog } from '@/lib/db/schema'
import { GoalForm } from '@/components/goal-form'

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(consumed / goal, 1)
  const over = consumed > goal

  return (
    <div className="relative size-44 shrink-0">
      <svg viewBox="0 0 160 160" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="80" cy="80" r={radius} fill="none" strokeWidth="14" className="stroke-muted" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={over ? 'stroke-destructive' : 'stroke-primary'}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-semibold tabular-nums">
          {Math.abs(Math.round(goal - consumed)).toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">{over ? 'kcal over' : 'kcal left'}</span>
      </div>
    </div>
  )
}

function MacroBar({
  label,
  grams,
  total,
  colorClass,
}: {
  label: string
  grams: number
  total: number
  colorClass: string
}) {
  const pct = total > 0 ? Math.round((grams / total) * 100) : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{Math.round(grams)} g</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function DailySummary({ logs, goal }: { logs: FoodLog[]; goal: number }) {
  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
  const macroTotal = totals.protein + totals.carbs + totals.fat

  return (
    <section
      aria-labelledby="summary-heading"
      className="flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center"
    >
      <h2 id="summary-heading" className="sr-only">
        Daily summary
      </h2>
      <CalorieRing consumed={totals.calories} goal={goal} />
      <div className="flex flex-1 flex-col gap-5">
        <dl className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Eaten</dt>
            <dd className="font-mono text-xl font-semibold tabular-nums">
              {Math.round(totals.calories).toLocaleString()}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Daily goal</dt>
            <dd>
              <GoalForm goal={goal} />
            </dd>
          </div>
        </dl>
        <div className="flex flex-col gap-3">
          <MacroBar label="Protein" grams={totals.protein} total={macroTotal} colorClass="bg-chart-2" />
          <MacroBar label="Carbs" grams={totals.carbs} total={macroTotal} colorClass="bg-chart-3" />
          <MacroBar label="Fat" grams={totals.fat} total={macroTotal} colorClass="bg-chart-4" />
        </div>
      </div>
    </section>
  )
}
