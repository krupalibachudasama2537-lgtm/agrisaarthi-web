import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { DashboardContext } from '@/hooks/useDashboard'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { simulator } from '@/lib/simulator'

const FARM_KEY = 'agrisaarthi.farm'

function readFarm() {
  try {
    return localStorage.getItem(FARM_KEY) ?? 'farm-main'
  } catch {
    return 'farm-main'
  }
}

/** Loads farmer + farms once and tracks the selected farm/station */
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [farmId, setFarmIdState] = useState(readFarm)
  const { data: farmer } = useApi(api.getFarmer)
  const { data: farms } = useApi(api.getFarms)
  const { data: station, mutate: mutateStation } = useApi(() => api.getStationHealth(farmId), [farmId])

  useEffect(() => {
    return simulator.subscribe(() => {
      mutateStation(() => simulator.getStationHealth(farmId))
    })
  }, [farmId, mutateStation])

  const value = useMemo(() => {
    const list = farms ?? []
    return {
      farmer,
      farms: list,
      farm: list.find((f) => f.id === farmId) ?? null,
      farmId,
      setFarmId: (id: string) => {
        setFarmIdState(id)
        try {
          localStorage.setItem(FARM_KEY, id)
        } catch {
          // ignore
        }
      },
      station,
    }
  }, [farmer, farms, farmId, station])

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}
