import { m } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ParallaxImage, Reveal } from '@/components/motion'
import { EASE_CALM } from '@/lib/motion'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { StageCard } from '@/components/StageCard'
import { DETECTION_CARDS } from '@/data/landing'
import { cn, pad2 } from '@/lib/utils'

/** Near-black section with three tall numbered image cards */
export function DetectionToAction() {
  const { t } = useTranslation()

  return (
    <StageCard id="detection" tone="ink">
      <div className="container py-16 sm:py-20 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
          <Reveal>
            <SectionEyebrow tone="dark">{t('detect.eyebrow')}</SectionEyebrow>
            <h2 className="heading-display mt-5 text-display-sm sm:text-display-md">{t('detect.title')}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-md text-sm leading-relaxed text-white/60 sm:text-body">{t('detect.body')}</p>
          </Reveal>
        </div>

        <ul className="mt-12 grid gap-4 md:grid-cols-3 lg:mt-16 lg:gap-5">
          {DETECTION_CARDS.map((card, i) => (
            <m.li
              key={card.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 1, ease: EASE_CALM, delay: i * 0.12 }}
              className={cn('group relative', i === 1 && 'md:mt-12')}
            >
              <article className="relative aspect-[3/4] overflow-hidden rounded-card ring-1 ring-white/10 md:aspect-[3/4.6]">
                <ParallaxImage
                  src={card.image}
                  alt=""
                  strength={40}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="absolute inset-0"
                  imgClassName="transition-transform [transition-duration:1400ms] ease-calm group-hover:scale-105"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-ink/10" />
                {/* thin inset outline */}
                <div aria-hidden className="absolute inset-3 rounded-xl border border-white/35 transition-colors duration-700 group-hover:border-white/70" />

                <span className="absolute left-6 top-6 font-mono text-xs text-white/85">[{pad2(i + 1)}]</span>

                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                  <h3 className="heading-display text-3xl text-white sm:text-4xl">{t(`detect.cards.${card.id}.title`)}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">{t(`detect.cards.${card.id}.body`)}</p>
                </div>
              </article>
            </m.li>
          ))}
        </ul>
      </div>
    </StageCard>
  )
}
