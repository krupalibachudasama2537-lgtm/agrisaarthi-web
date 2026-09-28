import { CheckCircle2, FlaskConical, Languages, User, Volume2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { PageHeader } from '@/components/dashboard/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import type { LanguageCode, MockMode } from '@/data/types'
import { useDashboard } from '@/hooks/useDashboard'
import { useGlossary } from '@/hooks/useGlossary'
import { useSpeech } from '@/hooks/useSpeech'
import { getMockMode, setMockMode } from '@/lib/api'
import { getVoiceLang, setVoiceLang as saveVoiceLang, voiceStatus, type VoiceStatus } from '@/lib/voice'
import { cn } from '@/lib/utils'

const MODES: MockMode[] = ['normal', 'slow', 'empty', 'error']
const VOICE_LANGS: LanguageCode[] = ['gu', 'hi', 'en']
const NATIVE: Record<LanguageCode, string> = { gu: 'ગુજરાતી', hi: 'हिन्दी', en: 'English' }

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { farmer } = useDashboard()
  const { g } = useGlossary()
  const { playLocalized } = useSpeech()
  const [voices, setVoices] = useState<Partial<Record<LanguageCode, VoiceStatus>>>({})

  // which hi-IN / gu-IN / en-IN voices this device can actually speak with
  useEffect(() => {
    let cancelled = false
    void Promise.all(VOICE_LANGS.map(async (l) => [l, await voiceStatus(l)] as const)).then((pairs) => {
      if (!cancelled) setVoices(Object.fromEntries(pairs))
    })
    return () => {
      cancelled = true
    }
  }, [])
  const [mode, setMode] = useState<MockMode>(getMockMode)
  const [voiceLang, setVoiceLang] = useState<LanguageCode>(() => getVoiceLang((i18n.resolvedLanguage ?? 'gu') as LanguageCode))

  const chooseMode = (m: MockMode) => {
    setMode(m)
    setMockMode(m)
    toast.success(t('dash.settings.demoSaved', { mode: t(`dash.settings.mode.${m}`) }))
  }

  const chooseVoice = (l: LanguageCode) => {
    setVoiceLang(l)
    saveVoiceLang(l)
    void playLocalized(l, (ft) => ft('dash.voice.allGood'))
  }

  return (
    <>
      <PageHeader title={t('dash.settings.title')} subtitle={t('dash.settings.subtitle')} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dash.settings.profile')}</CardTitle>
            <User className="size-4 text-ink/30" />
          </CardHeader>
          <CardContent>
            {farmer ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-full bg-brand text-sm font-bold text-white">{farmer.initials}</span>
                  <div>
                    <p className="font-semibold">{farmer.name}</p>
                    <p className="text-xs text-ink/60">
                      {g(farmer.village)}, {g(farmer.district)}
                    </p>
                  </div>
                </div>
                {(
                  [
                    ['name', farmer.name],
                    ['phone', farmer.phone],
                    ['village', `${g(farmer.village)}, ${g(farmer.district)}`],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="space-y-1.5">
                    <Label htmlFor={`profile-${k}`}>{t(`dash.settings.${k}`)}</Label>
                    <Input id={`profile-${k}`} value={v} readOnly />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dash.settings.language')}</CardTitle>
              <Languages className="size-4 text-ink/30" />
            </CardHeader>
            <CardContent>
              <LanguageSwitcher full className="w-full border-surface-line bg-surface" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>{t('dash.settings.voiceLang')}</CardTitle>
                <CardDescription>{t('dash.settings.voiceDesc')}</CardDescription>
              </div>
              <Volume2 className="size-4 shrink-0 text-ink/30" />
            </CardHeader>
            <CardContent>
              <div role="group" aria-label={t('dash.settings.voiceLang')} className="grid grid-cols-3 gap-2">
                {VOICE_LANGS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    lang={l}
                    aria-pressed={voiceLang === l}
                    onClick={() => chooseVoice(l)}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors',
                      voiceLang === l ? 'border-brand bg-brand-soft text-brand' : 'border-surface-control hover:bg-surface-muted',
                    )}
                  >
                    {NATIVE[l]}
                  </button>
                ))}
              </div>

              {/* per-language availability of hi-IN / gu-IN / en-IN voices on this device */}
              <h3 className="mt-5 text-caption font-semibold uppercase tracking-wider text-ink/60">{t('dash.voice.statusTitle')}</h3>
              <ul className="mt-2 divide-y divide-surface-line rounded-xl border border-surface-line">
                {VOICE_LANGS.map((l) => {
                  const st = voices[l]
                  return (
                    <li key={l} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                      {st === 'available' ? (
                        <CheckCircle2 aria-hidden className="size-4 shrink-0 text-ok" />
                      ) : (
                        <XCircle aria-hidden className={cn('size-4 shrink-0', st ? 'text-warn' : 'text-ink/30')} />
                      )}
                      <span className="w-20 shrink-0 font-semibold" lang={l}>
                        {NATIVE[l]}
                      </span>
                      <span className="min-w-0 flex-1 text-xs text-ink/65">
                        {!st
                          ? t('dash.voice.checking')
                          : st === 'available'
                            ? t('dash.voice.available')
                            : st === 'unsupported'
                              ? t('dash.voice.unsupported')
                              : t('dash.voice.missing')}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        shape="rounded"
                        className="h-8 border-surface-line"
                        onClick={() => void playLocalized(l, (ft) => ft('dash.voice.allGood'))}
                      >
                        <Volume2 />
                        {t('dash.voice.test')}
                        <span className="sr-only"> {NATIVE[l]}</span>
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>{t('dash.settings.demo')}</CardTitle>
                <CardDescription>{t('dash.settings.demoDesc')}</CardDescription>
              </div>
              <FlaskConical className="size-4 shrink-0 text-ink/30" />
            </CardHeader>
            <CardContent>
              <div role="group" aria-label={t('dash.settings.demo')} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MODES.map((m) => (
                  <Button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    variant="outline"
                    shape="rounded"
                    onClick={() => chooseMode(m)}
                    className={cn(mode === m && 'border-brand bg-brand-soft text-brand hover:bg-brand-soft')}
                  >
                    {t(`dash.settings.mode.${m}`)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
