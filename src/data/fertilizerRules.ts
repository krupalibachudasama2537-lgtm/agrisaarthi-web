/**
 * ICAR & Gujarat State Agricultural Universities (JAU / AAU / SDAU / NAU)
 * Scientific Fertilizer Recommendation Engine
 *
 * Rules:
 * 1. Base N:P:K doses (kg/ha) defined for major Gujarat crops with institutional citations.
 * 2. Soil test rating adjustments:
 *    - Low nutrient status (< threshold)  : +25% of recommended dose
 *    - Medium nutrient status (normal)    : 100% of recommended dose
 *    - High nutrient status (> threshold) : -25% of recommended dose
 * 3. Commercial fertilizer product conversions:
 *    - DAP: 18% N, 46% P2O5 (50 kg bag)
 *    - Urea: 46% N (45 kg bag)
 *    - MOP: 60% K2O (50 kg bag)
 *    - Gypsum: Ca + S for groundnut pegging (50 kg bag)
 * 4. Nitrogen credit: Accounts for Nitrogen supplied by DAP before calculating Urea.
 * 5. Outputs: Bags per acre and subsidized cost in INR.
 */

import type { CalculationSteps, FertilizerData, FertilizerPlanItem, NpkEntry } from './types'
import { MOCK_FERTILIZER } from './dashboard'

export interface IcarCropRule {
  id: string
  name: string
  nameGu: string
  nameHi: string
  /** Recommended base dose in kg/ha (N - P2O5 - K2O) */
  baseDose: { n: number; p: number; k: number }
  /** Institutional scientific reference */
  source: string
  /** Standard timing split */
  timing: {
    dap: 'basal'
    mop: 'basal'
    urea: 'basal' | 'top30' | 'top45'
  }
  /** Special amendments like Gypsum for Groundnut */
  gypsumBagsPerAcre?: number
}

/**
 * ICAR & State Agricultural Universities Recommended N:P:K Doses (kg/ha)
 * for common Gujarat crops.
 */
