import { BatteryMedium, Droplets, FlaskConical, type LucideIcon, Thermometer, Waves, Wind } from 'lucide-react'
import type { MetricId } from '@/data/types'

export const METRIC_ICON: Record<MetricId, LucideIcon> = {
  moisture: Droplets,
  temperature: Thermometer,
  humidity: Wind,
  ph: FlaskConical,
  ec: Waves,
  battery: BatteryMedium,
}
