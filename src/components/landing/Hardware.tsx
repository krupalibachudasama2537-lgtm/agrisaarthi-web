import { AnimatePresence, m } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/motion'
import { EASE_CALM } from '@/lib/motion'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { StageCard } from '@/components/StageCard'
import { IMAGES } from '@/data/images'
import { BADGES, HARDWARE_PARTS } from '@/data/landing'
import { cn, pad2 } from '@/lib/utils'

/** Dark section: station illustration with numbered hotspots + parts list */
export function Hardware() {
  const { t } = useTranslation()
  const [active, setActive] = useState(HARDWARE_PARTS[0].id)
  const activePart = HARDWARE_PARTS.find((p) => p.id === active) ?? HARDWARE_PARTS[0]

  return (
    <StageCard id="hardware" tone="dark">
      <div className="container py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16">
          {/* illustration */}
          <Reveal y={40} className="order-2 lg:order-1">
            <div className="relative mx-auto aspect-[640/810] w-full max-w-[520px] overflow-hidden rounded-card bg-[#FCFCFA]">
              <img
                src={IMAGES.station}
                alt={t('hardware.alt')}
                loading="lazy"
                className="size-full object-contain"
              />
              {HARDWARE_PARTS.map((part, i) => {
                const isActive = part.id === active
                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => setActive(part.id)}
                    onMouseEnter={() => setActive(part.id)}
                    aria-label={t(`hardware.parts.${part.id}.title`)}
                    aria-pressed={isActive}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive"
                    style={{ left: `${part.x}%`, top: `${part.y}%` }}
                  >
                    {isActive && <span className="absolute inset-0 animate-soft-pulse rounded-full bg-olive/50" />}
                    <span
                      className={cn(
                        'relative grid size-6 place-items-center rounded-full border-2 font-mono text-2xs font-bold shadow-md transition-colors duration-300',
                        isActive ? 'border-white bg-olive-deep text-lime' : 'border-olive-deep/60 bg-white/90 text-olive-deep',
                      )}
                    >
                      {i + 1}
                    </span>
                  </button>
                )
              })}

            </div>

            {/* caption for the active hotspot */}
            <div className="mx-auto mt-3 min-h-[64px] max-w-[520px] rounded-xl border border-white/10 bg-white/5 p-3.5" aria-live="polite">
              <AnimatePresence mode="wait">
                <m.div
                  key={activePart.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: EASE_CALM }}
                  className="flex items-start gap-3"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-lime text-ink">
                    <activePart.icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t(`hardware.parts.${activePart.id}.title`)}</p>
                    <p className="text-xs text-white/60">{t(`hardware.parts.${activePart.id}.body`)}</p>
                  </div>
                </m.div>
              </AnimatePresence>
            </div>
          </Reveal>

          {/* copy + parts list */}
          <div className="order-1 lg:order-2">
            <Reveal>
              <SectionEyebrow tone="dark">{t('hardware.eyebrow')}</SectionEyebrow>
              <h2 className="heading-display mt-5 text-display-sm sm:text-display-md">{t('hardware.title')}</h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60 sm:text-body">{t('hardware.body')}</p>
            </Reveal>

            <ul className="mt-8 grid gap-x-6 sm:grid-cols-2">
              {HARDWARE_PARTS.map(({ id, icon: Icon }, i) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setActive(id)}
                    onMouseEnter={() => setActive(id)}
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-white/10 py-3 text-left transition-colors duration-300',
                      id === active ? 'text-white' : 'text-white/50 hover:text-white/80',
                    )}
                  >
                    <span className="w-5 font-mono text-2xs text-lime/80">{pad2(i + 1)}</span>
                    <Icon className="size-4 shrink-0" />
                    <span className="text-sm font-medium">{t(`hardware.parts.${id}.title`)}</span>
                  </button>
                </li>
              ))}
            </ul>

            <ul className="mt-8 flex flex-wrap gap-2">
              {BADGES.map(({ id, icon: Icon }) => (
                <li
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/75"
                >
                  <Icon className="size-3.5 text-lime" />
                  {t(`badges.${id}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </StageCard>
  )
}
