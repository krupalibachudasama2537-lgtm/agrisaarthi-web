import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Reveal } from '@/components/motion'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { StageCard } from '@/components/StageCard'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { FAQ_IDS } from '@/data/landing'
import { scrollToId } from '@/lib/lenis'

export function Faq() {
  const { t } = useTranslation()

  return (
    <StageCard id="faq" tone="mist">
      <div className="container grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1.4fr] lg:gap-20 lg:py-24">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <SectionEyebrow>{t('faq.eyebrow')}</SectionEyebrow>
          <h2 className="heading-display mt-5 text-display-sm sm:text-display-md">{t('faq.title')}</h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink/60 sm:text-body">{t('faq.body')}</p>
          <Button variant="deep" className="mt-7" onClick={() => scrollToId('demo')}>
            {t('nav.demo')}
            <ChevronRight />
          </Button>
        </Reveal>

        <Reveal delay={0.1}>
          <Accordion type="single" collapsible defaultValue={FAQ_IDS[0]} className="border-t border-ink/10">
            {FAQ_IDS.map((id) => (
              <AccordionItem key={id} value={id}>
                <AccordionTrigger className="text-base sm:text-lg">{t(`faq.items.${id}.q`)}</AccordionTrigger>
                <AccordionContent className="max-w-xl text-body leading-relaxed text-ink/60">
                  {t(`faq.items.${id}.a`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </StageCard>
  )
}
