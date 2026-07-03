const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function fetchDistrictRisk(district, crop) {
  const url = `${BASE_URL}/risk/${encodeURIComponent(district)}?crop=${crop.toLowerCase()}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`)
  }
  return response.json()
}
