const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function getJson(path) {
  const response = await fetch(`${BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`)
  }
  return response.json()
}

// Prefer live model scoring on current weather; fall back to the precomputed
// snapshot when live scoring is unavailable (for example, no model loaded).
export async function fetchDistrictRisk(district, crop) {
  const name = encodeURIComponent(district)
  const cropParam = crop.toLowerCase()
  try {
    return { ...(await getJson(`/risk/live/${name}?crop=${cropParam}`)), live: true }
  } catch {
    return { ...(await getJson(`/risk/${name}?crop=${cropParam}`)), live: false }
  }
}
