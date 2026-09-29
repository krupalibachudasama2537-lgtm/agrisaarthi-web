import type { HeroSnapshot, StationSnapshot } from './types'

/**
 * MOCK station data for a single 2-acre groundnut/wheat farm near Rajkot, Gujarat.
 * Replace with real ESP32 → backend responses via src/lib/api.ts.
 */
export const MOCK_STATION: StationSnapshot = {
  soil: {
    moisture: 22,
    temperature: 29.4,
    humidity: 61,
    updatedMinutesAgo: 12,
    dryThreshold: 25,
  },
  chemistry: {
    ph: 7.8,
    ec: 0.62,
    npk: { n: 182, p: 21, k: 265 },
    npkSource: 'soil-health-card',
  },
  fertilizer: [
    { name: 'Urea', bagKg: 45, bagsPerAcre: 1.5, pricePerBag: 267 },
    { name: 'DAP', bagKg: 50, bagsPerAcre: 1, pricePerBag: 1350 },
    { name: 'MOP', bagKg: 50, bagsPerAcre: 0.5, pricePerBag: 1700 },
  ],
  crop: {
    top: [
      { name: 'Groundnut', profitPerAcre: 38000, suitability: 92 },
      { name: 'Cumin', profitPerAcre: 34500, suitability: 86 },
      { name: 'Wheat', profitPerAcre: 26000, suitability: 81 },
    ],
    avoid: ['Paddy', 'Sugarcane'],
    tip: 'Add 2 t/acre farmyard manure to lower pH',
  },
  disease: {
    crop: 'Tomato',
    disease: 'Early blight',
    confidence: 0.92,
    treatment: 'Mancozeb 75% WP · 2.5 g/L, repeat after 10 days',
    offline: true,
  },
  pest: {
    pest: 'Pink bollworm',
    crop: 'Cotton',
    confidence: 0.88,
    dose: 'Pheromone traps 5/acre + Emamectin 5% SG 0.4 g/L',
    villageTrend: [
      { week: 'W1', reports: 2 },
      { week: 'W2', reports: 3 },
      { week: 'W3', reports: 5 },
      { week: 'W4', reports: 9 },
      { week: 'W5', reports: 14 },
      { week: 'W6', reports: 12 },
    ],
  },
  irrigation: {
    pumpOn: true,
    recommendedMinutes: 35,
    moisture: 22,
    soilType: 'Medium black',
    cropStage: 'Flowering',
    rainChance: 10,
  },
  mesh: {
    nodes: [
      { id: 'G', x: 50, y: 50, online: true, gateway: true },
      { id: 'A', x: 16, y: 22, online: true },
      { id: 'B', x: 84, y: 20, online: true },
      { id: 'C', x: 14, y: 80, online: true },
      { id: 'D', x: 86, y: 78, online: false },
      { id: 'E', x: 52, y: 12, online: true },
    ],
    links: [
      ['G', 'A'],
      ['G', 'B'],
      ['G', 'C'],
      ['A', 'E'],
      ['E', 'B'],
      ['B', 'D'],
      ['C', 'D'],
    ],
  },
  alerts: [
    {
      id: 'a1',
      channel: 'sms',
      text: 'KhetMitra: Soil too dry (22%). Pump started for 35 min.',
      time: '06:12',
      severity: 'warning',
    },
    {
      id: 'a2',
      channel: 'call',
      text: 'Wild animal near east fence. Siren ON.',
      time: '02:14',
      severity: 'critical',
    },
  ],
  voice: {
    languages: ['gu', 'hi', 'en'],
    active: 'gu',
    outputs: ['speaker', 'call', 'dashboard'],
    sample: 'જમીન સૂકી છે, પંપ ચાલુ કર્યો છે.',
  },
  animal: {
    animal: 'Nilgai herd',
    time: '02:14',
    confidence: 0.94,
    sirenOn: true,
    strobeOn: true,
    notified: ['call', 'sms', 'photo'],
  },
  grain: {
    crop: 'Wheat',
    moisture: 11.6,
    safeMax: 12,
    ready: true,
    bestMarket: 'Rajkot APMC',
    bestDay: 'Thu',
    mandi: [
      { market: 'Rajkot APMC', pricePerQuintal: 2560, change: 2.4, distanceKm: 18 },
      { market: 'Gondal APMC', pricePerQuintal: 2510, change: 0.8, distanceKm: 34 },
      { market: 'Jasdan APMC', pricePerQuintal: 2465, change: -1.1, distanceKm: 26 },
    ],
  },
}

/** MOCK numbers for the floating glass cards in the hero */
export const MOCK_HERO: HeroSnapshot = {
  soilHealthScore: 78,
  soilHealthByZone: [
    { zone: 'Z1', score: 64 },
    { zone: 'Z2', score: 82 },
    { zone: 'Z3', score: 71 },
    { zone: 'Z4', score: 88 },
    { zone: 'Z5', score: 76 },
    { zone: 'Z6', score: 91 },
  ],
  waterSavedPercent: 38,
  waterUsage: [
    { week: 'W1', baseline: 100, agrisaarthi: 92 },
    { week: 'W2', baseline: 104, agrisaarthi: 84 },
    { week: 'W3', baseline: 98, agrisaarthi: 74 },
    { week: 'W4', baseline: 102, agrisaarthi: 69 },
    { week: 'W5', baseline: 101, agrisaarthi: 64 },
    { week: 'W6', baseline: 99, agrisaarthi: 61 },
  ],
  liveMoisture: 24,
}
