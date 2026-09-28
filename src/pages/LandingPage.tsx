import { useTranslation } from 'react-i18next'
import { Navbar } from '@/components/Navbar'
import { SmoothScroll } from '@/components/SmoothScroll'
import { AboutDark } from '@/components/landing/AboutDark'
import { Cta } from '@/components/landing/Cta'
import { DetectionToAction } from '@/components/landing/DetectionToAction'
import { Economics } from '@/components/landing/Economics'
import { Faq } from '@/components/landing/Faq'
import { Features } from '@/components/landing/Features'
import { Footer } from '@/components/landing/Footer'
import { Hardware } from '@/components/landing/Hardware'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { NatureBand } from '@/components/landing/NatureBand'
import { Team } from '@/components/landing/Team'

/**
 * Marketing landing page.
 * Section rhythm: misty light → full-bleed photo → near-black → white → …
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
        <NatureBand />
        <AboutDark />
        <HowItWorks />
        <DetectionToAction />
        <Economics />
        <Features />
        <Hardware />
        <Team />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  )
}
