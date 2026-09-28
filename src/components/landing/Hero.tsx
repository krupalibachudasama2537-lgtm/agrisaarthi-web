import { m, useReducedMotion } from 'framer-motion'
import { ArrowDown, ChevronRight, ChevronsUpDown, Droplets } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { GlassCard, GlassLabel } from '@/components/GlassCard'
import { CountUp } from '@/components/motion'
import { EASE_CALM } from '@/lib/motion'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { StageCard } from '@/components/StageCard'
import { Button } from '@/components/ui/button'
import { IMAGES } from '@/data/images'
import { BADGES } from '@/data/landing'
import type { HeroSnapshot } from '@/data/types'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { scrollToId } from '@/lib/lenis'
import { cn } from '@/lib/utils'
import { FarmPlot3D } from './FarmPlot3D'
import { MiniArea, MiniBars } from './MiniCharts'


function Float({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: EASE_CALM, delay: 0.5 + delay }}
    >
      <m.div
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 6 + delay * 2, ease: 'easeInOut', repeat: Infinity, delay }}
      >
        {children}
      </m.div>
    </m.div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-white/50', className)} />
}

function SoilScoreCard({ data }: { data: HeroSnapshot | null }) {
  const { t } = useTranslation()
  return (
    <GlassCard className="w-[228px] p-4">
      <div className="flex items-start justify-between">
        <div>
          <GlassLabel>{t('hero.soilScore')}</GlassLabel>
          <p className="mt-1 text-3xl font-semibold leading-none tracking-tight">
            {data ? <CountUp to={data.soilHealthScore} /> : '—'}
            <span className="text-sm font-medium text-ink/60">/100</span>
          </p>
        </div>
        <span className="rounded-full bg-lime/70 px-2 py-0.5 text-2xs font-semibold text-ink">+6</span>
      </div>
      <div className="mt-3 h-16">
        {data ? (
          <MiniBars
            values={data.soilHealthByZone.map((z) => z.score)}
            label={`${t('hero.soilScore')}: ${data.soilHealthByZone.map((z) => `${z.zone} ${z.score}`).join(', ')}`}
          />
        ) : (
          <Skeleton className="size-full" />
        )}
      </div>
      <p className="mt-2 text-caption text-ink/60">{t('hero.byZone')}</p>
    </GlassCard>
  )
}

function WaterSavedCard({ data }: { data: HeroSnapshot | null }) {
  const { t } = useTranslation()
  return (
    <GlassCard className="w-[228px] p-4">
      <div className="flex items-start justify-between">
        <div>
          <GlassLabel>{t('hero.waterSaved')}</GlassLabel>
          <p className="mt-1 text-3xl font-semibold leading-none tracking-tight">
            {data ? <CountUp to={data.waterSavedPercent} suffix="%" /> : '—'}
          </p>
        </div>
        <Droplets className="size-4 text-olive" />
      </div>
      <div className="mt-3 h-16">
        {data ? (
          <MiniArea
            values={data.waterUsage.map((w) => w.agrisaarthi)}
            baseline={data.waterUsage.map((w) => w.baseline)}
            label={`${t('hero.waterSaved')} ${data.waterSavedPercent}% ${t('hero.vsFlood')}`}
          />
        ) : (
          <Skeleton className="size-full" />
        )}
      </div>
      <p className="mt-2 text-caption text-ink/60">{t('hero.vsFlood')}</p>
    </GlassCard>
  )
}

function MoistureChip({ data }: { data: HeroSnapshot | null }) {
  const { t } = useTranslation()
  return (
    <GlassCard className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-soft-pulse rounded-full bg-olive" />
        <span className="relative inline-flex size-2 rounded-full bg-olive" />
      </span>
      <div>
        <GlassLabel>{t('hero.moisture')}</GlassLabel>
        <p className="text-sm font-semibold">
          {data ? `${data.liveMoisture}%` : '—'}
          <span className="ml-1.5 text-caption font-medium text-ink/60">
            {t('common.live')} · {t('hero.every15')}
          </span>
        </p>
      </div>
    </GlassCard>
  )
}

/** AI detection tag with corner-bracket box, echoing the reference overlay */
function DetectionChip() {
  const { t } = useTranslation()
  return (
    <div className="flex items-end gap-2">
      <div className="relative size-16 rounded-full border border-white/80">
        {['-left-1 -top-1', '-right-1 -top-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((pos) => (
          <span key={pos} className={cn('absolute size-1.5 rounded-full bg-white', pos)} />
        ))}
        <span className="absolute inset-0 m-auto size-1 rounded-full bg-white" />
      </div>
      <span className="mb-1 rounded-chip bg-ink/75 px-2 py-1 text-caption font-medium text-white backdrop-blur">
        {t('hero.detected')} <span className="text-lime">92%</span>
      </span>
    </div>
  )
}

