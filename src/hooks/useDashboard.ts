import { createContext, useContext } from 'react'
import type { Farm, Farmer, StationHealth } from '@/data/types'

export interface DashboardContextValue {
  farmer: Farmer | null
  farms: Farm[]
  farm: Farm | null
  farmId: string
  setFarmId: (id: string) => void
  station: StationHealth | null
}

export const DashboardContext = createContext<DashboardContextValue | null>(null)

/** Current farmer, selected farm and station health for dashboard pages */
export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used inside <DashboardProvider>')
  return ctx
}
