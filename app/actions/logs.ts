'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { foodLogs, userGoals } from '@/lib/db/schema'
import { MEALS, type Meal } from '@/lib/meals'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function finite(value: unknown, max: number) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > max) throw new Error('Invalid value')
  return Math.round(n * 10) / 10
}

export type NewLog = {
  fdcId: number | null
  name: string
  brand: string | null
  meal: Meal
  servings: number
  calories: number
  protein: number
  carbs: number
  fat: number
  logDate: string
}

export async function addLog(input: NewLog) {
  const userId = await getUserId()
  if (!MEALS.includes(input.meal)) throw new Error('Invalid meal')
  if (!DATE_RE.test(input.logDate)) throw new Error('Invalid date')
  const name = String(input.name ?? '').trim().slice(0, 200)
  if (!name) throw new Error('Name is required')
  const servings = finite(input.servings, 50)
  if (servings <= 0) throw new Error('Servings must be positive')

  await db.insert(foodLogs).values({
    userId,
    fdcId: Number.isInteger(input.fdcId) ? input.fdcId : null,
    name,
    brand: input.brand ? String(input.brand).slice(0, 120) : null,
    meal: input.meal,
    servings,
    calories: finite(input.calories, 20000),
    protein: finite(input.protein, 2000),
    carbs: finite(input.carbs, 2000),
    fat: finite(input.fat, 2000),
    logDate: input.logDate,
  })
  revalidatePath('/')
}

export async function deleteLog(id: number) {
  const userId = await getUserId()
  if (!Number.isInteger(id)) throw new Error('Invalid id')
  await db.delete(foodLogs).where(and(eq(foodLogs.id, id), eq(foodLogs.userId, userId)))
  revalidatePath('/')
}

export async function setCalorieGoal(goal: number) {
  const userId = await getUserId()
  const calorieGoal = Math.round(Number(goal))
  if (!Number.isFinite(calorieGoal) || calorieGoal < 800 || calorieGoal > 10000) {
    throw new Error('Goal must be between 800 and 10,000')
  }
  await db
    .insert(userGoals)
    .values({ userId, calorieGoal })
    .onConflictDoUpdate({
      target: userGoals.userId,
      set: { calorieGoal, updatedAt: new Date() },
    })
  revalidatePath('/')
}