export function Hero() {
  const { t } = useTranslation()
  const { data } = useApi(api.getHeroSnapshot)

  return (
    <StageCard id="top" tone="mist" innerClassName="min-h-[calc(100svh-1rem)] sm:min-h-[calc(100svh-1.5rem)] lg:min-h-[calc(100svh-2rem)]">
      {/* misty backdrop */}
      {/* tiny (≈15 KB) on purpose: it is shown blurred at 35 % opacity */}
      <img
        src={IMAGES.heroMist}
        alt=""
        aria-hidden
        decoding="async"
        fetchPriority="low"
        className="absolute inset-0 -z-10 size-full scale-110 object-cover opacity-35 blur-[6px] saturate-50"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-mist-light/95 via-mist/70 to-sage-200/90" />
      <div
        aria-hidden
        className="absolute left-1/2 top-[45%] -z-10 h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-[100px]"
      />

      <div className="container flex min-h-[inherit] flex-col pb-6 pt-24 sm:pt-28 lg:pt-32">
        {/* headline */}
        <div className="mx-auto max-w-4xl text-center">
          {/* entrance is pure CSS (animate-hero-in) so the prerendered HTML animates before JS loads */}
          <div className="animate-hero-in">
            <SectionEyebrow>{t('hero.eyebrow')}</SectionEyebrow>
          </div>
          <h1
            className="heading-display mt-5 animate-hero-in text-display-sm [animation-delay:100ms] sm:text-display-md lg:text-display-lg xl:text-display-xl"
          >
            {t('hero.title1')}
            <br />
            <span className="text-ink/50">{t('hero.title2')}</span>
          </h1>
          <div className="mt-7 flex animate-hero-in flex-wrap items-center justify-center gap-3 [animation-delay:250ms]">
            <Button variant="deep" size="lg" onClick={() => scrollToId('demo')}>
              {t('hero.ctaPrimary')}
              <ChevronRight />
            </Button>
            <Button variant="outline" size="lg" shape="rounded" onClick={() => scrollToId('how-it-works')}>
              {t('hero.ctaSecondary')}
              <ArrowDown />
            </Button>
          </div>
        </div>

        {/* plot + floating cards */}
        <div className="relative mx-auto mt-8 flex w-full max-w-6xl flex-1 flex-col items-center justify-center lg:mt-4 lg:min-h-[420px]">
          <div className="animate-hero-in py-10 [animation-delay:200ms] sm:py-14 lg:py-0">
            <FarmPlot3D />
          </div>

          {/* desktop: floating around the plot */}
          <Float className="absolute left-0 top-[4%] hidden lg:block xl:left-[4%]" delay={0}>
            <SoilScoreCard data={data} />
          </Float>
          <Float className="absolute bottom-[6%] right-0 hidden lg:block xl:right-[4%]" delay={0.3}>
            <WaterSavedCard data={data} />
          </Float>
          <Float className="absolute bottom-[14%] left-[8%] hidden lg:block xl:left-[14%]" delay={0.6}>
            <MoistureChip data={data} />
          </Float>
          <Float className="absolute right-[10%] top-[8%] hidden lg:block xl:right-[18%]" delay={0.45}>
            <DetectionChip />
          </Float>

          {/* mobile / tablet: cards in a row under the plot */}
          <div className="grid w-full max-w-[480px] grid-cols-1 justify-items-center gap-3 sm:grid-cols-2 lg:hidden">
            <SoilScoreCard data={data} />
            <WaterSavedCard data={data} />
            <div className="sm:col-span-2">
              <MoistureChip data={data} />
            </div>
          </div>
        </div>

        {/* bottom row */}
        <div className="mt-10 flex flex-col gap-6 lg:mt-6 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-sm text-sm leading-relaxed text-ink/65 text-pretty">{t('hero.sub')}</p>
          <ul className="flex flex-wrap gap-2">
            {BADGES.map(({ id, icon: Icon }) => (
              <li
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/50 px-3 py-1.5 text-caption font-medium text-ink/70 backdrop-blur"
              >
                <Icon className="size-3.5 text-olive" />
                {t(`badges.${id}`)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => scrollToId('in-the-field')}
            className="hidden items-center gap-1.5 text-xs font-medium text-ink/60 transition-colors hover:text-ink lg:inline-flex"
          >
            <ChevronsUpDown className="size-3.5" />
            {t('common.scroll')}
          </button>
        </div>
      </div>
    </StageCard>
  )
}
