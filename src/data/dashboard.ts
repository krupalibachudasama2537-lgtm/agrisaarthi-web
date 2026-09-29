/**
 * MOCK data for the farmer dashboard.
 * Everything here is generated deterministically (seeded) relative to page-load time,
 * so charts look "live" but never flicker between renders.
 * Replace with real ESP32 → backend responses via src/lib/api.ts.
 */
import type {
  AlertItem,
  AlertRoute,
  AlertType,
  DiseaseDiagnosis,
  Farm,
  Farmer,
  FertilizerData,
  IrrigationData,
  Kpi,
  Localized,
  MarketData,
  MeshData,
  MessageLog,
  NearbyFarm,
  OverviewData,
  PestDiagnosis,
  PestWatchData,
  Recommendation,
  SeriesPoint,
  SoilData,
  StationHealth,
  Status,
  Weather,
  WildlifeEvent,
} from './types'

/* ---------- helpers ---------- */

const NOW = Date.now()
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString()
const isoAhead = (msAhead: number) => new Date(NOW + msAhead).toISOString()
const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d

/** Small seeded PRNG (mulberry32) */
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const seedOf = (s: string) => [...s].reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7)

/* ---------- farmer + farms ---------- */

export const MOCK_FARMER: Farmer = {
  id: 'farmer-01',
  name: 'Rameshbhai Patel',
  phone: '+91 98250 •••42',
  village: 'Kotda Sangani',
  district: 'Rajkot',
  initials: 'RP',
}

export const MOCK_FARMS: Farm[] = [
  {
    id: 'farm-main',
    name: 'Main farm',
    village: 'Kotda Sangani',
    acres: 4,
    stationId: 'AS-01',
    crop: 'Groundnut',
    cropStage: 'Flowering',
    soilType: 'Medium black',
  },
  {
    id: 'farm-river',
    name: 'River plot',
    village: 'Jasdan',
    acres: 2.5,
    stationId: 'AS-02',
    crop: 'Cotton',
    cropStage: 'Boll formation',
    soilType: 'Sandy loam',
  },
]

interface FarmProfile {
  moistureNow: number
  moistureStart: number
  ph: number
  ec: number
  battery: number
  sync: number
}

export const PROFILES: Record<string, FarmProfile> = {
  'farm-main': { moistureNow: 22, moistureStart: 31, ph: 7.8, ec: 0.62, battery: 86, sync: 12 },
  'farm-river': { moistureNow: 34, moistureStart: 38, ph: 7.2, ec: 0.41, battery: 64, sync: 4 },
}
export const profile = (farmId: string) => PROFILES[farmId] ?? PROFILES['farm-main']

export function mockStationHealth(farmId: string): StationHealth {
  const p = profile(farmId)
  return { batteryPct: p.battery, solarCharging: true, lastSyncMinutes: p.sync, signalBars: 3, online: true }
}

/* ---------- sensor series ---------- */

/** hour-of-day curve peaking at 15:00 (−1…1) */
const diurnal = (date: Date) => Math.sin(((date.getHours() + date.getMinutes() / 60 - 9) / 24) * Math.PI * 2)

export function makeSeries(farmId: string, points: number, stepMin: number): SeriesPoint[] {
  const p = profile(farmId)
  const rand = rng(seedOf(farmId) + stepMin)
  return Array.from({ length: points }, (_, i) => {
    const ago = (points - 1 - i) * stepMin * MIN
    const date = new Date(NOW - ago)
    const progress = i / (points - 1)
    const d = diurnal(date)
    const moisture = p.moistureStart + (p.moistureNow - p.moistureStart) * progress - d * 0.6 + (rand() - 0.5) * 0.5
    const temperature = 25 + d * 7 + (rand() - 0.5) * 0.6
    const humidity = 58 - d * 16 + (rand() - 0.5) * 2
    return {
      t: date.toISOString(),
      moisture: round(moisture),
      temperature: round(temperature),
      humidity: Math.round(humidity),
      ph: round(p.ph + (rand() - 0.5) * 0.08, 2),
      ec: round(p.ec + (rand() - 0.5) * 0.04, 2),
    }
  })
}

/* ---------- overview ---------- */

