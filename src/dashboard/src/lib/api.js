const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function getJson(path) {
  const response = await fetch(`${BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`)
  }
  return response.json()
}

// The API scores live weather and falls back to the snapshot itself, reporting
// which via data_source ("live" or "snapshot").
export async function fetchDistrictRisk(district, crop) {
  return getJson(`/risk/${encodeURIComponent(district)}?crop=${crop.toLowerCase()}`)
}

export async function fetchForecast(district) {
  return getJson(`/forecast/${encodeURIComponent(district)}`)
}

export async function fetchAlerts() {
  return getJson('/alerts')
}
