import i18n, { type BackendModule, type ReadCallback } from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { LanguageCode } from '@/data/types'
import en from './locales/en.json'

const STORAGE_KEY = 'agrisaarthi.lang'

export const LANGUAGES: { code: LanguageCode; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'हि' },
  { code: 'gu', label: 'ગુજરાતી', short: 'ગુ' },
]

/**
 * Namespaces
 * - "translation": landing page + shared glossary (English bundled, hi/gu lazy)
 * - "dash":        farmer dashboard, loaded only when /dashboard is opened
 * Dashboard keys are written as t('dash.x.y'); fallbackNS lets the default
 * namespace resolve them from the "dash" bundle (stored under a "dash" key).
 */
const LOADERS: Record<string, Record<LanguageCode, () => Promise<{ default: object }>>> = {
  translation: {
    en: () => import('./locales/en.json'),
    hi: () => import('./locales/hi.json'),
    gu: () => import('./locales/gu.json'),
  },
  dash: {
    en: () => import('./locales/dash.en.json'),
    hi: () => import('./locales/dash.hi.json'),
    gu: () => import('./locales/dash.gu.json'),
  },
}

const lazyBackend: BackendModule = {
  type: 'backend',
  init() {},
  read(language: string, namespace: string, callback: ReadCallback) {
    const load = LOADERS[namespace]?.[language as LanguageCode]
    if (!load) return callback(null, {})
    load()
      .then((mod) => callback(null, namespace === 'dash' ? { dash: mod.default } : mod.default))
      .catch((err: Error) => callback(err, false))
  },
}

function readStoredLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'hi' || stored === 'gu') return stored
  } catch {
    // storage unavailable (private mode) – fall back to English
  }
  return 'en'
}

void i18n
  .use(lazyBackend)
  .use(initReactI18next)
  .init({
    lng: readStoredLanguage(),
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'gu'],
    ns: ['translation'],
    defaultNS: 'translation',
    fallbackNS: 'dash',
    // English landing copy ships in the main bundle for an instant first paint
    resources: { en: { translation: en } },
    partialBundledLanguages: true,
    interpolation: { escapeValue: false },
    react: { useSuspense: true },
  })

const hasDom = typeof document !== 'undefined'
if (hasDom) document.documentElement.lang = i18n.language

i18n.on('languageChanged', (lng) => {
  if (!hasDom) return
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // ignore
  }
})

export default i18n
