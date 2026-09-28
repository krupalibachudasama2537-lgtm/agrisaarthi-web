import { Info, Loader2, MessageSquare, Phone, RefreshCw, Save, Signal } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AsyncView, EmptyState, PageHeader } from '@/components/dashboard/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SMS_SAMPLE_PARAMS, SMS_TEMPLATES } from '@/data/dashboard'
import type { AlertRoute, AlertsData, AlertType, LanguageCode, MessageLog } from '@/data/types'
import { useApi } from '@/hooks/useApi'
import { useFormatters } from '@/hooks/useFormatters'
import { ListenButton } from '@/components/dashboard/ListenButton'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { api } from '@/lib/api'
import { simulator } from '@/lib/simulator'
import { translateTerm } from '@/lib/glossary'
import { cn } from '@/lib/utils'

const STATUS_VARIANT: Record<MessageLog['status'], 'ok' | 'crit' | 'warn'> = { delivered: 'ok', failed: 'crit', pending: 'warn' }
const LANG_SHORT: Record<LanguageCode, string> = { en: 'EN', hi: 'हि', gu: 'ગુ' }

/** SMS length rules: GSM-7 = 160 / 153 per part, Unicode (Gujarati/Hindi) = 70 / 67 */
function smsInfo(text: string) {
  const unicode = [...text].some((c) => c.charCodeAt(0) > 127)
  const len = [...text].length
  const single = unicode ? 70 : 160
  const multi = unicode ? 67 : 153
  return { len, unicode, parts: len <= single ? 1 : Math.ceil(len / multi) }
}

/** Fill an SMS template; place / crop names are translated into the SMS language via the glossary */
const fill = (tpl: string, ft: TFunction) =>
  tpl.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    const v = SMS_SAMPLE_PARAMS[k]
    return v === undefined ? '' : typeof v === 'string' ? translateTerm(ft, v) : String(v)
  })

export default function AlertsPage() {
  const { t } = useTranslation()
  const query = useApi(api.getAlerts)
  const { mutate } = query

  useEffect(() => {
    return simulator.subscribe(() => {
      mutate((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          log: [...simulator.getMessageLog()],
        }
      })
    })
  }, [mutate])

  return (
    <>
      <PageHeader title={t('dash.alerts.title')} subtitle={t('dash.alerts.subtitle')} />
      <AsyncView query={query}>
        {(data) => (
          <AlertsContent
            data={data}
            onUpdateLog={(msg) => query.mutate((d) => ({ ...d, log: d.log.map((m) => (m.id === msg.id ? msg : m)) }))}
            onSaveRouting={(routing) => query.mutate((d) => ({ ...d, routing }))}
          />
        )}
      </AsyncView>
    </>
  )
}

function AlertsContent({
  data,
  onUpdateLog,
  onSaveRouting,
}: {
  data: AlertsData
  onUpdateLog: (m: MessageLog) => void
  onSaveRouting: (r: AlertRoute[]) => void
}) {
  const { t } = useTranslation()
  return (
    <Tabs defaultValue="log">
      <TabsList className="max-w-full overflow-x-auto">
        <TabsTrigger value="log">{t('dash.alerts.tabLog')}</TabsTrigger>
        <TabsTrigger value="preview">{t('dash.alerts.tabPreview')}</TabsTrigger>
        <TabsTrigger value="routing">{t('dash.alerts.tabRouting')}</TabsTrigger>
      </TabsList>
      <TabsContent value="log">
        <MessageLogCard log={data.log} onUpdate={onUpdateLog} />
      </TabsContent>
      <TabsContent value="preview">
        <SmsPreview />
      </TabsContent>
      <TabsContent value="routing">
        <RoutingCard routing={data.routing} onSaved={onSaveRouting} />
      </TabsContent>
    </Tabs>
  )
}

/* ---------- log ---------- */