export const GUJARAT_CROPS_ICAR: Record<string, IcarCropRule> = {
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    nameGu: 'ઘઉં',
    nameHi: 'गेहूँ',
    // ICAR-IIWBR (Indian Institute of Wheat & Barley Research) & AAU/JAU Package of Practices for Irrigated Wheat in Gujarat
    baseDose: { n: 120, p: 60, k: 0 },
    source: 'ICAR-IIWBR & JAU/AAU Package of Practices for Irrigated Wheat in Gujarat (120:60:0 kg/ha)',
    timing: { dap: 'basal', mop: 'basal', urea: 'top30' },
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton',
    nameGu: 'કપાસ',
    nameHi: 'कपास',
    // ICAR-CICR (Central Institute for Cotton Research, Nagpur) & JAU Package of Practices for Hybrid/Bt Cotton in Saurashtra & Gujarat
    baseDose: { n: 160, p: 50, k: 50 },
    source: 'ICAR-CICR & JAU Package of Practices for Hybrid/Bt Cotton in Gujarat (160:50:50 kg/ha)',
    timing: { dap: 'basal', mop: 'basal', urea: 'top30' },
  },
  groundnut: {
    id: 'groundnut',
    name: 'Groundnut',
    nameGu: 'મગફળી',
    nameHi: 'मूंगफली',
    // ICAR-DGR (Directorate of Groundnut Research, Junagadh) & JAU Package of Practices for Semi-Spreading/Bunch Groundnut
    baseDose: { n: 25, p: 50, k: 0 },
    source: 'ICAR-DGR (Junagadh) & JAU Package of Practices for Groundnut (25:50:0 kg/ha + 200 kg/acre Gypsum)',
    timing: { dap: 'basal', mop: 'basal', urea: 'top45' },
    gypsumBagsPerAcre: 4, // 200 kg/acre (4 bags of 50 kg) at pegging (30-40 DAS) for pod filling & oil content
  },
  bajra: {
    id: 'bajra',
    name: 'Bajra',
    nameGu: 'બાજરી',
    nameHi: 'बाजरा',
    // ICAR-AICRP on Pearl Millet & SDAU/AAU Package of Practices for Gujarat Pearl Millet
    baseDose: { n: 80, p: 40, k: 0 },
    source: 'ICAR-AICRP on Pearl Millet & SDAU/AAU Package of Practices for Gujarat (80:40:0 kg/ha)',
    timing: { dap: 'basal', mop: 'basal', urea: 'top30' },
  },
  castor: {
    id: 'castor',
    name: 'Castor',
    nameGu: 'એરંડા',
    nameHi: 'अरंडी',
    // ICAR-IIOR (Indian Institute of Oilseeds Research) & SDAU Main Castor Research Station (Sardarkrushinagar)
    baseDose: { n: 75, p: 50, k: 0 },
    source: 'ICAR-IIOR & SDAU Main Castor Research Station, Gujarat (75:50:0 kg/ha under irrigation)',
    timing: { dap: 'basal', mop: 'basal', urea: 'top30' },
  },
  cumin: {
    id: 'cumin',
    name: 'Cumin',
    nameGu: 'જીરું',
    nameHi: 'जीरा',
    // ICAR-NRCSS (National Research Centre on Seed Spices, Ajmer) & SDAU Seed Spices Research Station, Jagudan (Gujarat)
    baseDose: { n: 30, p: 15, k: 0 },
    source: 'ICAR-NRCSS & SDAU Seed Spices Research Station, Jagudan (30:15:0 kg/ha)',
    timing: { dap: 'basal', mop: 'basal', urea: 'top30' },
  },
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    nameGu: 'ટામેટા',
    nameHi: 'टमाटर',
    // ICAR-IIVR (Indian Institute of Vegetable Research) & AAU Horticultural Research Station, Anand
    baseDose: { n: 150, p: 75, k: 75 },
    source: 'ICAR-IIVR & AAU Horticultural Research Station, Anand (150:75:75 kg/ha for Hybrid Tomato)',
    timing: { dap: 'basal', mop: 'basal', urea: 'top30' },
  },
  potato: {
    id: 'potato',
    name: 'Potato',
    nameGu: 'બટાકા',
    nameHi: 'आलू',
    // ICAR-CPRI (Central Potato Research Institute) & SDAU Potato Research Station, Deesa (Banaskantha)
    baseDose: { n: 220, p: 110, k: 220 },
    source: 'ICAR-CPRI & SDAU Potato Research Station, Deesa (220:110:220 kg/ha for Kufri varieties)',
    timing: { dap: 'basal', mop: 'basal', urea: 'top30' },
  },
}

/**
 * Current Government Subsidized Fertilizer Prices in India (Editable Constants)
 * Urea: ₹266.50 / 45 kg bag (DBT subsidized MRP)
 * DAP: ₹1,350 / 50 kg bag (subsidized MRP)
 * MOP: ₹1,700 / 50 kg bag (subsidized MRP)
 * Gypsum: ₹180 / 50 kg bag (agricultural grade)
 */
export const FERTILIZER_PRICES = {
  urea: 267,
  dap: 1350,
  mop: 1700,
  gypsum: 180,
} as const

export type FertilizerPriceMap = typeof FERTILIZER_PRICES

/**
 * Standard Soil Health Card (DAC&FW, Govt of India) Rating Thresholds in kg/ha
 */
export const SOIL_RANGES = {
  n: { lowMax: 280, highMin: 560, unit: 'kg/ha' },
  p: { lowMax: 11, highMin: 25, unit: 'kg/ha' },
  k: { lowMax: 110, highMin: 280, unit: 'kg/ha' },
} as const

export type NutrientLevel = 'low' | 'medium' | 'high'

export interface SoilRatingInput {
  n?: number | NutrientLevel
  p?: number | NutrientLevel
  k?: number | NutrientLevel
}