export const statusFor = {
  moisture: (v: number): Status => (v < 25 ? 'crit' : v < 30 ? 'warn' : 'ok'),
  temperature: (v: number): Status => (v > 38 ? 'crit' : v > 34 ? 'warn' : 'ok'),
  humidity: (v: number): Status => (v > 85 ? 'warn' : 'ok'),
  ph: (v: number): Status => (v < 5.5 || v > 8.5 ? 'crit' : v < 6.5 || v > 7.5 ? 'warn' : 'ok'),
  ec: (v: number): Status => (v > 1 ? 'crit' : v > 0.8 ? 'warn' : 'ok'),
  battery: (v: number): Status => (v < 20 ? 'crit' : v < 40 ? 'warn' : 'ok'),
}

export const MOCK_WEATHER: Weather = {
  now: { temp: 31, humidity: 54, windKmh: 12, condition: 'partly' },
  days: [
    { date: isoAhead(0), max: 33, min: 22, rainChance: 10, condition: 'partly' },
    { date: isoAhead(DAY), max: 34, min: 23, rainChance: 5, condition: 'sunny' },
    { date: isoAhead(2 * DAY), max: 31, min: 22, rainChance: 40, condition: 'cloudy' },
    { date: isoAhead(3 * DAY), max: 28, min: 21, rainChance: 70, condition: 'rain' },
  ],
}

export const MOCK_ALERTS: AlertItem[] = [
  { id: 'al-1', type: 'soilDry', severity: 'crit', time: iso(18 * MIN), channels: ['dashboard', 'sms', 'voice'], params: { value: 22 } },
  { id: 'al-2', type: 'animal', severity: 'crit', time: iso(5 * HOUR + 40 * MIN), channels: ['dashboard', 'call', 'sms'], params: { animal: 'Nilgai', zone: 'East fence' } },
  { id: 'al-3', type: 'pest', severity: 'warn', time: iso(9 * HOUR), channels: ['dashboard', 'sms'], params: { pest: 'Aphids' } },
  { id: 'al-4', type: 'powerOn', severity: 'ok', time: iso(11 * HOUR), channels: ['sms'] },
  { id: 'al-5', type: 'grainReady', severity: 'ok', time: iso(DAY + 2 * HOUR), channels: ['dashboard', 'sms'], params: { crop: 'Wheat' } },
  { id: 'al-6', type: 'heat', severity: 'warn', time: iso(DAY + 6 * HOUR), channels: ['dashboard', 'voice'], params: { value: 38 } },
]

const RECOMMENDATIONS: Recommendation[] = [
  { id: 'r1', kind: 'irrigation', priority: 'crit', textKey: 'irrigate', params: { min: 25, time: '06:00' }, to: 'irrigation' },
  { id: 'r2', kind: 'fertilizer', priority: 'warn', textKey: 'topdress', params: { bags: 1.5, name: 'Urea' }, to: 'fertilizer' },
  { id: 'r3', kind: 'pest', priority: 'warn', textKey: 'scout', params: { pest: 'Aphids' }, to: 'pest' },
  { id: 'r4', kind: 'market', priority: 'ok', textKey: 'sell', params: { crop: 'Wheat', mandi: 'Rajkot APMC' }, to: 'market' },
]

export function mockOverview(farmId: string): OverviewData {
  const series = makeSeries(farmId, 49, 30)
  const last = series.at(-1)!
  const first = series[0]
  const p = profile(farmId)
  const kpi = (id: Kpi['id'], value: number, unit: string, prev: number): Kpi => ({
    id,
    value,
    unit,
    status: statusFor[id](value),
    delta: round(value - prev, id === 'ph' || id === 'ec' ? 2 : 1),
  })
  return {
    kpis: [
      kpi('moisture', last.moisture, '%', first.moisture),
      kpi('temperature', last.temperature, '°C', first.temperature),
      kpi('humidity', last.humidity, '%', first.humidity),
      kpi('ph', last.ph, '', first.ph),
      kpi('ec', last.ec, 'dS/m', first.ec),
      kpi('battery', p.battery, '%', p.battery + 3),
    ],
    series24h: series,
    recommendations: farmId === 'farm-main' ? RECOMMENDATIONS : RECOMMENDATIONS.slice(1),
    alerts: MOCK_ALERTS.slice(0, 4),
    weather: MOCK_WEATHER,
    pump: { on: false, autoMode: true, since: null, trigger: null },
  }
}

/* ---------- soil ---------- */

