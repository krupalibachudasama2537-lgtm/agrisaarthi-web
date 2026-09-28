/**
 * Placeholder imagery (royalty-free, Unsplash License).
 * Replace any URL here with your own photos – every section reads from this file.
 */
const unsplash = (id: string, w = 1600, q = 75) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`

const WIDTHS = [480, 768, 1080, 1440, 2000]

/**
 * Responsive srcset for an Unsplash URL (swaps the w= parameter).
 * Non-Unsplash URLs (your own photos) return undefined → plain src is used.
 */
export function srcSetFor(url: string, max = 2200) {
  if (!url.includes('images.unsplash.com')) return undefined
  return WIDTHS.filter((w) => w <= max)
    .map((w) => `${url.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`)
    .join(', ')
}

export const IMAGES = {
  /** Misty forest – blurred behind the light hero */
  heroMist: unsplash('1542273917363-3b1817f69a2d', 480, 40),
  /** Aerial crop rows – top face of the 3D farm plot */
  plotTop: unsplash('1535379453347-1ffd615e2e08', 900),
  /** Full-bleed nature band – field at dusk */
  natureBand: unsplash('1620200423727-8127f75d7f53', 2200),
  /** Near-black soil texture – dark "About" section */
  darkSoil: unsplash('1585314062340-f1a5a7c9328d', 2000),
  /** Hands in soil – inset inside the dark section */
  soilHands: unsplash('1590682680695-43b964a3ae17', 1000),

  /** How it works – one image per step */
  stepScan: unsplash('1563514227147-6d2ff665a6a0', 1400),
  stepAnalysis: unsplash('1597916829826-02e5bb4a54e0', 1400),
  stepAction: unsplash('1515150144380-bca9f1650ed9', 1400),

  /** From Detection to Action – three tall cards */
  detect: unsplash('1625246333195-78d9c38ad449', 900),
  decide: unsplash('1586771107445-d3ca888129ff', 900),
  act: unsplash('1628352081506-83c43123ed6d', 900),

  /** Better economics – tall photo */
  economics: unsplash('1559884743-74a57598c6c7', 1100),

  /** Feature previews */
  leaf: unsplash('1592982537447-7440770cbfc9', 400),

  /** Team / SIH band */
  team: unsplash('1574943320219-553eb213f72d', 1400),

  /** CTA background */
  cta: unsplash('1500382017468-9049fed747ef', 2200),

  /** Station illustration, cropped from ./reference workflow image */
  station: '/images/station.png',
} as const

export type ImageKey = keyof typeof IMAGES
