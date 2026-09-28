import { m } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/motion'
import { EASE_CALM } from '@/lib/motion'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { StageCard } from '@/components/StageCard'
import { FEATURES } from '@/data/landing'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { pad2 } from '@/lib/utils'
import { FeaturePreview } from './FeaturePreviews'

/** All 12 features as cards: icon, 1-line benefit and a live-looking mock preview */
export function Features() {
  const { t } = useTranslation()
  const { data } = useApi(api.getStationSnapshot)

  return (
    <StageCard id="features" tone="mist">
      <div className="container py-16 sm:py-20 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
          <Reveal>
            <SectionEyebrow>{t('features.eyebrow')}</SectionEyebrow>
            <h2 className="heading-display mt-5 text-display-sm sm:text-display-md">{t('features.title')}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-md text-sm leading-relaxed text-ink/60 sm:text-body">{t('features.body')}</p>
          </Reveal>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-4">
          {FEATURES.map(({ id, icon: Icon }, i) => {
            return (
              <m.li
                key={id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                transition={{ duration: 0.8, ease: EASE_CALM, delay: (i % 3) * 0.08 }}
                className="group flex flex-col rounded-card border border-white bg-white/70 p-5 shadow-[0_1px_0_rgba(11,13,10,0.04)] transition-[background-color,box-shadow,transform] duration-500 ease-calm hover:-translate-y-1 hover:bg-white hover:shadow-glass"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-olive-deep text-lime">
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="font-mono text-caption text-ink/60">{pad2(i + 1)}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight">{t(`features.items.${id}.title`)}</h3>
                <p className="mt-1.5 text-body-sm leading-relaxed text-ink/60">{t(`features.items.${id}.benefit`)}</p>

                <div className="mt-5 min-h-[132px] flex-1 rounded-xl border border-ink/5 bg-mist-light p-3">
                  {data ? (
                    <FeaturePreview id={id} data={data} />
                  ) : (
                    <div className="space-y-2">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-ink/5" />
                      <div className="h-4 w-full animate-pulse rounded bg-ink/5" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-ink/5" />
                    </div>
                  )}
                </div>
              </m.li>
            )
          })}
        </ul>
        <p className="mt-4 text-right text-caption text-ink/60">{t('common.mock')}</p>
      </div>
    </StageCard>
  )
}
