import type { TFunction } from 'i18next'
import { Square, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { LanguageCode } from '@/data/types'
import { useSpeech } from '@/hooks/useSpeech'
import { getVoiceLang } from '@/lib/voice'
import { cn } from '@/lib/utils'

interface ListenButtonProps {
  /** builds the text in the voice language (t is fixed to that language) */
  build: (t: TFunction) => string
  label: string
  /** force a language (e.g. Crop Doctor "Listen in Gujarati"); default = Settings → Voice language */
  lang?: LanguageCode
  iconOnly?: boolean
  className?: string
  variant?: 'outline' | 'solid'
}

/** Reads recommendations / alerts / diagnoses aloud with hi-IN, gu-IN or en-IN voices */
export function ListenButton({ build, label, lang, iconOnly, className, variant = 'outline' }: ListenButtonProps) {
  const { t, i18n } = useTranslation()
  const { speaking, playLocalized, stop } = useSpeech()
  const [mine, setMine] = useState(false)
  const active = speaking && mine

  const onClick = async () => {
    if (active) {
      stop()
      setMine(false)
      return
    }
    setMine(true)
    const voiceLang = lang ?? getVoiceLang((i18n.resolvedLanguage ?? 'en') as LanguageCode)
    await playLocalized(voiceLang, build)
  }

  const text = active ? t('dash.top.stopVoice') : label
  return (
    <Button
      type="button"
      size={iconOnly ? 'icon' : 'sm'}
      shape="rounded"
      variant={variant === 'solid' || active ? 'default' : 'outline'}
      onClick={onClick}
      aria-pressed={active}
      aria-label={iconOnly ? text : undefined}
      title={iconOnly ? text : undefined}
      className={cn(
        iconOnly && 'size-8',
        (variant === 'solid' || active) && 'bg-brand hover:bg-brand-dark',
        variant === 'outline' && !active && 'border-surface-line bg-white',
        className,
      )}
    >
      {active ? <Square /> : <Volume2 />}
      {!iconOnly && text}
    </Button>
  )
}
