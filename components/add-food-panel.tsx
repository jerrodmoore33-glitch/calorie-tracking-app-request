'use client'

import { useState, useTransition } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { FoodResult } from '@/lib/usda'
import { addLog } from '@/app/actions/logs'
import { MEALS, MEAL_LABELS, type Meal } from '@/lib/meals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function defaultMeal(): Meal {
  const hour = new Date().getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 21) return 'dinner'
  return 'snack'
}

export function AddFoodPanel({
  food,
  date,
  onDone,
  onCancel,
}: {
  food: FoodResult
  date: string
  onDone: () => void
  onCancel: () => void
}) {
  const [portionIndex, setPortionIndex] = useState(0)
  const [servings, setServings] = useState('1')
  const [meal, setMeal] = useState<Meal>(defaultMeal)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const portion = food.portions[portionIndex]
  const qty = Number(servings)
  const valid = Number.isFinite(qty) && qty > 0 && qty <= 50
  const factor = valid ? (portion.grams / 100) * qty : 0
  const totals = {
    calories: food.per100g.calories * factor,
    protein: food.per100g.protein * factor,
    carbs: food.per100g.carbs * factor,
    fat: food.per100g.fat * factor,
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setError(null)
    startTransition(async () => {
      try {
        await addLog({
          fdcId: food.fdcId,
          name: food.name,
          brand: food.brand,
          meal,
          servings: qty,
          logDate: date,
          ...totals,
        })
        onDone()
      } catch {
        setError('Could not add this food. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex items-start gap-2">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onCancel} aria-label="Back to results">
          <ArrowLeft />
        </Button>
        <div className="flex min-w-0 flex-col">
          <h3 className="text-pretty font-medium leading-snug">{food.name}</h3>
          {food.brand && <p className="text-sm text-muted-foreground">{food.brand}</p>}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 rounded-xl bg-muted py-5">
        <span className="font-mono text-4xl font-semibold tabular-nums text-primary">
          {Math.round(totals.calories)}
        </span>
        <span className="text-xs text-muted-foreground">calories</span>
        <div className="mt-2 flex gap-4 text-xs">
          <span>
            <span className="text-muted-foreground">Protein </span>
            <span className="font-mono">{Math.round(totals.protein)}g</span>
          </span>
          <span>
            <span className="text-muted-foreground">Carbs </span>
            <span className="font-mono">{Math.round(totals.carbs)}g</span>
          </span>
          <span>
            <span className="text-muted-foreground">Fat </span>
            <span className="font-mono">{Math.round(totals.fat)}g</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="portion">Portion</Label>
          <select
            id="portion"
            value={portionIndex}
            onChange={(e) => setPortionIndex(Number(e.target.value))}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {food.portions.map((p, i) => (
              <option key={`${p.label}-${i}`} value={i}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="servings">Servings</Label>
          <Input
            id="servings"
            type="number"
            inputMode="decimal"
            min={0.25}
            max={50}
            step={0.25}
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            aria-invalid={!valid}
            className="font-mono"
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Meal</legend>
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
          {MEALS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={meal === m}
              onClick={() => setMeal(m)}
              className={cn(
                'rounded-md py-1.5 text-xs font-medium transition-colors',
                meal === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {MEAL_LABELS[m]}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={!valid || pending} className="w-full">
        {pending ? 'Adding…' : `Add to ${MEAL_LABELS[meal]}`}
      </Button>
    </form>
  )
}
