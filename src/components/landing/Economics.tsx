import { m } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { GlassCard, GlassLabel } from '@/components/GlassCard'
import { CountUp, ParallaxImage, Reveal } from '@/components/motion'
import { EASE_CALM } from '@/lib/motion'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { StageCard } from '@/components/StageCard'
import { Button } from '@/components/ui/button'
import { IMAGES } from '@/data/images'
import { ECONOMICS_CHIPS } from '@/data/landing'
import { scrollToId } from '@/lib/lenis'
import { cn } from '@/lib/utils'

const POINTS = ['one', 'two', 'three'] as const

/** White section: text left, tall photo right with glass stat chips */
export function Economics() {
  const { t } = useTranslation()

  return (
    <StageCard id="impact" tone="white">
      <div className="grid-crosses absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div className="container grid gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-24">
        <div>
          <Reveal>
            <SectionEyebrow>{t('econ.eyebrow')}</SectionEyebrow>
            <h2 className="heading-display mt-5 text-display-sm sm:text-display-md">{t('econ.title')}</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/60 sm:text-body">{t('econ.body')}</p>
          </Reveal>

          <ul className="mt-8 space-y-3">
            {POINTS.map((p, i) => (
              <m.li
                key={p}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                transition={{ duration: 0.8, ease: EASE_CALM, delay: 0.08 * i }}
                className="flex items-start gap-3 border-b border-ink/10 pb-3 text-body text-ink/80"
              >
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-olive-deep text-white">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {t(`econ.points.${p}`)}
              </m.li>
            ))}
          </ul>

          <Reveal delay={0.2} className="mt-8 flex flex-col items-start gap-3">
            <Button variant="deep" size="lg" onClick={() => scrollToId('demo')}>
              {t('econ.cta')}
              <ChevronRight />
            </Button>
            <p className="text-caption text-ink/60">* {t('common.indicative')}</p>
          </Reveal>
        </div>

        <Reveal className="relative mx-auto w-full max-w-[520px] lg:mx-0 lg:justify-self-end" y={40}>
          <ParallaxImage
            src={IMAGES.economics}
            alt=""
            strength={50}
            sizes="(min-width: 1024px) 520px, 100vw"
            className="aspect-[4/5] w-full rounded-card sm:aspect-[4/5.2]"
          />

          {ECONOMICS_CHIPS.map((chip, i) => (
            <GlassCard
              key={chip.id}
              tone="dark"
              initial={{ opacity: 0, x: chip.side === 'left' ? -16 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EASE_CALM, delay: 0.3 + i * 0.12 }}
              style={{ top: chip.top }}
              className={cn(
                'absolute rounded-xl border-white/30 bg-ink/35 px-3.5 py-2.5',
                chip.side === 'left' ? 'left-3 sm:-left-6' : 'right-3 sm:-right-6',
              )}
            >
              <p className="text-xl font-semibold leading-none tracking-tight sm:text-2xl">
                <CountUp to={chip.value} prefix={chip.prefix} suffix={chip.suffix} />
              </p>
              <GlassLabel className="mt-1.5 opacity-80">{t(`econ.chips.${chip.id}`)}</GlassLabel>
            </GlassCard>
          ))}
        </Reveal>
      </div>
    </StageCard>
  )
}
