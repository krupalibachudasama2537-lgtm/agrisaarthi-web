import { CheckCircle2, Leaf, Lightbulb } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnalysisError, AnalyzingCard, ConfidenceBar, PhotoPreview } from '@/components/dashboard/diagnosis'
import { ListenButton } from '@/components/dashboard/ListenButton'
import { PhotoUpload } from '@/components/dashboard/PhotoUpload'
import { EmptyState, PageHeader, StatusBadge } from '@/components/dashboard/states'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDiagnosis } from '@/hooks/useDiagnosis'
import { useGlossary } from '@/hooks/useGlossary'
import { api } from '@/lib/api'

export default function CropDoctorPage() {
  const { t } = useTranslation()
  const { g, loc, lang } = useGlossary()
  const diag = useDiagnosis(api.diagnoseLeaf)

  return (
    <>
      <PageHeader
        title={t('dash.doctor.title')}
        subtitle={t('dash.doctor.subtitle')}
        actions={<Badge variant="brand">{t('dash.doctor.offline')}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {diag.preview ? (
            <PhotoPreview src={diag.preview} phase={diag.phase} onReset={diag.reset} />
          ) : (
            <Card className="p-3">
              <PhotoUpload title={t('dash.doctor.uploadTitle')} onSelect={diag.start} />
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>{t('dash.doctor.tipsTitle')}</CardTitle>
              <Lightbulb className="size-4 text-warn" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-ink/70">
                {(['tip1', 'tip2', 'tip3'] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />
                    {t(`dash.doctor.${k}`)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div aria-live="polite">
          {diag.phase === 'idle' && (
            <Card>
              <EmptyState icon={Leaf} title={t('dash.doctor.resultTitle')} body={t('dash.doctor.emptyResult')} className="py-16" />
            </Card>
          )}
          {diag.phase === 'analyzing' && <AnalyzingCard />}
          {diag.phase === 'error' && <AnalysisError message={diag.error?.message} onRetry={diag.retry} />}
          {diag.phase === 'done' && diag.result && (
            <Card>
              <CardHeader>
                <div>
                  <p className="text-caption font-semibold uppercase tracking-wider text-ink/60">{t('dash.doctor.resultTitle')}</p>
                  <CardTitle className="mt-1 text-xl">{loc(diag.result.disease)}</CardTitle>
                  <p className="mt-1 text-xs text-ink/60">{g(diag.result.crop)}</p>
                </div>
                <StatusBadge status={diag.result.severity} />
              </CardHeader>
              <CardContent className="space-y-5">
                <ConfidenceBar value={diag.result.confidence} />

                <div>
                  <h3 className="text-sm font-semibold">{t('dash.doctor.treatment')}</h3>
                  <ol className="mt-3 space-y-2.5">
                    {loc(diag.result.treatment).map((step, i) => (
                      <li key={step} className="flex gap-3 rounded-xl bg-surface p-3 text-sm leading-relaxed">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-caption font-bold text-white">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex flex-wrap gap-2">
                  <ListenButton variant="solid" lang="gu" label={t('dash.doctor.listenGu')} build={() => diag.result!.voice.gu} />
                  {lang !== 'gu' && (
                    <ListenButton
                      lang={lang}
                      label={t('dash.common.listenIn', { lang: t(`dash.common.langName.${lang}`) })}
                      build={() => diag.result!.voice[lang]}
                    />
                  )}
                </div>
                <p lang="gu" className="rounded-xl border border-surface-line p-3 text-body-sm leading-relaxed text-ink/65">
                  {diag.result.voice.gu}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