function MessageLogCard({ log, onUpdate }: { log: MessageLog[]; onUpdate: (m: MessageLog) => void }) {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const [retrying, setRetrying] = useState<string | null>(null)

  const retry = async (id: string) => {
    setRetrying(id)
    try {
      onUpdate(await api.retryMessage(id))
      toast.success(t('dash.alerts.resent'))
    } catch (e) {
      toast.error(t('dash.common.errorTitle'), { description: e instanceof Error ? e.message : undefined })
    } finally {
      setRetrying(null)
    }
  }

  return (
    <Card>
      <CardContent className="px-2 pt-2 sm:px-3">
        {log.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('dash.alerts.time')}</TableHead>
                <TableHead>{t('dash.alerts.type')}</TableHead>
                <TableHead>{t('dash.alerts.channel')}</TableHead>
                <TableHead>{t('dash.alerts.lang')}</TableHead>
                <TableHead>{t('dash.alerts.statusCol')}</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">{t('dash.common.listen')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap">
                    <p className="font-medium">{fmt.dateTime(m.time)}</p>
                    <p className="text-caption text-ink/60">{m.to}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">{t(`dash.alertType.${m.type}`)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/70">
                      {m.channel === 'sms' ? <MessageSquare className="size-3.5" /> : <Phone className="size-3.5" />}
                      {t(`dash.channel.${m.channel}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{LANG_SHORT[m.lang]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[m.status]}>{t(`dash.alerts.status.${m.status}`)}</Badge>
                    {m.attempts > 1 && <p className="mt-0.5 text-2xs text-ink/60">{t('dash.alerts.attempts', { count: m.attempts })}</p>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <ListenButton
                      iconOnly
                      lang={m.lang}
                      label={`${t('dash.common.listen')}: ${t(`dash.alertType.${m.type}`)}`}
                      build={(ft) => fill(SMS_TEMPLATES[m.type][m.lang], ft)}
                      className="mr-1.5 align-middle"
                    />
                    {m.status === 'failed' && (
                      <Button size="sm" variant="outline" shape="rounded" className="h-8" onClick={() => retry(m.id)} disabled={retrying === m.id}>
                        {retrying === m.id ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                        {t('dash.alerts.retry')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState icon={MessageSquare} body={t('dash.alerts.logEmpty')} className="py-14" />
        )}
      </CardContent>
    </Card>
  )
}

/* ---------- SMS preview ---------- */

function SmsPreview() {
  const { t, i18n } = useTranslation()
  const [type, setType] = useState<AlertType>('soilDry')
  const [lang, setLang] = useState<LanguageCode>(i18n.resolvedLanguage === 'hi' ? 'hi' : 'gu')
  // the SMS language may differ from the UI language – load its glossary, then re-render
  const [, setLoaded] = useState<string>('')
  useEffect(() => {
    let cancelled = false
    void i18n.loadLanguages(lang).then(() => !cancelled && setLoaded(lang))
    return () => {
      cancelled = true
    }
  }, [i18n, lang])
  const text = fill(SMS_TEMPLATES[type][lang], i18n.getFixedT(lang))
  const info = smsInfo(text)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('dash.alerts.tabPreview')}</CardTitle>
            <CardDescription>{t('dash.alerts.previewDesc')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sms-type">{t('dash.alerts.type')}</Label>
            <Select value={type} onValueChange={(v) => setType(v as AlertType)}>
              <SelectTrigger id="sms-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SMS_TEMPLATES) as AlertType[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`dash.alertType.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('dash.alerts.lang')}</Label>
            <SegmentedControl
              label={t('dash.alerts.lang')}
              value={lang}
              onValueChange={setLang}
              options={[
                { value: 'gu', label: 'ગુજરાતી' },
                { value: 'hi', label: 'हिन्दी' },
                { value: 'en', label: 'English' },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={info.parts > 1 ? 'warn' : 'brand'}>{t('dash.alerts.chars', { count: info.len, parts: info.parts })}</Badge>
            {info.unicode && <Badge variant="outline">{t('dash.alerts.unicodeBadge')}</Badge>}
          </div>
          <p className="flex items-start gap-2 text-xs text-ink/60">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            {t('dash.alerts.unicodeNote')}
          </p>
        </CardContent>
      </Card>

      {/* basic phone mock */}
      <div className="mx-auto w-full max-w-[320px] rounded-[2rem] border-[10px] border-ink bg-ink p-0 shadow-xl">
        <div className="overflow-hidden rounded-[1.4rem] bg-[#EEF1EC]">
          <div className="flex items-center justify-between bg-ink/90 px-4 py-1.5 font-mono text-2xs text-white/80">
            <span>JIO 2G</span>
            <Signal className="size-3" />
          </div>
          <div className="border-b border-ink/10 bg-white px-4 py-2.5">
            <p className="text-sm font-semibold">VM-AGRSTH</p>
            <p className="text-2xs text-ink/60">SMS</p>
          </div>
          <div className="min-h-[260px] px-3 py-4">
            <div lang={lang} className="max-w-[92%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-body-sm leading-relaxed shadow-sm">
              {text}
            </div>
            <p className="mt-1.5 pl-1 text-2xs text-ink/60">06:12</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- routing ---------- */

function RoutingCard({ routing, onSaved }: { routing: AlertRoute[]; onSaved: (r: AlertRoute[]) => void }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(routing)
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(routing)

  const set = (type: AlertType, key: 'sms' | 'call', v: boolean) =>
    setDraft((d) => d.map((r) => (r.type === type ? { ...r, [key]: v } : r)))

  const save = async () => {
    setSaving(true)
    try {
      onSaved(await api.saveAlertRouting(draft))
      toast.success(t('dash.alerts.routingSaved'))
    } catch (e) {
      toast.error(t('dash.common.errorTitle'), { description: e instanceof Error ? e.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex-col gap-3 sm:flex-row">
        <div>
          <CardTitle>{t('dash.alerts.routingTitle')}</CardTitle>
          <CardDescription>{t('dash.alerts.routingDesc')}</CardDescription>
        </div>
        <Button shape="rounded" size="sm" className="bg-brand hover:bg-brand-dark" onClick={save} disabled={!dirty || saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          {saving ? t('dash.common.saving') : t('dash.common.save')}
        </Button>
      </CardHeader>
      <CardContent className="px-2 sm:px-3">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('dash.alerts.type')}</TableHead>
              <TableHead className="text-center">{t('dash.channel.sms')}</TableHead>
              <TableHead className="text-center">{t('dash.channel.call')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draft.map((r) => (
              <TableRow key={r.type}>
                <TableCell className="font-medium">{t(`dash.alertType.${r.type}`)}</TableCell>
                {(['sms', 'call'] as const).map((k) => (
                  <TableCell key={k} className="text-center">
                    <Switch
                      checked={r[k]}
                      onCheckedChange={(v) => set(r.type, k, v)}
                      aria-label={`${t(`dash.alertType.${r.type}`)} – ${t(`dash.channel.${k}`)}`}
                      className={cn('align-middle')}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
