import { AnimatePresence, m } from 'framer-motion'
import { CheckCircle2, ChevronRight, LayoutDashboard, Loader2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { GlassCard } from '@/components/GlassCard'
import { ParallaxImage, Reveal } from '@/components/motion'
import { EASE_CALM } from '@/lib/motion'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { StageCard } from '@/components/StageCard'
import { Button } from '@/components/ui/button'
import { IMAGES } from '@/data/images'
import type { DemoRequest } from '@/data/types'
import { api } from '@/lib/api'

const FIELDS: { name: keyof DemoRequest; type: string; autoComplete: string; inputMode?: 'tel' }[] = [
  { name: 'name', type: 'text', autoComplete: 'name' },
  { name: 'phone', type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
  { name: 'village', type: 'text', autoComplete: 'address-level2' },
]

/** "Book a demo" – full-bleed photo with a glass form */
export function Cta() {
  const { t } = useTranslation()
  const [form, setForm] = useState<DemoRequest>({ name: '', phone: '', village: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const [reference, setReference] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    const res = await api.requestDemo(form)
    setReference(res.reference)
    setStatus('done')
  }

  return (
    <StageCard id="demo" tone="image">
      <ParallaxImage src={IMAGES.cta} alt="" strength={70} className="absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/30" />

      <div className="container grid min-h-[640px] gap-10 py-16 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16 lg:py-24">
        <Reveal>
          <SectionEyebrow tone="dark">{t('cta.eyebrow')}</SectionEyebrow>
          <h2 className="heading-display mt-5 text-display-sm text-white sm:text-display-md lg:text-display-lg">{t('cta.title')}</h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/75 sm:text-body">{t('cta.body')}</p>
          <Button asChild variant="glass" shape="rounded" className="mt-8">
            <Link to="/dashboard">
              <LayoutDashboard />
              {t('cta.dashboard')}
            </Link>
          </Button>
        </Reveal>

        <Reveal delay={0.15}>
          <GlassCard tone="dark" className="p-5 sm:p-7">
            <AnimatePresence mode="wait" initial={false}>
              {status === 'done' ? (
                <m.div
                  key="done"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE_CALM }}
                  className="flex min-h-[260px] flex-col items-start justify-center"
                  role="status"
                >
                  <CheckCircle2 className="size-8 text-lime" />
                  <p className="mt-4 text-xl font-semibold">{t('cta.thanks')}</p>
                  <p className="mt-2 font-mono text-xs text-white/60">
                    {t('cta.reference')}: {reference}
                  </p>
                </m.div>
              ) : (
                <m.form key="form" exit={{ opacity: 0, y: -12 }} onSubmit={onSubmit} className="space-y-3">
                  {FIELDS.map((f) => (
                    <label key={f.name} className="block">
                      <span className="text-eyebrow font-semibold uppercase text-white/60">{t(`cta.${f.name}`)}</span>
                      <input
                        required
                        name={f.name}
                        type={f.type}
                        inputMode={f.inputMode}
                        autoComplete={f.autoComplete}
                        pattern={f.name === 'phone' ? '[0-9+ ]{10,14}' : undefined}
                        value={form[f.name]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                        className="mt-1.5 h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-body text-white placeholder:text-white/40 focus:border-lime/70 focus:outline-none focus:ring-2 focus:ring-lime/30"
                      />
                    </label>
                  ))}
                  <Button type="submit" variant="lime" size="lg" className="mt-3 w-full" disabled={status === 'sending'}>
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="animate-spin" />
                        {t('cta.sending')}
                      </>
                    ) : (
                      <>
                        {t('cta.submit')}
                        <ChevronRight />
                      </>
                    )}
                  </Button>
                </m.form>
              )}
            </AnimatePresence>
          </GlassCard>
        </Reveal>
      </div>
    </StageCard>
  )
}
