import type { TFunction } from 'i18next'
import { VolumeX } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { LanguageCode } from '@/data/types'
import { SpeechContext } from '@/hooks/useSpeech'
import { loadVoices, speak, stopSpeaking, type VoiceStatus } from '@/lib/voice'

interface Fallback {
  lang: LanguageCode
  text: string
  reason: Exclude<VoiceStatus, 'available'>
}

/**
 * Owns speechSynthesis for the dashboard: one "speaking" state for every Listen button,
 * a screen-reader status line, and a fallback dialog that shows the text when no
 * hi-IN / gu-IN / en-IN voice is installed.
 */
export function SpeechProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()
  const [speaking, setSpeaking] = useState(false)
  const [fallback, setFallback] = useState<Fallback | null>(null)

  useEffect(() => {
    void loadVoices()
    return () => stopSpeaking()
  }, [])

  const play = useCallback(async (text: string, lang: LanguageCode) => {
    const status = await speak(text, lang, () => setSpeaking(false))
    if (status === 'available') setSpeaking(true)
    else setFallback({ lang, text, reason: status })
  }, [])

  const playLocalized = useCallback(
    async (lang: LanguageCode, build: (t: TFunction) => string) => {
      await i18n.loadLanguages(lang)
      await i18n.loadNamespaces('dash')
      await play(build(i18n.getFixedT(lang)), lang)
    },
    [i18n, play],
  )

  const stop = useCallback(() => {
    stopSpeaking()
    setSpeaking(false)
  }, [])

  const value = useMemo(() => ({ speaking, play, playLocalized, stop }), [speaking, play, playLocalized, stop])
  const langName = fallback ? t(`dash.common.langName.${fallback.lang}`) : ''

  return (
    <SpeechContext.Provider value={value}>
      {children}
      <p className="sr-only" role="status" aria-live="polite">
        {speaking ? t('dash.top.speaking') : ''}
      </p>
      <Dialog open={fallback !== null} onOpenChange={(o) => !o && setFallback(null)}>
        <DialogContent>
          <DialogHeader>
            <span className="mb-1 grid size-10 place-items-center rounded-xl bg-warn-soft text-warn">
              <VolumeX className="size-5" />
            </span>
            <DialogTitle>{t('dash.voice.fallbackTitle')}</DialogTitle>
            <DialogDescription>
              {fallback?.reason === 'unsupported' ? t('dash.voice.unsupported') : t('dash.voice.fallbackBody', { lang: langName })}
            </DialogDescription>
          </DialogHeader>
          {fallback && (
            <div className="rounded-xl border border-surface-line bg-surface p-4">
              <p className="text-caption font-semibold uppercase tracking-wider text-ink/60">
                {t('dash.voice.fallbackText')} · {langName}
              </p>
              <p lang={fallback.lang} className="mt-2 whitespace-pre-line text-body leading-relaxed">
                {fallback.text}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button shape="rounded" className="bg-brand hover:bg-brand-dark" onClick={() => setFallback(null)}>
              {t('dash.voice.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SpeechContext.Provider>
  )
}
