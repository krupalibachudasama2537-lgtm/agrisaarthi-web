import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/i18n'
import { cn } from '@/lib/utils'

/** EN / हि / ગુ segmented toggle */
export function LanguageSwitcher({ className, full = false }: { className?: string; full?: boolean }) {
  const { i18n, t } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className={cn('inline-flex items-center rounded-full border border-ink/10 bg-white/60 p-0.5', className)}
    >
      {LANGUAGES.map((lang) => {
        const active = i18n.resolvedLanguage === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            lang={lang.code}
            aria-pressed={active}
            aria-label={full ? undefined : lang.label}
            onClick={() => void i18n.changeLanguage(lang.code)}
            className={cn(
              'h-7 rounded-full px-2.5 text-xs font-semibold transition-colors duration-300',
              full && 'flex-1 px-4',
              active ? 'bg-olive-deep text-white' : 'text-ink/70 hover:text-ink',
            )}
          >
            {full ? lang.label : lang.short}
          </button>
        )
      })}
    </div>
  )
}
