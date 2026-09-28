import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const DashboardApp = lazy(() => import('@/pages/dashboard/DashboardApp'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    // LazyMotion + m.* components ship only the animation features we use (fade/slide/in-view)
    <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-svh bg-sage" />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard/*" element={<DashboardApp />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MotionConfig>
    </LazyMotion>
  )
}
