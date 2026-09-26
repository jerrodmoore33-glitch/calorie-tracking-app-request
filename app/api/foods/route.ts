import { auth } from '@/lib/auth'
import { searchFoods } from '@/lib/usda'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const query = request.nextUrl.searchParams.get('q')?.trim().slice(0, 100) ?? ''
  if (query.length < 2) return NextResponse.json({ foods: [] })

  try {
    const foods = await searchFoods(query)
    return NextResponse.json({ foods })
  } catch {
    return NextResponse.json(
      { error: 'Food search is temporarily unavailable. Try again shortly.' },
      { status: 502 },
    )
  }
}