/** Determines whether a nutrient test value is Low, Medium, or High */
export function getNutrientLevel(nutrient: 'n' | 'p' | 'k', input?: number | NutrientLevel | null): NutrientLevel {
  if (typeof input === 'string') {
    if (input === 'low' || input === 'high') return input
    return 'medium'
  }
  if (typeof input === 'number' && Number.isFinite(input)) {
    const range = SOIL_RANGES[nutrient]
    if (input < range.lowMax) return 'low'
    if (input > range.highMin) return 'high'
    return 'medium'
  }
  return 'medium'
}

/**
 * ICAR Soil test level adjustment factor:
 * - Low: +25% (1.25)
 * - Medium: 100% (1.00)
 * - High: -25% (0.75)
 */
export function getAdjustmentFactor(level: NutrientLevel): number {
  switch (level) {
    case 'low':
      return 1.25
    case 'high':
      return 0.75
    case 'medium':
    default:
      return 1.00
  }
}

/** 1 hectare = 2.47105 acres (1 acre = 0.404686 hectares) */
export const HA_TO_ACRE = 0.404686

export interface CalculatedFertilizerPlan extends FertilizerData {
  calculationSteps: CalculationSteps
}

const round = (val: number, decimals = 1) => {
  const factor = 10 ** decimals
  return Math.round(val * factor) / factor
}

/**
 * Computes exact ICAR fertilizer recommendation for a given crop and Soil Health Card NPK
 */
