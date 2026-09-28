import { useTranslation } from 'react-i18next'
import { Navbar } from '@/components/Navbar'
import { SmoothScroll } from '@/components/SmoothScroll'
import { AboutDark } from '@/components/landing/AboutDark'
import { Cta } from '@/components/landing/Cta'
import { DetectionToAction } from '@/components/landing/DetectionToAction'
import { Faq } from '@/components/landing/Faq'
import { Features } from '@/components/landing/Features'
import { Footer } from '@/components/landing/Footer'
import { Hardware } from '@/components/landing/Hardware'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'

/**
 * Marketing landing page.
 * Section rhythm: misty light → near-black → white → …
 */
export default function LandingPage() {
  const { t } = useTranslation()
  return (
    <>
      <SmoothScroll />
      <a href="#main" className="skip-link">
        {t('nav.skip')}
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <AboutDark />
        <Hardware />
        <HowItWorks />
        <DetectionToAction />
        <Features />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  )
}
