/**
 * Open-Meteo Weather Service
 *
 * Fetches real weather telemetry (free, no API key required):
 * - Current temperature, humidity, precipitation, wind speed, and WMO weather condition
 * - 7-day daily forecast with high/low temperatures, precipitation probability, and rainfall sum
 * - Farm coordinates default to Gandhinagar, Gujarat (23.22, 72.65)
 * - Cached in-memory with automatic fallback to mock data on error or offline
 */

import { MOCK_WEATHER } from '@/data/dashboard'
import type { Weather, WeatherCondition, WeatherDay } from '@/data/types'

export interface FarmCoordinates {
  lat: number
  lon: number
  village: string
  district: string
  state: string
}

export const FARM_LOCATIONS: Record<string, FarmCoordinates> = {
  'farm-main': {
    lat: 23.22,
    lon: 72.65,
    village: 'Gandhinagar',
    district: 'Gandhinagar',
    state: 'Gujarat',
  },
  'farm-river': {
    lat: 22.03,
    lon: 71.20,
    village: 'Jasdan',
    district: 'Rajkot',
    state: 'Gujarat',
  },
}

export const DEFAULT_LOCATION: FarmCoordinates = {
  lat: 23.22,
  lon: 72.65,
  village: 'Gandhinagar',
  district: 'Gandhinagar',
  state: 'Gujarat',
}

interface OpenMeteoResponse {
  current: {
    time: string
    temperature_2m: number
    relative_humidity_2m: number
    weather_code: number
    wind_speed_10m: number
    precipitation: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
    precipitation_sum: number[]
  }
}

/** Converts WMO Weather Interpretation Codes to our app's WeatherCondition */
export function wmoToCondition(code: number): WeatherCondition {
  if (code === 0) return 'sunny'
  if (code === 1 || code === 2) return 'partly'
  if (code === 3 || code === 45 || code === 48) return 'cloudy'
  if (code >= 51 && code <= 99) return 'rain'
  return 'partly'
}

const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes
const cache = new Map<string, { timestamp: number; weather: Weather }>()
const simulatedRainFarms = new Set<string>()

export function setSimulatedRain(farmId: string, enabled: boolean) {
  if (enabled) {
    simulatedRainFarms.add(farmId)
  } else {
    simulatedRainFarms.delete(farmId)
  }
  // invalidate cache
  cache.delete(farmId)
}

export function isSimulatedRain(farmId: string): boolean {
  return simulatedRainFarms.has(farmId)
}

export function parseOpenMeteo(data: OpenMeteoResponse, simulatedRain = false): Weather {
  const current = data.current
  const daily = data.daily

  const condition = simulatedRain ? 'rain' : wmoToCondition(current.weather_code)

  const days: WeatherDay[] = daily.time.slice(0, 7).map((dateStr, i) => {
    // Noon UTC to prevent timezone day-shift
    const isoDate = `${dateStr}T12:00:00.000Z`
    const isTomorrow = i === 1
    const rainChance = simulatedRain && isTomorrow ? 85 : Math.round(daily.precipitation_probability_max[i] ?? 0)
    const dayCondition = simulatedRain && isTomorrow ? 'rain' : wmoToCondition(daily.weather_code[i])
    const rainfall = simulatedRain && isTomorrow ? 18.5 : Math.round((daily.precipitation_sum[i] ?? 0) * 10) / 10

    return {
      date: isoDate,
      max: Math.round(daily.temperature_2m_max[i]),
      min: Math.round(daily.temperature_2m_min[i]),
      rainChance,
      condition: dayCondition,
      rainfall,
    }
  })

  return {
    now: {
      temp: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m),
      windKmh: Math.round(current.wind_speed_10m),
      condition,
      rainfall: simulatedRain ? 4.2 : Math.round(current.precipitation * 10) / 10,
    },
    days,
  }
}

/**
 * Fetches real weather from Open-Meteo API.
 * Falls back safely to MOCK_WEATHER if network is offline or request fails.
 */