export function mockSoil(farmId: string): SoilData {
  const history30 = makeSeries(farmId, 49, 30)
  const history15 = makeSeries(farmId, 25, 15)
  const last = history15.at(-1)!
  return {
    live: { ...last, updatedAt: last.t },
    dryThreshold: 25,
    history15,
    history30,
    npk:
      farmId === 'farm-main'
        ? { n: 182, p: 21, k: 265, cardNumber: 'GJ/RJT/2025/004512', sampleDate: '2025-11-14' }
        : null,
  }
}

/* ---------- fertilizer & crops ---------- */

export const MOCK_FERTILIZER: FertilizerData = {
  crop: 'Groundnut',
  acres: 4,
  items: [
    { name: 'DAP', nutrient: '18-46-0', bagKg: 50, bagsPerAcre: 1, pricePerBag: 1350, timing: 'basal' },
    { name: 'MOP', nutrient: '0-0-60', bagKg: 50, bagsPerAcre: 0.5, pricePerBag: 1700, timing: 'basal' },
    { name: 'Gypsum', nutrient: 'Ca + S', bagKg: 50, bagsPerAcre: 4, pricePerBag: 180, timing: 'top30' },
    { name: 'Urea', nutrient: '46-0-0', bagKg: 45, bagsPerAcre: 0.5, pricePerBag: 267, timing: 'top45' },
  ],
  topCrops: [
    { id: 'groundnut', name: 'Groundnut', season: 'kharif', profitPerAcre: 38000, costPerAcre: 21000, yieldPerAcre: 9, suitability: 92, water: 'medium' },
    { id: 'cumin', name: 'Cumin', season: 'rabi', profitPerAcre: 34500, costPerAcre: 16000, yieldPerAcre: 2.6, suitability: 86, water: 'low' },
    { id: 'wheat', name: 'Wheat', season: 'rabi', profitPerAcre: 26000, costPerAcre: 18500, yieldPerAcre: 18, suitability: 81, water: 'medium' },
  ],
  avoid: [
    { name: 'Paddy', reasonKey: 'water' },
    { name: 'Sugarcane', reasonKey: 'salinity' },
    { name: 'Banana', reasonKey: 'ph' },
  ],
  tipKeys: ['fym', 'gypsum', 'greenManure', 'rotation'],
}

/* ---------- crop doctor ---------- */

