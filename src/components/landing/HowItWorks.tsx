import { m, useMotionValueEvent, useScroll } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRef, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/motion'
import { EASE_CALM } from '@/lib/motion'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { StageCard } from '@/components/StageCard'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { srcSetFor } from '@/data/images'
import { BADGES, STEPS, SYSTEM_FLOW } from '@/data/landing'
import { getLenis } from '@/lib/lenis'
import { cn, pad2 } from '@/lib/utils'

const DESKTOP_MQ = '(min-width: 1024px)'
const subscribeDesktop = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP_MQ)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

/** SSR/prerender-safe: false on the server and during hydration, then the real value */
function useIsDesktop() {
  return useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP_MQ).matches, () => false)
}

/**
 * Left: big field image with circular outline + [01/03] counter.
 * Right: accordion steps. On desktop the block is sticky and the active step
 * follows scroll progress; on mobile it is tap-driven.
 */
export function HowItWorks() {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLDivElement>(null)
  const isDesktop = useIsDesktop()
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (!isDesktop) return
    const idx = Math.min(STEPS.length - 1, Math.floor(v * STEPS.length))
    setActive(idx)
    setProgress(Math.min(1, Math.max(0, v * STEPS.length - idx)))
  })

  const selectStep = (idx: number) => {
    setActive(idx)
    if (!isDesktop || !trackRef.current) return
    // scroll so that this step becomes active
    const rect = trackRef.current.getBoundingClientRect()
    const scrollable = trackRef.current.offsetHeight - window.innerHeight
    const target = window.scrollY + rect.top + scrollable * ((idx + 0.05) / STEPS.length)
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(target, { duration: 1.2 })
    else window.scrollTo({ top: target, behavior: 'smooth' })
  }

  const step = STEPS[active]

  return (
    <StageCard id="how-it-works" tone="white">
      <div className="container pt-16 sm:pt-20 lg:pt-24">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
          <Reveal>
            <SectionEyebrow>{t('how.eyebrow')}</SectionEyebrow>
            <h2 className="heading-display mt-5 text-display-sm sm:text-display-md">{t('how.title')}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-md text-sm leading-relaxed text-ink/60 sm:text-body">{t('how.body')}</p>
          </Reveal>
        </div>
      </div>

      {/* scroll track: tall on desktop so the sticky panel can play through 3 steps */}
      <div ref={trackRef} className="relative lg:h-[260vh]">
        <div className="container lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center">
          <div className="grid w-full gap-8 py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:py-0">
            {/* image panel */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ink lg:aspect-auto lg:h-[min(72vh,640px)]">
              {/* all step images stay mounted (preloaded) and crossfade */}
              {STEPS.map((s, i) => (
                <m.img
                  key={s.id}
                  src={s.image}
                  srcSet={srcSetFor(s.image)}
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  loading="lazy"
                  decoding="async"
                  alt={i === active ? t(`how.steps.${s.id}.title`) : ''}
                  aria-hidden={i !== active}
                  initial={false}
                  animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.08 }}
                  transition={{ duration: 1.1, ease: EASE_CALM }}
                  className="absolute inset-0 size-full object-cover"
                />
              ))}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-ink/20" />

              {/* thin circular outline with crosshair ticks */}
              <div aria-hidden className="absolute left-1/2 top-1/2 aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70">
                <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-white/80" />
                <span className="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-white/80" />
                <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-white/80" />
                <span className="absolute right-0 top-1/2 h-px w-3 -translate-y-1/2 bg-white/80" />
                {/* marker travels around the ring as steps advance */}
                <m.div
                  className="absolute inset-0"
                  animate={{ rotate: active * 120 }}
                  transition={{ duration: 1.1, ease: EASE_CALM }}
                >
                  <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-lime" />
                </m.div>
              </div>

              <span className="absolute left-4 top-4 font-mono text-xs font-medium tracking-wider text-white sm:left-5 sm:top-5">
                [{pad2(active + 1)}/{pad2(STEPS.length)}]
              </span>
              <span className="absolute bottom-4 left-4 rounded-chip bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink sm:bottom-5 sm:left-5">
                {t(`how.steps.${step.id}.title`)}
              </span>
            </div>

            {/* steps */}
            <Accordion
              type="single"
              value={step.id}
              onValueChange={(v) => {
                const idx = STEPS.findIndex((s) => s.id === v)
                if (idx >= 0) selectStep(idx)
              }}
              className="self-center border-t border-ink/10"
            >
              {STEPS.map((s, i) => (
                <AccordionItem key={s.id} value={s.id}>
                  <AccordionTrigger
                    className={cn(
                      'py-6 text-xl transition-colors duration-500 sm:text-2xl',
                      i === active ? 'text-ink' : 'text-ink/60 hover:text-ink/60',
                    )}
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="font-mono text-xs font-medium text-olive">{pad2(i + 1)}</span>
                      <span className="tracking-tight">{t(`how.steps.${s.id}.title`)}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-9 text-body leading-relaxed text-ink/60">
                    {t(`how.steps.${s.id}.body`)}
                    <div className="mt-5 hidden h-px w-full bg-ink/10 lg:block">
                      <div
                        className="h-px bg-olive transition-[width] duration-150"
                        style={{ width: `${(i === active ? progress : 0) * 100}%` }}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      {/* system flow */}
      <div className="container pb-16 sm:pb-20 lg:pb-24 lg:pt-8">
        <Reveal>
          <p className="text-eyebrow font-semibold uppercase text-ink/60">{t('how.flowTitle')}</p>
        </Reveal>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SYSTEM_FLOW.map(({ id, icon: Icon }, i) => (
            <m.li
              key={id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -8% 0px' }}
              transition={{ duration: 0.8, ease: EASE_CALM, delay: i * 0.07 }}
              className={cn(
                'relative flex items-start gap-3 rounded-card border p-4',
                id === 'outcome' ? 'border-olive-deep bg-olive-deep text-white' : 'border-ink/10 bg-mist-light',
              )}
            >
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-lg',
                  id === 'outcome' ? 'bg-lime text-ink' : 'bg-white text-olive-deep',
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-2xs opacity-50">{pad2(i + 1)}</p>
                <p className="text-sm font-semibold leading-tight">{t(`how.flow.${id}.title`)}</p>
                <p className={cn('mt-1 text-xs', id === 'outcome' ? 'text-white/70' : 'text-ink/60')}>
                  {t(`how.flow.${id}.body`)}
                </p>
              </div>
              {i < SYSTEM_FLOW.length - 1 && (
                <ArrowRight
                  aria-hidden
                  className="absolute -right-[11px] top-1/2 z-10 hidden size-4 -translate-y-1/2 rounded-full bg-white p-0.5 text-olive lg:block"
                />
              )}
            </m.li>
          ))}
        </ol>

        <ul className="mt-6 flex flex-wrap gap-2">
          {BADGES.map(({ id, icon: Icon }) => (
            <li
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/70"
            >
              <Icon className="size-3.5 text-olive" />
              {t(`badges.${id}`)}
            </li>
          ))}
        </ul>
      </div>
    </StageCard>
  )
}