export async function fetchLiveWeather(farmId = 'farm-main'): Promise<Weather> {
  const coords = FARM_LOCATIONS[farmId] ?? DEFAULT_LOCATION
  const simulated = simulatedRainFarms.has(farmId)
  const cacheKey = `${farmId}-${simulated ? 'rain' : 'real'}`

  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.weather
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`Open-Meteo returned status ${res.status}`)
    const json: OpenMeteoResponse = await res.json()
    const weather = parseOpenMeteo(json, simulated)

    cache.set(cacheKey, { timestamp: Date.now(), weather })
    return weather
  } catch (err) {
    console.warn('[weather] Open-Meteo fetch failed, using fallback mock weather:', err)
    if (cached) return cached.weather

    // If simulated rain is active even on mock fallback:
    if (simulated) {
      const copy = structuredClone(MOCK_WEATHER)
      copy.days = [
        ...copy.days,
        { date: new Date(Date.now() + 4 * 86400000).toISOString(), max: 32, min: 22, rainChance: 10, condition: 'sunny' },
        { date: new Date(Date.now() + 5 * 86400000).toISOString(), max: 33, min: 23, rainChance: 5, condition: 'sunny' },
        { date: new Date(Date.now() + 6 * 86400000).toISOString(), max: 31, min: 21, rainChance: 15, condition: 'partly' },
      ]
      copy.days[1] = {
        ...copy.days[1],
        rainChance: 85,
        condition: 'rain',
        rainfall: 22.4,
      }
      return copy
    }

    // Expand mock days to 7 days
    const copy = structuredClone(MOCK_WEATHER)
    if (copy.days.length < 7) {
      const baseTime = Date.now()
      while (copy.days.length < 7) {
        const idx = copy.days.length
        copy.days.push({
          date: new Date(baseTime + idx * 86400000).toISOString(),
          max: 32 + (idx % 3),
          min: 22 + (idx % 2),
          rainChance: idx === 3 ? 40 : 10,
          condition: idx === 3 ? 'cloudy' : 'sunny',
        })
      }
    }
    return copy
  }
}

/** Synchronous getter returning latest cached weather or initialized fallback */
export function getLiveWeatherSync(farmId = 'farm-main'): Weather {
  const simulated = simulatedRainFarms.has(farmId)
  const cacheKey = `${farmId}-${simulated ? 'rain' : 'real'}`
  const cached = cache.get(cacheKey)
  if (cached) return cached.weather

  // Trigger background fetch if not present
  void fetchLiveWeather(farmId)

  // Expand default mock to 7 days as initial view
  const copy = structuredClone(MOCK_WEATHER)
  if (copy.days.length < 7) {
    const baseTime = Date.now()
    while (copy.days.length < 7) {
      const idx = copy.days.length
      copy.days.push({
        date: new Date(baseTime + idx * 86400000).toISOString(),
        max: 32 + (idx % 3),
        min: 22 + (idx % 2),
        rainChance: idx === 3 ? 40 : 10,
        condition: idx === 3 ? 'cloudy' : 'sunny',
      })
    }
  }
  return copy
}

/**
 * Evaluates weather for irrigation decision:
 * e.g. "rain expected tomorrow, skip irrigation"
 */
export function evaluateWeatherForIrrigation(weather: Weather) {
  const tomorrow = weather.days[1] ?? weather.days[0]
  const tomorrowRainChance = tomorrow?.rainChance ?? 0
  const tomorrowRain = tomorrowRainChance >= 40 || tomorrow?.condition === 'rain' || (tomorrow?.rainfall ?? 0) >= 2

  let dryDaysCount = 0
  for (const d of weather.days) {
    if (d.rainChance < 30 && d.condition !== 'rain') {
      dryDaysCount++
    } else {
      break
    }
  }

  return {
    rainExpectedTomorrow: tomorrowRain,
    tomorrowRainChance,
    dryDaysCount: Math.max(1, dryDaysCount),
    currentTemp: Math.round(weather.now.temp),
  }
}
