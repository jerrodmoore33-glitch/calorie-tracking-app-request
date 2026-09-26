export type Portion = { label: string; grams: number }

export type FoodResult = {
  fdcId: number
  name: string
  brand: string | null
  source: 'restaurant' | 'branded' | 'generic'
  per100g: { calories: number; protein: number; carbs: number; fat: number }
  portions: Portion[]
}

type UsdaNutrient = { nutrientId: number; value?: number; unitName?: string }
type UsdaMeasure = { disseminationText?: string; gramWeight?: number; rank?: number }
type UsdaFood = {
  fdcId: number
  description: string
  dataType: string
  brandName?: string
  brandOwner?: string
  foodCategory?: string
  servingSize?: number
  servingSizeUnit?: string
  householdServingFullText?: string
  foodNutrients?: UsdaNutrient[]
  foodMeasures?: UsdaMeasure[]
}

const ENERGY_IDS = [1008, 2047, 2048]
const PROTEIN_ID = 1003
const CARBS_ID = 1005
const FAT_ID = 1004

function nutrient(food: UsdaFood, ids: number[]) {
  for (const id of ids) {
    const match = food.foodNutrients?.find(
      (n) => n.nutrientId === id && (id !== 1008 || n.unitName?.toUpperCase() !== 'KJ'),
    )
    if (match?.value != null) return match.value
  }
  return 0
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\bMc([a-z])/g, (_, c: string) => `Mc${c.toUpperCase()}`)
}

function extractBrand(food: UsdaFood) {
  if (food.brandName) return titleCase(food.brandName)
  if (food.brandOwner) return titleCase(food.brandOwner)
  const parenthetical = food.description.match(/\(([^)]+)\)\s*$/)
  if (parenthetical) return parenthetical[1]
  const legacyPrefix = food.description.match(/^([A-Z'&.\s]{3,}),/)
  if (legacyPrefix && food.foodCategory === 'Fast Foods') return titleCase(legacyPrefix[1])
  return null
}

function cleanName(food: UsdaFood) {
  let name = food.description.replace(/\s*\([^)]+\)\s*$/, '')
  if (name === name.toUpperCase()) name = titleCase(name)
  return name
}

function portionsFor(food: UsdaFood): Portion[] {
  const portions: Portion[] = []
  const unit = food.servingSizeUnit?.toLowerCase()
  if (food.servingSize && unit && ['g', 'grm', 'ml', 'mlt'].includes(unit)) {
    portions.push({
      label: food.householdServingFullText
        ? `${food.householdServingFullText} (${Math.round(food.servingSize)} g)`
        : `1 serving (${Math.round(food.servingSize)} g)`,
      grams: food.servingSize,
    })
  }
  const measures = [...(food.foodMeasures ?? [])]
    .filter((m) => m.gramWeight && m.gramWeight > 0 && m.disseminationText)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
  const preferred = measures.filter((m) => m.disseminationText !== 'Quantity not specified')
  const fallback = measures.filter((m) => m.disseminationText === 'Quantity not specified')
  for (const m of [...preferred, ...fallback].slice(0, 5)) {
    const label =
      m.disseminationText === 'Quantity not specified' ? 'Typical portion' : m.disseminationText!
    portions.push({ label: `${label} (${Math.round(m.gramWeight!)} g)`, grams: m.gramWeight! })
  }
  portions.push({ label: '100 g', grams: 100 })
  return portions
}

function sourceFor(food: UsdaFood, brand: string | null): FoodResult['source'] {
  if (food.dataType === 'Branded') return 'branded'
  if (brand || food.foodCategory === 'Fast Foods') return 'restaurant'
  return 'generic'
}

export async function searchFoods(query: string): Promise<FoodResult[]> {
  const params = new URLSearchParams({
    query,
    pageSize: '25',
    dataType: 'Survey (FNDDS),SR Legacy,Branded',
    api_key: process.env.USDA_API_KEY ?? 'DEMO_KEY',
  })
  const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params}`, {
    next: { revalidate: 60 * 60 * 24 },
  })
  if (!res.ok) {
    console.error('USDA search failed', res.status, await res.text().catch(() => ''))
    throw new Error('Food search is temporarily unavailable')
  }
  const data = (await res.json()) as { foods?: UsdaFood[] }

  return (data.foods ?? [])
    .map((food) => {
      const brand = extractBrand(food)
      return {
        fdcId: food.fdcId,
        name: cleanName(food),
        brand,
        source: sourceFor(food, brand),
        per100g: {
          calories: nutrient(food, ENERGY_IDS),
          protein: nutrient(food, [PROTEIN_ID]),
          carbs: nutrient(food, [CARBS_ID]),
          fat: nutrient(food, [FAT_ID]),
        },
        portions: portionsFor(food),
      }
    })
    .filter((f) => f.per100g.calories > 0)
}
