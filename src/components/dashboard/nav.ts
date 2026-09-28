import {
  Bug,
  Droplets,
  LayoutGrid,
  type LucideIcon,
  MessageSquareText,
  Network,
  PawPrint,
  Settings,
  Sprout,
  Stethoscope,
  TrendingUp,
  Waves,
} from 'lucide-react'

export interface NavItem {
  /** path relative to /dashboard ('' = index) */
  to: string
  key: string
  icon: LucideIcon
  section: 'sectionFarm' | 'sectionProtect' | 'sectionSystem'
  /** shown in the mobile bottom tab bar */
  mobile?: boolean
}

export const NAV: NavItem[] = [
  { to: '', key: 'overview', icon: LayoutGrid, section: 'sectionFarm', mobile: true },
  { to: 'soil', key: 'soil', icon: Droplets, section: 'sectionFarm', mobile: true },
  { to: 'crop-doctor', key: 'doctor', icon: Stethoscope, section: 'sectionFarm', mobile: true },
  { to: 'pest', key: 'pest', icon: Bug, section: 'sectionFarm' },
  { to: 'irrigation', key: 'irrigation', icon: Waves, section: 'sectionFarm', mobile: true },
  { to: 'fertilizer', key: 'fertilizer', icon: Sprout, section: 'sectionFarm' },
  { to: 'wildlife', key: 'wildlife', icon: PawPrint, section: 'sectionProtect' },
  { to: 'market', key: 'market', icon: TrendingUp, section: 'sectionProtect' },
  { to: 'stations', key: 'stations', icon: Network, section: 'sectionSystem' },
  { to: 'alerts', key: 'alerts', icon: MessageSquareText, section: 'sectionSystem' },
  { to: 'settings', key: 'settings', icon: Settings, section: 'sectionSystem' },
]

export const NAV_SECTIONS = ['sectionFarm', 'sectionProtect', 'sectionSystem'] as const

export const navPath = (to: string) => (to ? `/dashboard/${to}` : '/dashboard')