export const MOCK_DISEASES: DiseaseDiagnosis[] = [
  {
    id: 'early-blight',
    crop: 'Tomato',
    disease: {
      en: 'Early blight (Alternaria solani)',
      hi: 'अगेती झुलसा (अल्टरनेरिया सोलानी)',
      gu: 'વહેલો સુકારો (અલ્ટરનેરિયા સોલાની)',
    },
    confidence: 0.92,
    severity: 'warn',
    treatment: {
      en: [
        'Remove and destroy the lower infected leaves today.',
        'Spray Mancozeb 75% WP at 2.5 g per litre of water (≈ 500 g per acre).',
        'Repeat after 10 days if new spots appear.',
        'Avoid overhead irrigation; water at the base in the morning.',
      ],
      hi: [
        'आज ही नीचे की संक्रमित पत्तियाँ तोड़कर नष्ट करें।',
        'मैनकोज़ेब 75% WP, 2.5 ग्राम प्रति लीटर पानी में छिड़कें (≈ 500 ग्राम प्रति एकड़)।',
        'नए धब्बे दिखें तो 10 दिन बाद दोबारा छिड़कें।',
        'ऊपर से पानी न दें; सुबह जड़ के पास सिंचाई करें।',
      ],
      gu: [
        'આજે જ નીચેનાં રોગવાળાં પાન તોડીને નાશ કરો.',
        'મેન્કોઝેબ 75% WP, 2.5 ગ્રામ પ્રતિ લિટર પાણીમાં છાંટો (≈ 500 ગ્રામ એકર દીઠ).',
        'નવા ડાઘ દેખાય તો 10 દિવસ પછી ફરી છાંટો.',
        'ઉપરથી પાણી ન આપો; સવારે છોડના થડ પાસે પિયત કરો.',
      ],
    },
    voice: {
      en: 'Early blight found on tomato. Remove lower infected leaves and spray Mancozeb, two and a half grams per litre. Repeat after ten days.',
      hi: 'टमाटर में अगेती झुलसा रोग मिला है। नीचे की संक्रमित पत्तियाँ हटाएँ और मैनकोज़ेब ढाई ग्राम प्रति लीटर पानी में छिड़कें। दस दिन बाद दोबारा छिड़कें।',
      gu: 'ટામેટામાં વહેલો સુકારો જોવા મળ્યો છે. નીચેનાં રોગવાળાં પાન કાઢી નાખો અને મેન્કોઝેબ અઢી ગ્રામ પ્રતિ લિટર પાણીમાં છાંટો. દસ દિવસ પછી ફરી છાંટો.',
    },
  },
  {
    id: 'leaf-spot',
    crop: 'Groundnut',
    disease: {
      en: 'Tikka leaf spot (Cercospora)',
      hi: 'टिक्का पत्ती धब्बा (सर्कोस्पोरा)',
      gu: 'ટિક્કા પાનનાં ટપકાં (સર્કોસ્પોરા)',
    },
    confidence: 0.87,
    severity: 'warn',
    treatment: {
      en: [
        'Spray Carbendazim 12% + Mancozeb 63% WP at 2 g per litre.',
        'Use 200 litres of spray solution per acre.',
        'Repeat after 15 days; stop 3 weeks before harvest.',
      ],
      hi: [
        'कार्बेन्डाज़िम 12% + मैनकोज़ेब 63% WP, 2 ग्राम प्रति लीटर छिड़कें।',
        'प्रति एकड़ 200 लीटर घोल का उपयोग करें।',
        '15 दिन बाद दोबारा छिड़कें; कटाई से 3 हफ़्ते पहले बंद करें।',
      ],
      gu: [
        'કાર્બેન્ડાઝીમ 12% + મેન્કોઝેબ 63% WP, 2 ગ્રામ પ્રતિ લિટર છાંટો.',
        'એકર દીઠ 200 લિટર દ્રાવણ વાપરો.',
        '15 દિવસ પછી ફરી છાંટો; કાપણીના 3 અઠવાડિયાં પહેલાં બંધ કરો.',
      ],
    },
    voice: {
      en: 'Tikka leaf spot found on groundnut. Spray Carbendazim plus Mancozeb, two grams per litre. Repeat after fifteen days.',
      hi: 'मूँगफली में टिक्का पत्ती धब्बा रोग मिला है। कार्बेन्डाज़िम और मैनकोज़ेब दो ग्राम प्रति लीटर छिड़कें। पंद्रह दिन बाद दोबारा छिड़कें।',
      gu: 'મગફળીમાં ટિક્કા પાનનાં ટપકાંનો રોગ જોવા મળ્યો છે. કાર્બેન્ડાઝીમ અને મેન્કોઝેબ બે ગ્રામ પ્રતિ લિટર છાંટો. પંદર દિવસ પછી ફરી છાંટો.',
    },
  },
  {
    id: 'healthy',
    crop: 'Cotton',
    disease: { en: 'Healthy leaf', hi: 'स्वस्थ पत्ती', gu: 'તંદુરસ્ત પાન' },
    confidence: 0.95,
    severity: 'ok',
    treatment: {
      en: ['No disease found. Keep monitoring every 3–4 days.'],
      hi: ['कोई रोग नहीं मिला। हर 3–4 दिन में जाँच करते रहें।'],
      gu: ['કોઈ રોગ જોવા મળ્યો નથી. દર 3–4 દિવસે તપાસ ચાલુ રાખો.'],
    },
    voice: {
      en: 'The leaf looks healthy. No spray is needed.',
      hi: 'पत्ती स्वस्थ है। किसी छिड़काव की ज़रूरत नहीं है।',
      gu: 'પાન તંદુરસ્ત છે. કોઈ છંટકાવની જરૂર નથી.',
    },
  },
]

/* ---------- pest watch ---------- */