export function calculateFertilizerPlan(
  cropInput: string,
  soilInput?: SoilRatingInput | NpkEntry | null,
  acres = 4,
  prices: FertilizerPriceMap = FERTILIZER_PRICES,
): CalculatedFertilizerPlan {
  // Normalize crop lookup
  const cropKey = cropInput.toLowerCase().trim()
  const rule =
    GUJARAT_CROPS_ICAR[cropKey] ??
    Object.values(GUJARAT_CROPS_ICAR).find((c) => cropKey.includes(c.id)) ??
    GUJARAT_CROPS_ICAR.groundnut

  // Extract N, P, K levels
  const rawN = (soilInput as NpkEntry)?.n ?? (soilInput as SoilRatingInput)?.n
  const rawP = (soilInput as NpkEntry)?.p ?? (soilInput as SoilRatingInput)?.p
  const rawK = (soilInput as NpkEntry)?.k ?? (soilInput as SoilRatingInput)?.k

  const nLevel = getNutrientLevel('n', rawN)
  const pLevel = getNutrientLevel('p', rawP)
  const kLevel = getNutrientLevel('k', rawK)

  const nFactor = getAdjustmentFactor(nLevel)
  const pFactor = getAdjustmentFactor(pLevel)
  const kFactor = getAdjustmentFactor(kLevel)

  // 1. Adjusted Dose (kg/ha)
  const adjN_ha = round(rule.baseDose.n * nFactor, 1)
  const adjP_ha = round(rule.baseDose.p * pFactor, 1)
  const adjK_ha = round(rule.baseDose.k * kFactor, 1)

  // 2. Per-acre Requirement (kg/acre)
  const adjN_acre = round(adjN_ha * HA_TO_ACRE, 1)
  const adjP_acre = round(adjP_ha * HA_TO_ACRE, 1)
  const adjK_acre = round(adjK_ha * HA_TO_ACRE, 1)

  // 3. Product Conversions:
  // Step 3a: DAP (18% N, 46% P2O5) fulfills P2O5 first
  const dapKgPerAcre = adjP_acre > 0 ? round(adjP_acre / 0.46, 1) : 0
  const dapBagsPerAcre = dapKgPerAcre > 0 ? Math.max(0.5, round(dapKgPerAcre / 50, 1)) : 0
  const nFromDapKg = round(dapKgPerAcre * 0.18, 1)

  // Step 3b: Urea (46% N) fulfills remaining N
  const netNNeededKg = round(Math.max(0, adjN_acre - nFromDapKg), 1)
  const ureaKgPerAcre = netNNeededKg > 0 ? round(netNNeededKg / 0.46, 1) : 0
  const ureaBagsPerAcre = ureaKgPerAcre > 0 ? Math.max(0.5, round(ureaKgPerAcre / 45, 1)) : 0

  // Step 3c: MOP (60% K2O) fulfills K2O
  const mopKgPerAcre = adjK_acre > 0 ? round(adjK_acre / 0.60, 1) : 0
  const mopBagsPerAcre = mopKgPerAcre > 0 ? Math.max(0.5, round(mopKgPerAcre / 50, 1)) : 0

  // Build items list
  const items: FertilizerPlanItem[] = []

  if (dapBagsPerAcre > 0) {
    items.push({
      name: 'DAP',
      nutrient: '18-46-0',
      bagKg: 50,
      bagsPerAcre: dapBagsPerAcre,
      pricePerBag: prices.dap,
      timing: rule.timing.dap,
    })
  }

  if (mopBagsPerAcre > 0) {
    items.push({
      name: 'MOP',
      nutrient: '0-0-60',
      bagKg: 50,
      bagsPerAcre: mopBagsPerAcre,
      pricePerBag: prices.mop,
      timing: rule.timing.mop,
    })
  }

  if (rule.gypsumBagsPerAcre) {
    items.push({
      name: 'Gypsum',
      nutrient: 'Ca + S',
      bagKg: 50,
      bagsPerAcre: rule.gypsumBagsPerAcre,
      pricePerBag: prices.gypsum,
      timing: 'top30',
    })
  }

  if (ureaBagsPerAcre > 0) {
    items.push({
      name: 'Urea',
      nutrient: '46-0-0',
      bagKg: 45,
      bagsPerAcre: ureaBagsPerAcre,
      pricePerBag: prices.urea,
      timing: rule.timing.urea,
    })
  }

  // Cost calculations
  const dapCost = round(dapBagsPerAcre * prices.dap, 0)
  const ureaCost = round(ureaBagsPerAcre * prices.urea, 0)
  const mopCost = round(mopBagsPerAcre * prices.mop, 0)
  const gypsumCost = round((rule.gypsumBagsPerAcre ?? 0) * prices.gypsum, 0)
  const totalPerAcre = dapCost + ureaCost + mopCost + gypsumCost

  const percentLabel = (factor: number) => (factor === 1.25 ? '+25%' : factor === 0.75 ? '-25%' : '100%')

  const calculationSteps: CalculationSteps = {
    cropName: rule.name,
    source: rule.source,
    soilRatings: {
      n: {
        level: nLevel,
        value: typeof rawN === 'number' ? rawN : undefined,
        factor: nFactor,
        percentLabel: percentLabel(nFactor),
      },
      p: {
        level: pLevel,
        value: typeof rawP === 'number' ? rawP : undefined,
        factor: pFactor,
        percentLabel: percentLabel(pFactor),
      },
      k: {
        level: kLevel,
        value: typeof rawK === 'number' ? rawK : undefined,
        factor: kFactor,
        percentLabel: percentLabel(kFactor),
      },
    },
    baseDoseKgHa: rule.baseDose,
    adjustedDoseKgHa: { n: adjN_ha, p: adjP_ha, k: adjK_ha },
    perAcreRequirement: { n: adjN_acre, p: adjP_acre, k: adjK_acre },
    dapStep: {
      p2o5NeededKg: adjP_acre,
      dapKgPerAcre,
      dapBagsPerAcre,
      nSuppliedKg: nFromDapKg,
    },
    ureaStep: {
      totalNNeededKg: adjN_acre,
      nFromDapKg: nFromDapKg,
      netNNeededKg,
      ureaKgPerAcre,
      ureaBagsPerAcre,
    },
    mopStep: {
      k2oNeededKg: adjK_acre,
      mopKgPerAcre,
      mopBagsPerAcre,
    },
    costStep: {
      dapCost,
      ureaCost,
      mopCost,
      gypsumCost,
      totalPerAcre,
    },
  }

  return {
    crop: rule.name,
    acres,
    items,
    topCrops: MOCK_FERTILIZER.topCrops,
    avoid: MOCK_FERTILIZER.avoid,
    tipKeys: MOCK_FERTILIZER.tipKeys,
    calculationSteps,
  }
}
