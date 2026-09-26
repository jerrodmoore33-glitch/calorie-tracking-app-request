import type { FoodLog } from '@/lib/db/schema'
import { MEALS, MEAL_LABELS, type Meal } from '@/lib/meals'
import { DeleteLogButton } from '@/components/delete-log-button'

export function FoodLogList({ logs }: { logs: FoodLog[] }) {
  return (
    <section aria-labelledby="log-heading" className="flex flex-col gap-4">
      <h2 id="log-heading" className="text-lg font-semibold tracking-tight">
        Food log
      </h2>
      <div className="flex flex-col gap-3">
        {MEALS.map((meal) => (
          <MealGroup key={meal} meal={meal} logs={logs.filter((l) => l.meal === meal)} />
        ))}
      </div>
    </section>
  )
}

function MealGroup({ meal, logs }: { meal: Meal; logs: FoodLog[] }) {
  const total = logs.reduce((sum, l) => sum + l.calories, 0)
  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center justify-between px-5 py-3">
        <h3 className="font-medium">{MEAL_LABELS[meal]}</h3>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          {Math.round(total).toLocaleString()} kcal
        </span>
      </div>
      {logs.length === 0 ? (
        <p className="border-t px-5 py-3 text-sm text-muted-foreground">Nothing logged yet.</p>
      ) : (
        <ul className="divide-y border-t">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{log.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {[log.brand, `${log.servings} serving${log.servings === 1 ? '' : 's'}`]
                    .filter(Boolean)
                    .join(' · ')}
                  {' · '}P {Math.round(log.protein)}g · C {Math.round(log.carbs)}g · F{' '}
                  {Math.round(log.fat)}g
                </span>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {Math.round(log.calories)}
              </span>
              <DeleteLogButton id={log.id} name={log.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
