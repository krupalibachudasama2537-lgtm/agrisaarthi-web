import { m } from 'framer-motion'
import { Award, Quote } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ParallaxImage, Reveal } from '@/components/motion'
import { EASE_CALM } from '@/lib/motion'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { StageCard } from '@/components/StageCard'
import { IMAGES } from '@/data/images'
import { TEAM } from '@/data/landing'

/** White section: SIH badge, problem statement and team roles */
export function Team() {
  const { t } = useTranslation()

  return (
    <StageCard id="team" tone="white">
      <div className="container py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal>
              <div className="flex flex-wrap items-center gap-3">
                <SectionEyebrow>{t('team.eyebrow')}</SectionEyebrow>
                <span className="inline-flex items-center gap-2 rounded-full bg-olive-deep py-1.5 pl-1.5 pr-3.5 text-xs font-semibold text-white">
                  <span className="grid size-6 place-items-center rounded-full bg-lime text-ink">
                    <Award className="size-3.5" />
                  </span>
                  {t('team.sih')}
                </span>
              </div>
              <h2 className="heading-display mt-5 text-display-sm sm:text-display-md">{t('team.title')}</h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/60 sm:text-body">{t('team.body')}</p>
            </Reveal>

            <Reveal delay={0.1}>
              <figure className="relative mt-8 overflow-hidden rounded-card bg-ink text-white">
                <ParallaxImage src={IMAGES.team} alt="" strength={30} sizes="(min-width: 1024px) 50vw, 100vw" className="absolute inset-0 opacity-35" />
                <div className="relative p-6 sm:p-7">
                  <Quote className="size-5 text-lime" />
                  <figcaption className="mt-3 text-eyebrow font-semibold uppercase text-white/60">{t('team.psLabel')}</figcaption>
                  <blockquote className="mt-2 text-body leading-relaxed text-white/90 sm:text-base">{t('team.ps')}</blockquote>
                </div>
              </figure>
            </Reveal>
          </div>

          <ul className="grid grid-cols-2 gap-3 self-end sm:gap-4">
            {TEAM.map((member, i) => (
              <m.li
                key={member.roleKey}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                transition={{ duration: 0.8, ease: EASE_CALM, delay: (i % 2) * 0.08 + Math.floor(i / 2) * 0.06 }}
                className="rounded-card border border-ink/10 bg-mist-light p-4 sm:p-5"
              >
                <span aria-hidden className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-olive to-olive-deep text-sm font-bold text-lime">
                  {member.initials}
                </span>
                {/* placeholder names are translated until real names are filled in src/data/landing.ts */}
                <p className="mt-4 text-body font-semibold">{member.name ?? t('team.member', { n: i + 1 })}</p>
                <p className="mt-0.5 text-xs text-ink/60">{t(`team.roles.${member.roleKey}`)}</p>
              </m.li>
            ))}
          </ul>
        </div>
      </div>
    </StageCard>
  )
}