export const MOCK_PESTS: PestDiagnosis[] = [
  {
    id: 'aphid',
    pest: { en: 'Aphids (Aphis craccivora)', hi: 'माहू (एफ़िस क्रैसिवोरा)', gu: 'મોલો-મશી (એફિસ ક્રેસીવોરા)' },
    crop: 'Groundnut',
    confidence: 0.9,
    severity: 'warn',
    dose: {
      product: 'Imidacloprid 17.8% SL',
      perAcre: { en: '40 ml', hi: '40 मिली', gu: '40 મિલિ' },
      water: { en: '200 L', hi: '200 लीटर', gu: '200 લિટર' },
    },
    threshold: {
      en: 'Economic threshold: 10–15 aphids per shoot tip',
      hi: 'आर्थिक सीमा: प्रति टहनी सिरे पर 10–15 माहू',
      gu: 'આર્થિક મર્યાદા: ડૂંખ દીઠ 10–15 મોલો',
    },
    voice: {
      en: 'Aphids found. Spray Imidacloprid, forty millilitres in two hundred litres of water per acre.',
      hi: 'माहू कीट मिला है। इमिडाक्लोप्रिड चालीस मिलीलीटर, दो सौ लीटर पानी में प्रति एकड़ छिड़कें।',
      gu: 'મોલોમશી જીવાત જોવા મળી છે. ઇમિડાક્લોપ્રિડ ચાલીસ મિલિ, બસો લિટર પાણીમાં એકર દીઠ છાંટો.',
    },
  },
  {
    id: 'pink-bollworm',
    pest: { en: 'Pink bollworm', hi: 'गुलाबी सुंडी', gu: 'ગુલાબી ઈયળ' },
    crop: 'Cotton',
    confidence: 0.86,
    severity: 'crit',
    dose: {
      product: 'Emamectin benzoate 5% SG',
      perAcre: { en: '80 g', hi: '80 ग्राम', gu: '80 ગ્રામ' },
      water: { en: '200 L', hi: '200 लीटर', gu: '200 લિટર' },
    },
    threshold: {
      en: 'Economic threshold: 8 moths per trap per night for 3 nights',
      hi: 'आर्थिक सीमा: लगातार 3 रात, प्रति ट्रैप प्रति रात 8 पतंगे',
      gu: 'આર્થિક મર્યાદા: સતત 3 રાત, ટ્રેપ દીઠ રાત્રે 8 ફૂદાં',
    },
    voice: {
      en: 'Pink bollworm found. Spray Emamectin benzoate, eighty grams in two hundred litres of water per acre, and install five pheromone traps.',
      hi: 'गुलाबी सुंडी मिली है। इमामेक्टिन बेंजोएट अस्सी ग्राम, दो सौ लीटर पानी में प्रति एकड़ छिड़कें और पाँच फेरोमोन ट्रैप लगाएँ।',
      gu: 'ગુલાબી ઇયળ જોવા મળી છે. એમામેક્ટિન બેન્ઝોએટ એંસી ગ્રામ, બસો લિટર પાણીમાં એકર દીઠ છાંટો અને પાંચ ફેરોમોન ટ્રેપ લગાવો.',
    },
  },
]

export function mockPestWatch(farmId: string): PestWatchData {
  const rand = rng(seedOf(farmId) + 99)
  const trend = Array.from({ length: 30 }, (_, i) => {
    const wave = Math.max(0, Math.sin((i / 29) * Math.PI * 1.15 - 0.4))
    const village = Math.round(2 + wave * 14 + rand() * 3)
    return {
      date: iso((29 - i) * DAY),
      village,
      yourFarm: Math.max(0, Math.round(village / 4 + (rand() - 0.5) * 2)),
    }
  })
  const farms: NearbyFarm[] = Array.from({ length: 48 }, (_, i) => {
    const x = i % 8
    const y = Math.floor(i / 8)
    // hotspot to the north-east of the village
    const dist = Math.hypot(x - 6, y - 1)
    const score = Math.max(0, 3.4 - dist * 0.7 + (rand() - 0.5) * 1.2)
    return { id: `f${i}`, level: Math.min(3, Math.round(score)) as NearbyFarm['level'], you: i === 27 }
  })
  return {
    pest: 'Aphids',
    trend,
    farms,
    recentScans: [
      { id: 's1', pest: 'Aphids', time: iso(9 * HOUR), severity: 'warn' },
      { id: 's2', pest: 'Thrips', time: iso(4 * DAY), severity: 'ok' },
    ],
  }
}

/* ---------- irrigation ---------- */

