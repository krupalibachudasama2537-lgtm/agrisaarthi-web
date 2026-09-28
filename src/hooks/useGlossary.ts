import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { LanguageCode, Localized } from '@/data/types'
import { translateParams, translateTerm } from '@/lib/glossary'

/**
 * g(term)       – crop / place / mandi names in the current language
 * gp(params)    – same for every string in an i18n params object
 * loc(value)    – pick the current language from a { en, hi, gu } value
 */
export function useGlossary() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as LanguageCode
  return useMemo(
    () => ({
      lang,
      g: (term: string) => translateTerm(t, term),
      gp: (params?: Record<string, string | number>) => translateParams(t, params),
      loc: <T,>(value: Record<LanguageCode, T>) => value[lang] ?? value.en,
    }),
    [t, lang],
  )
}

export type { Localized }
