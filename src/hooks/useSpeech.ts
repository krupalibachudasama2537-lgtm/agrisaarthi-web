import type { TFunction } from 'i18next'
import { createContext, useContext } from 'react'
import type { LanguageCode } from '@/data/types'

export interface SpeechContextValue {
  /** true while the browser is speaking */
  speaking: boolean
  /** speak ready-made text (already in `lang`) */
  play: (text: string, lang: LanguageCode) => Promise<void>
  /** build text with a translator fixed to `lang` (loads that language first), then speak it */
  playLocalized: (lang: LanguageCode, build: (t: TFunction) => string) => Promise<void>
  stop: () => void
}

export const SpeechContext = createContext<SpeechContextValue | null>(null)

/** Voice output for dashboard pages (provided by <SpeechProvider>) */
export function useSpeech() {
  const ctx = useContext(SpeechContext)
  if (!ctx) throw new Error('useSpeech must be used inside <SpeechProvider>')
  return ctx
}
