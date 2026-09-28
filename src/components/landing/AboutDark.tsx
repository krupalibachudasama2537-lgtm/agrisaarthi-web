import { m } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CountUp, ParallaxImage, Reveal } from '@/components/motion'
import { EASE_CALM } from '@/lib/motion'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { StageCard } from '@/components/StageCard'
import { IMAGES, srcSetFor } from '@/data/images'
import { ABOUT_STATS } from '@/data/landing'

/** Near-black section: "We combine IoT sensors, AI vision and solar power" */
export function AboutDark() {
  const { t } = useTranslation()

  return (
    <StageCard id="about" tone="dark">
      <img
        src={IMAGES.darkSoil}
        srcSet={srcSetFor(IMAGES.darkSoil)}
        sizes="100vw"
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 -z-10 size-full object-cover opacity-50"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/80 via-ink/40 to-ink/90" />

      <div className="container py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16">
          <Reveal>
            <SectionEyebrow tone="dark">{t('about.eyebrow')}</SectionEyebrow>
            <h2 className="heading-display mt-5 text-display-sm sm:text-display-md">{t('about.title')}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-md text-sm leading-relaxed text-white/65 sm:text-body">{t('about.body')}</p>
          </Reveal>
        </div>

        {/* inset with label strip + dotted arc */}
        <Reveal className="mx-auto mt-14 w-full max-w-[440px] lg:mt-20" delay={0.1}>
          <div className="flex items-center justify-between bg-white px-3.5 py-2 text-xs font-medium text-ink">
            <span>{t('about.insetLabel')}</span>
            <CountUp to={24} suffix="%" className="font-semibold" />
          </div>
          <ParallaxImage src={IMAGES.soilHands} alt="" strength={30} sizes="440px" className="aspect-[16/10] w-full" />
          <svg viewBox="0 0 440 60" className="mt-2 w-full" aria-hidden>
            <path d="M10 10 Q220 70 430 10" fill="none" stroke="rgba(255,255,255,0.35)" strokeDasharray="2 5" />
            <circle cx="220" cy="40" r="3" fill="#C6E36B" />
            <circle cx="150" cy="35" r="2" fill="white" opacity=".7" />
          </svg>
        </Reveal>

        {/* stat row */}
        <div className="mt-12 lg:mt-16">
          <p className="text-sm text-white/60">{t('about.delivers')}</p>
          <ul className="mt-5 grid grid-cols-2 gap-y-2 border-b border-r border-white/15 lg:grid-cols-4">
            {ABOUT_STATS.map(({ id, icon: Icon, value, prefixKey, suffix }, i) => (
              <m.li
                key={id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={{ duration: 0.8, ease: EASE_CALM, delay: i * 0.08 }}
                className="flex items-start gap-3 border-l border-white/15 px-3 pb-6 pt-1 sm:px-4"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md border border-white/30">
                  <Icon className="size-4 text-white/85" />
                </span>
                <div>
                  <p className="text-body font-semibold leading-tight sm:text-base">
                    {value !== undefined ? (
                      <CountUp to={value} prefix={prefixKey ? `${t(prefixKey)} ` : ''} suffix={suffix} />
                    ) : (
                      t(`about.stats.${id}.title`)
                    )}
                  </p>
                  <p className="mt-1 text-xs text-white/55">{t(`about.stats.${id}.caption`)}</p>
                </div>
              </m.li>
            ))}
          </ul>
        </div>
      </div>
    </StageCard>
  )
}
