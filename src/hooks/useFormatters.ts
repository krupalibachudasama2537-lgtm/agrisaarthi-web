import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { LanguageCode } from '@/data/types'

const LOCALES: Record<LanguageCode, string> = { en: 'en-IN', hi: 'hi-IN', gu: 'gu-IN' }

/** Locale-aware date / number helpers for the dashboard */
export function useFormatters() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as LanguageCode
  const locale = LOCALES[lang] ?? 'en-IN'

  return useMemo(() => {
    const timeFmt = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
    const dayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
    const dateTimeFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
    const numFmt = new Intl.NumberFormat(locale)
    const inrFmt = new Intl.NumberFormat(locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

    return {
      lang,
      locale,
      time: (iso: string) => timeFmt.format(new Date(iso)),
      day: (iso: string) => dayFmt.format(new Date(iso)),
      date: (iso: string) => dateFmt.format(new Date(iso)),
      dateTime: (iso: string) => dateTimeFmt.format(new Date(iso)),
      number: (n: number) => numFmt.format(n),
      inr: (n: number) => inrFmt.format(n),
      /** "12 min ago", "3 h ago", "2 d ago" */
      ago: (iso: string) => {
        const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
        if (mins < 1) return t('dash.common.justNow')
        if (mins < 60) return t('dash.common.minutesAgo', { count: mins })
        const hours = Math.round(mins / 60)
        if (hours < 24) return t('dash.common.hoursAgo', { count: hours })
        return t('dash.common.daysAgo', { count: Math.round(hours / 24) })
      },
      /** "Today", "Tomorrow" or weekday */
      relativeDay: (iso: string) => {
        const d = new Date(iso)
        const today = new Date()
        const diff = Math.round((new Date(d.toDateString()).getTime() - new Date(today.toDateString()).getTime()) / 86_400_000)
        if (diff === 0) return t('dash.common.today')
        if (diff === 1) return t('dash.common.tomorrow')
        return dayFmt.format(d)
      },
    }
  }, [lang, locale, t])
}
