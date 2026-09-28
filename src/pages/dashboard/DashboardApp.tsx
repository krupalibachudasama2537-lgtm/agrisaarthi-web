import { lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

// every page is its own chunk – charts, tables etc. load only when that page opens
const OverviewPage = lazy(() => import('./OverviewPage'))
const SoilPage = lazy(() => import('./SoilPage'))
const CropDoctorPage = lazy(() => import('./CropDoctorPage'))
const PestWatchPage = lazy(() => import('./PestWatchPage'))
const IrrigationPage = lazy(() => import('./IrrigationPage'))
const FertilizerPage = lazy(() => import('./FertilizerPage'))
const WildlifePage = lazy(() => import('./WildlifePage'))
const MarketPage = lazy(() => import('./MarketPage'))
const StationsPage = lazy(() => import('./StationsPage'))
const AlertsPage = lazy(() => import('./AlertsPage'))
const SettingsPage = lazy(() => import('./SettingsPage'))

/** Farmer dashboard routes, mounted at /dashboard/* */
export default function DashboardApp() {
  // suspends until the dashboard dictionary ("dash" namespace) for the current language is loaded
  useTranslation('dash')

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="soil" element={<SoilPage />} />
        <Route path="crop-doctor" element={<CropDoctorPage />} />
        <Route path="pest" element={<PestWatchPage />} />
        <Route path="irrigation" element={<IrrigationPage />} />
        <Route path="fertilizer" element={<FertilizerPage />} />
        <Route path="wildlife" element={<WildlifePage />} />
        <Route path="market" element={<MarketPage />} />
        <Route path="stations" element={<StationsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
