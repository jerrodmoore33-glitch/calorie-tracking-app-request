'use client'

import { useState, useTransition } from 'react'
import { Check, Pencil } from 'lucide-react'
import { setCalorieGoal } from '@/app/actions/logs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function GoalForm({ goal }: { goal: number }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(goal))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="font-mono text-xl font-semibold tabular-nums">{goal.toLocaleString()}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setValue(String(goal))
            setEditing(true)
          }}
          aria-label="Edit daily calorie goal"
        >
          <Pencil />
        </Button>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-1"
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        startTransition(async () => {
          try {
            await setCalorieGoal(Number(value))
            setEditing(false)
          } catch {
            setError('Enter 800–10,000')
          }
        })
      }}
    >
      <div className="flex items-center gap-1">
        <Input
          type="number"
          inputMode="numeric"
          min={800}
          max={10000}
          step={50}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Daily calorie goal"
          className="h-8 w-24 font-mono"
          autoFocus
        />
        <Button type="submit" size="icon-sm" disabled={pending} aria-label="Save goal">
          <Check />
        </Button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </form>
  )
}
