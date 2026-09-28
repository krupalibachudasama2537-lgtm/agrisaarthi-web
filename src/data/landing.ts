import {
  Activity,
  Bell,
  Bug,
  CloudSun,
  Cpu,
  Droplets,
  FlaskConical,
  Leaf,
  type LucideIcon,
  Mic,
  Network,
  PawPrint,
  Radar,
  ShieldCheck,
  Sprout,
  Sun,
  Tractor,
  TrendingUp,
  WheatOff,
  Wheat,
  WifiOff,
  Landmark,
  Zap,
  Siren,
  Camera,
  Waves,
  Thermometer,
} from 'lucide-react'
import { IMAGES } from './images'
import type { FeatureId, HardwarePart, StatItem, StepItem, TeamMember } from './types'

/* ---------- 12 features (text lives in i18n: features.items.<id>) ---------- */

export interface FeatureMeta {
  id: FeatureId
  icon: LucideIcon
  /** wide cards span two columns on large screens */
  wide?: boolean
}

export const FEATURES: FeatureMeta[] = [
  { id: 'soil', icon: Droplets },
  { id: 'chemistry', icon: FlaskConical },
  { id: 'fertilizer', icon: Sprout },
  { id: 'crop', icon: Wheat },
  { id: 'disease', icon: Leaf },
  { id: 'pest', icon: Bug },
  { id: 'irrigation', icon: Waves },
  { id: 'mesh', icon: Network },
  { id: 'alerts', icon: Bell },
  { id: 'voice', icon: Mic },
  { id: 'animal', icon: PawPrint },
  { id: 'grain', icon: TrendingUp },
]

/* ---------- Badges ---------- */

export const BADGES: { id: 'solar' | 'mesh' | 'offline' | 'icar'; icon: LucideIcon }[] = [
  { id: 'solar', icon: Sun },
  { id: 'mesh', icon: Network },
  { id: 'offline', icon: WifiOff },
  { id: 'icar', icon: Landmark },
]

/* ---------- Dark "About" stat row ---------- */

export const ABOUT_STATS: (StatItem & { icon: LucideIcon })[] = [
  { id: 'water', value: 40, prefixKey: 'about.stats.upTo', suffix: '%', icon: Droplets },
  { id: 'cost', icon: WheatOff },
  { id: 'alerts', icon: Zap },
  { id: 'yield', icon: ShieldCheck },
]

/* ---------- How it works ---------- */

export const STEPS: StepItem[] = [
  { id: 'scan', image: IMAGES.stepScan },
  { id: 'analysis', image: IMAGES.stepAnalysis },
  { id: 'action', image: IMAGES.stepAction },
]

/** System flow: Data → AI → Alerts → Action → Outcome */
export const SYSTEM_FLOW: { id: 'collect' | 'process' | 'alerts' | 'action' | 'outcome'; icon: LucideIcon }[] = [
  { id: 'collect', icon: Radar },
  { id: 'process', icon: Cpu },
  { id: 'alerts', icon: Bell },
  { id: 'action', icon: Tractor },
  { id: 'outcome', icon: Sprout },
]

/* ---------- From Detection to Action ---------- */

export const DETECTION_CARDS: { id: 'detect' | 'decide' | 'act'; image: string }[] = [
  { id: 'detect', image: IMAGES.detect },
  { id: 'decide', image: IMAGES.decide },
  { id: 'act', image: IMAGES.act },
]

/* ---------- Better economics chips (indicative pilot targets) ---------- */

export const ECONOMICS_CHIPS: {
  id: 'fertilizer' | 'water' | 'profit' | 'alerts'
  value: number
  prefix: string
  suffix: string
  side: 'left' | 'right'
  top: string
}[] = [
  { id: 'fertilizer', value: 30, prefix: '-', suffix: '%', side: 'left', top: '10%' },
  { id: 'water', value: 40, prefix: '-', suffix: '%', side: 'right', top: '30%' },
  { id: 'profit', value: 18, prefix: '+', suffix: '%', side: 'left', top: '56%' },
  { id: 'alerts', value: 60, prefix: '<', suffix: 's', side: 'right', top: '78%' },
]

/* ---------- Hardware hotspots over IMAGES.station (percent coords) ---------- */

export const HARDWARE_PARTS: (HardwarePart & { icon: LucideIcon })[] = [
  { id: 'solar', x: 40, y: 8, icon: Sun },
  { id: 'weather', x: 23, y: 27, icon: CloudSun },
  { id: 'siren', x: 53, y: 21, icon: Siren },
  { id: 'camera', x: 51, y: 32, icon: Camera },
  { id: 'pir', x: 49, y: 40, icon: Activity },
  { id: 'zigbee', x: 57, y: 44, icon: Network },
  { id: 'controller', x: 37, y: 60, icon: Cpu },
  { id: 'probes', x: 29, y: 87, icon: Thermometer },
  { id: 'pump', x: 81, y: 84, icon: Droplets },
]

/* ---------- Team – add `name` for each member; until then a translated "Member n" is shown ---------- */

export const TEAM: TeamMember[] = [
  { roleKey: 'lead', initials: 'M1' },
  { roleKey: 'hardware', initials: 'M2' },
  { roleKey: 'ai', initials: 'M3' },
  { roleKey: 'web', initials: 'M4' },
  { roleKey: 'agronomy', initials: 'M5' },
  { roleKey: 'design', initials: 'M6' },
]

/* ---------- FAQ (text lives in i18n: faq.items.<id>) ---------- */

export const FAQ_IDS = ['offline', 'phone', 'npk', 'accuracy', 'power', 'cost', 'mesh'] as const
