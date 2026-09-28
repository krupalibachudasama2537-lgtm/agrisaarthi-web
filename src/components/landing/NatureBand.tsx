import { ChevronsUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ParallaxImage, Reveal } from '@/components/motion'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { StageCard } from '@/components/StageCard'
import { IMAGES } from '@/data/images'
import { cn } from '@/lib/utils'

/** Thin detection frame with corner dots + a tag, like the reference overlay */
function DetectionFrame({ className, label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={cn('pointer-events-none absolute', className)}>
      <div className="relative size-full border border-white/70">
        {['-left-[3px] -top-[3px]', '-right-[3px] -top-[3px]', '-bottom-[3px] -left-[3px]', '-bottom-[3px] -right-[3px]'].map(
          (pos) => (
            <span key={pos} className={cn('absolute size-1.5 rounded-full bg-white', pos)} />
          ),
        )}
        <div className="absolute inset-[18%] rounded-full border border-dashed border-white/50" />
      </div>
      <span className="absolute -bottom-8 left-0 whitespace-nowrap rounded-chip bg-white/85 px-2 py-1 text-caption font-medium text-ink backdrop-blur">
        {label} <span className="font-semibold text-olive">{value}</span>
      </span>
    </div>
  )
}

/** Full-bleed nature photo band – the "cinematic" beat after the light hero */
export function NatureBand() {
  const { t } = useTranslation()

  return (
    <StageCard id="in-the-field" tone="image">
      <div className="relative h-[82svh] min-h-[540px] max-h-[900px]">
        <ParallaxImage src={IMAGES.natureBand} alt="" strength={80} className="absolute inset-0" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-ink/85" />

        <DetectionFrame
          className="left-[58%] top-[30%] hidden size-28 sm:block lg:size-36"
          label={t('nature.tagMoisture')}
          value="24%"
        />
        <DetectionFrame
          className="left-[18%] top-[22%] hidden size-20 md:block"
          label={t('nature.tagAnimal')}
          value="0.94"
        />

        <div className="absolute inset-x-0 bottom-0">
          <div className="container flex flex-col gap-8 pb-8 sm:pb-10 lg:flex-row lg:items-end lg:justify-between lg:pb-12">
            <Reveal className="max-w-2xl">
              <SectionEyebrow tone="dark">{t('nature.eyebrow')}</SectionEyebrow>
              <h2 className="heading-display mt-4 text-display-sm text-white sm:text-display-md lg:text-display-lg">
                {t('nature.title')}
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/75 sm:text-body">{t('nature.body')}</p>
            </Reveal>
            <span className="hidden items-center gap-1.5 text-xs font-medium text-white/70 lg:inline-flex">
              <ChevronsUpDown className="size-3.5" />
              {t('common.scroll')}
            </span>
          </div>
        </div>
      </div>
    </StageCard>
  )
}