export function mockIrrigation(farmId: string): IrrigationData {
  const p = profile(farmId)
  const tomorrow6 = new Date(NOW + DAY)
  tomorrow6.setHours(6, 0, 0, 0)
  return {
    plan: {
      minutes: farmId === 'farm-main' ? 25 : 15,
      startAt: tomorrow6.toISOString(),
      litres: farmId === 'farm-main' ? 30000 : 15000,
      reasons: [
        { id: 'moisture', params: { value: p.moistureNow, min: 30, max: 35 }, status: p.moistureNow < 25 ? 'crit' : 'ok' },
        { id: 'weather', params: { days: 2, temp: 34 }, status: 'warn' },
        { id: 'soil', params: { term: MOCK_FARMS.find((f) => f.id === farmId)?.soilType ?? 'Medium black' }, status: 'ok' },
        { id: 'stage', params: { term: MOCK_FARMS.find((f) => f.id === farmId)?.cropStage ?? 'Flowering' }, status: 'warn' },
      ],
    },
    pump: { on: false, autoMode: true, since: null, trigger: null },
    powerAvailable: true,
    history: [
      { id: 'p1', start: iso(DAY + 17 * HOUR), minutes: 30, litres: 36000, trigger: 'auto', result: 'completed' },
      { id: 'p2', start: iso(3 * DAY + 18 * HOUR), minutes: 22, litres: 26400, trigger: 'missedCall', result: 'completed' },
      { id: 'p3', start: iso(4 * DAY + 7 * HOUR), minutes: 6, litres: 4800, trigger: 'manual', result: 'dryRunTrip' },
      { id: 'p4', start: iso(6 * DAY + 17 * HOUR), minutes: 35, litres: 42000, trigger: 'auto', result: 'completed' },
      { id: 'p5', start: iso(8 * DAY + 6 * HOUR), minutes: 18, litres: 21600, trigger: 'sms', result: 'stoppedEarly' },
    ],
  }
}

/* ---------- wildlife ---------- */

