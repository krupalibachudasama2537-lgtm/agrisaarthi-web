import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { DashboardProvider } from './DashboardProvider'
import { MobileTabBar } from './MobileTabBar'
import { Sidebar } from './Sidebar'
import { SpeechProvider } from './SpeechProvider'
import { PageSkeleton } from './states'
import { Topbar } from './Topbar'

/** Shell: sidebar (desktop) / bottom tab bar (mobile) + top bar + page outlet */
export function DashboardLayout() {
  const { pathname, search } = useLocation()
  const { t } = useTranslation()
  // normalise "/dashboard/" → "/dashboard" so nav highlighting matches
  if (pathname.length > 1 && pathname.endsWith('/')) return <Navigate to={pathname.replace(/\/+$/, '') + search} replace />
  return (
    <DashboardProvider>
      <SpeechProvider>
        <a href="#main" className="skip-link">
          {t('nav.skip')}
        </a>
        <div className="min-h-svh bg-surface text-ink">
          <Sidebar />
          <div className="lg:pl-64">
            <Topbar />
            {/* key on path so each page mounts fresh (and scroll resets) */}
            <main
              id="main"
              tabIndex={-1}
              key={pathname}
              className="mx-auto max-w-[1400px] px-4 pb-28 pt-5 outline-none sm:px-6 sm:pt-6 lg:px-8 lg:pb-12"
            >
              {/* pages are code-split; show a skeleton while a page chunk loads */}
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </main>
          </div>
          <MobileTabBar />
          <Toaster />
        </div>
      </SpeechProvider>
    </DashboardProvider>
  )
}
