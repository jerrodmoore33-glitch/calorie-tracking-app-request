'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Loader2, Search, Store, X } from 'lucide-react'
import type { FoodResult } from '@/lib/usda'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AddFoodPanel } from '@/components/add-food-panel'
import { cn } from '@/lib/utils'

const SUGGESTIONS = ['Big Mac', 'Chick-fil-A sandwich', 'Taco Bell burrito', 'Starbucks latte', 'Pizza Hut']

async function fetcher(url: string) {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Search failed')
  return data as { foods: FoodResult[] }
}

function useDebounced(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const SOURCE_LABEL: Record<FoodResult['source'], string> = {
  restaurant: 'Restaurant',
  branded: 'Brand',
  generic: 'Generic',
}

export function FoodSearch({ date }: { date: string }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<FoodResult | null>(null)
  const debounced = useDebounced(query.trim())
  const { data, error, isLoading } = useSWR(
    debounced.length >= 2 ? `/api/foods?q=${encodeURIComponent(debounced)}` : null,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  return (
    <section
      aria-labelledby="search-heading"
      className="flex flex-col gap-4 self-start rounded-2xl border bg-card p-5 lg:sticky lg:top-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id="search-heading" className="text-lg font-semibold tracking-tight">
          Add food
        </h2>
        <p className="text-sm text-muted-foreground">
          Search restaurants, fast food chains, and grocery brands.
        </p>
      </div>

      {selected ? (
        <AddFoodPanel
          food={selected}
          date={date}
          onDone={() => setSelected(null)}
          onCancel={() => setSelected(null)}
        />
      ) : (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. McDonald's fries"
              aria-label="Search foods"
              className="h-10 pr-9 pl-9"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="absolute top-1/2 right-2 -translate-y-1/2"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X />
              </Button>
            )}
          </div>

          {debounced.length < 2 ? (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQuery(s)}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : error ? (
            <p role="alert" className="text-sm text-destructive">
              {error.message}
            </p>
          ) : isLoading && !data ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Searching live nutrition data…
            </div>
          ) : data && data.foods.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No matches. Try the chain name plus the item.
            </p>
          ) : (
            <ul
              className={cn(
                'flex max-h-[28rem] flex-col gap-1 overflow-y-auto',
                isLoading && 'opacity-60',
              )}
              aria-live="polite"
            >
              {data?.foods.map((food) => {
                const portion = food.portions[0]
                const kcal = Math.round((food.per100g.calories * portion.grams) / 100)
                return (
                  <li key={food.fdcId}>
                    <button
                      type="button"
                      onClick={() => setSelected(food)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Store className="size-4" aria-hidden="true" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{food.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {food.brand ?? SOURCE_LABEL[food.source]} · {portion.label}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-semibold tabular-nums">{kcal}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">Nutrition data from USDA FoodData Central.</p>
        </>
      )}
    </section>
  )
}