const ir = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=480&q=60`

export const MOCK_WILDLIFE: WildlifeEvent[] = [
  { id: 'w1', animal: 'nilgai', count: 3, time: iso(5 * HOUR + 40 * MIN), confidence: 0.94, image: ir('1484406566174-9da000fda645'), zone: 'East fence', severity: 'crit', actions: ['siren', 'strobe', 'call', 'sms', 'photo'] },
  { id: 'w2', animal: 'boar', count: 2, time: iso(DAY + 4 * HOUR), confidence: 0.89, image: ir('1516467508483-a7212febe31a'), zone: 'North boundary', severity: 'crit', actions: ['siren', 'strobe', 'call', 'photo'] },
  { id: 'w3', animal: 'cattle', count: 1, time: iso(2 * DAY + 3 * HOUR), confidence: 0.97, image: ir('1570042225831-d98fa7577f1e'), zone: 'Gate', severity: 'warn', actions: ['siren', 'sms', 'photo'] },
  { id: 'w4', animal: 'jackal', count: 1, time: iso(3 * DAY + 5 * HOUR), confidence: 0.71, image: ir('1474511320723-9a56873867b5'), zone: 'Pump house', severity: 'ok', actions: ['photo'] },
  { id: 'w5', animal: 'deer', count: 2, time: iso(5 * DAY + 2 * HOUR), confidence: 0.83, image: ir('1543946207-39bd91e70ca7'), zone: 'East fence', severity: 'warn', actions: ['siren', 'strobe', 'sms', 'photo'] },
]

/* ---------- market & grain ---------- */

export function mockMarket(): MarketData {
  const rand = rng(4242)
  return {
    grains: [
      { crop: 'Wheat', moisture: 11.6, safeMax: 12, quantityQ: 38, dryingPerDay: 0.8 },
      { crop: 'Groundnut', moisture: 10.4, safeMax: 8, quantityQ: 22, dryingPerDay: 1.2 },
    ],
    mandi: [
      { crop: 'Wheat', mandi: 'Rajkot APMC', distanceKm: 18, price: 2560, change: 2.4 },
      { crop: 'Wheat', mandi: 'Gondal APMC', distanceKm: 34, price: 2510, change: 0.8 },
      { crop: 'Wheat', mandi: 'Jasdan APMC', distanceKm: 26, price: 2465, change: -1.1 },
      { crop: 'Groundnut', mandi: 'Gondal APMC', distanceKm: 34, price: 6820, change: 3.1 },
      { crop: 'Groundnut', mandi: 'Rajkot APMC', distanceKm: 18, price: 6740, change: 1.2 },
      { crop: 'Cotton', mandi: 'Rajkot APMC', distanceKm: 18, price: 7350, change: -0.6 },
      { crop: 'Cumin', mandi: 'Unjha APMC', distanceKm: 245, price: 23800, change: -2.8 },
    ],
    best: { crop: 'Wheat', mandi: 'Rajkot APMC', date: isoAhead(2 * DAY), price: 2560, extraPerQ: 95 },
    trend: Array.from({ length: 14 }, (_, i) => ({
      date: iso((13 - i) * DAY),
      price: Math.round(2440 + i * 9 + (rand() - 0.5) * 40),
      msp: 2425,
    })),
  }
}

/* ---------- mesh ---------- */

export const MOCK_MESH: MeshData = {
  nodes: [
    { id: 'GW', name: 'Gateway · Pump house', x: 12, y: 50, gateway: true, online: true, battery: 91, rssi: -48, lastSeenMin: 0 },
    { id: 'AS-01', name: 'AS-01 · Main farm', x: 34, y: 22, online: true, battery: 86, rssi: -61, lastSeenMin: 1 },
    { id: 'AS-03', name: 'AS-03 · Well', x: 36, y: 76, online: true, battery: 72, rssi: -66, lastSeenMin: 2 },
    { id: 'AS-04', name: 'AS-04 · Middle', x: 58, y: 48, online: true, battery: 68, rssi: -70, lastSeenMin: 1 },
    { id: 'AS-05', name: 'AS-05 · North', x: 64, y: 14, online: true, battery: 80, rssi: -73, lastSeenMin: 3 },
    { id: 'AS-02', name: 'AS-02 · River plot', x: 86, y: 40, online: true, battery: 64, rssi: -78, lastSeenMin: 4 },
    { id: 'AS-06', name: 'AS-06 · South', x: 80, y: 82, online: true, battery: 57, rssi: -81, lastSeenMin: 2 },
  ],
  links: [
    ['GW', 'AS-01'],
    ['GW', 'AS-03'],
    ['AS-01', 'AS-04'],
    ['AS-03', 'AS-04'],
    ['AS-01', 'AS-05'],
    ['AS-05', 'AS-02'],
    ['AS-04', 'AS-02'],
    ['AS-04', 'AS-06'],
    ['AS-03', 'AS-06'],
  ],
}

/* ---------- alerts & SMS ---------- */

/** SMS templates the backend sends; {{x}} is replaced with alert params */
export const SMS_TEMPLATES: Record<AlertType, Localized> = {
  soilDry: {
    en: 'KhetMitra: Soil moisture {{value}}% - too dry. Irrigate {{min}} min. Reply 1 to start pump.',
    hi: 'KhetMitra: मिट्टी की नमी {{value}}% - बहुत सूखी। {{min}} मिनट सिंचाई करें। पंप चालू करने के लिए 1 भेजें।',
    gu: 'KhetMitra: જમીનનો ભેજ {{value}}% - બહુ સૂકી. {{min}} મિનિટ પિયત કરો. પંપ ચાલુ કરવા 1 મોકલો.',
  },
  animal: {
    en: 'KhetMitra ALERT: {{animal}} near {{zone}} at {{time}}. Siren ON. Photo: agri.link/p/4812',
    hi: 'KhetMitra चेतावनी: {{time}} पर {{zone}} के पास {{animal}}। सायरन चालू। फ़ोटो: agri.link/p/4812',
    gu: 'KhetMitra ચેતવણી: {{time}} વાગ્યે {{zone}} પાસે {{animal}}. સાયરન ચાલુ. ફોટો: agri.link/p/4812',
  },
  pest: {
    en: 'KhetMitra: {{pest}} rising in your village. Check your crop. Spray only if above threshold.',
    hi: 'KhetMitra: आपके गाँव में {{pest}} बढ़ रहा है। फ़सल जाँचें। सीमा से ऊपर हो तभी छिड़काव करें।',
    gu: 'KhetMitra: તમારા ગામમાં {{pest}} વધી રહી છે. પાક તપાસો. મર્યાદાથી વધુ હોય તો જ છંટકાવ કરો.',
  },
  disease: {
    en: 'KhetMitra: Disease risk high (humid nights). Inspect leaves today.',
    hi: 'KhetMitra: रोग का खतरा ज़्यादा (नम रातें)। आज पत्तियाँ जाँचें।',
    gu: 'KhetMitra: રોગનું જોખમ વધુ (ભેજવાળી રાતો). આજે પાન તપાસો.',
  },
  pumpOn: {
    en: 'KhetMitra: Pump started ({{min}} min). Reply 0 to stop.',
    hi: 'KhetMitra: पंप चालू ({{min}} मिनट)। बंद करने के लिए 0 भेजें।',
    gu: 'KhetMitra: પંપ ચાલુ ({{min}} મિનિટ). બંધ કરવા 0 મોકલો.',
  },
  pumpOff: {
    en: 'KhetMitra: Pump stopped. Water used: {{litres}} L.',
    hi: 'KhetMitra: पंप बंद। पानी उपयोग: {{litres}} लीटर।',
    gu: 'KhetMitra: પંપ બંધ. પાણી વપરાશ: {{litres}} લિટર.',
  },
  powerOn: {
    en: 'KhetMitra: Farm electricity is ON now.',
    hi: 'KhetMitra: खेत में बिजली अभी आ गई है।',
    gu: 'KhetMitra: ખેતરમાં હમણાં વીજળી આવી છે.',
  },
  grainReady: {
    en: 'KhetMitra: {{crop}} moisture OK. Best price at {{mandi}}.',
    hi: 'KhetMitra: {{crop}} की नमी ठीक है। सबसे अच्छा भाव {{mandi}} में।',
    gu: 'KhetMitra: {{crop}}નો ભેજ બરાબર છે. શ્રેષ્ઠ ભાવ {{mandi}}માં.',
  },
  batteryLow: {
    en: 'KhetMitra: Station battery {{value}}%. Clean the solar panel.',
    hi: 'KhetMitra: स्टेशन बैटरी {{value}}%। सोलर पैनल साफ़ करें।',
    gu: 'KhetMitra: સ્ટેશન બેટરી {{value}}%. સોલર પેનલ સાફ કરો.',
  },
  nodeOffline: {
    en: 'KhetMitra: Station {{node}} offline. Data rerouted via mesh.',
    hi: 'KhetMitra: स्टेशन {{node}} बंद। डेटा मेश से दूसरे रास्ते भेजा गया।',
    gu: 'KhetMitra: સ્ટેશન {{node}} બંધ. ડેટા મેશથી બીજા રસ્તે મોકલ્યો.',
  },
  heat: {
    en: 'KhetMitra: Heat stress {{value}}°C expected. Irrigate in the evening.',
    hi: 'KhetMitra: {{value}}°C गर्मी का तनाव संभव। शाम को सिंचाई करें।',
    gu: 'KhetMitra: {{value}}°C ગરમીનો તણાવ શક્ય. સાંજે પિયત કરો.',
  },
}

export const SMS_SAMPLE_PARAMS: Record<string, string | number> = {
  value: 22,
  min: 25,
  animal: 'Nilgai',
  zone: 'East fence',
  time: '02:14',
  pest: 'Aphids',
  litres: '30,000',
  crop: 'Wheat',
  mandi: 'Rajkot APMC',
  node: 'AS-04',
}

const LOG_TYPES: [AlertType, 'sms' | 'call', MessageLog['status'], number][] = [
  ['soilDry', 'sms', 'delivered', 18 * MIN],
  ['animal', 'call', 'delivered', 5 * HOUR + 40 * MIN],
  ['animal', 'sms', 'delivered', 5 * HOUR + 39 * MIN],
  ['pest', 'sms', 'failed', 9 * HOUR],
  ['powerOn', 'sms', 'delivered', 11 * HOUR],
  ['pumpOn', 'sms', 'pending', 11 * HOUR + 2 * MIN],
  ['grainReady', 'sms', 'delivered', DAY + 2 * HOUR],
  ['heat', 'call', 'failed', DAY + 6 * HOUR],
  ['nodeOffline', 'sms', 'delivered', 2 * DAY],
]

export const MOCK_MESSAGE_LOG: MessageLog[] = LOG_TYPES.map(([type, channel, status, ago], i) => ({
  id: `m${i + 1}`,
  time: iso(ago),
  channel,
  type,
  to: MOCK_FARMER.phone,
  lang: i % 3 === 1 ? 'hi' : 'gu',
  status,
  attempts: status === 'failed' ? 3 : 1,
}))

export const MOCK_ALERT_ROUTING: AlertRoute[] = [
  { type: 'soilDry', sms: true, call: false },
  { type: 'animal', sms: true, call: true },
  { type: 'pest', sms: true, call: false },
  { type: 'disease', sms: true, call: false },
  { type: 'pumpOn', sms: true, call: false },
  { type: 'powerOn', sms: true, call: false },
  { type: 'grainReady', sms: true, call: false },
  { type: 'heat', sms: false, call: true },
  { type: 'batteryLow', sms: true, call: false },
  { type: 'nodeOffline', sms: false, call: false },
]
