import { Ban, Droplets, Landmark, Lightbulb, Sprout, Wheat } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AsyncView, EmptyState, PageHeader } from '@/components/dashboard/states'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { FertilizerData } from '@/data/types'
import { useApi } from '@/hooks/useApi'
import { useDashboard } from '@/hooks/useDashboard'
import { useFormatters } from '@/hooks/useFormatters'
import { useGlossary } from '@/hooks/useGlossary'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function FertilizerPage() {
  const { t } = useTranslation()
  const { farmId } = useDashboard()
  const query = useApi(() => api.getFertilizerPlan(farmId), [farmId])

  return (
    <>
      <PageHeader title={t('dash.fert.title')} subtitle={t('dash.fert.subtitle')} />
      <AsyncView query={query}>{(data) => <FertilizerContent key={farmId} data={data} />}</AsyncView>
    </>
  )
}

function FertilizerContent({ data }: { data: FertilizerData }) {
  const { t } = useTranslation()
  const { g } = useGlossary()
  const fmt = useFormatters()
  const [acresInput, setAcresInput] = useState(String(data.acres))
  const acres = Number(acresInput)
  const acresValid = Number.isFinite(acres) && acres > 0 && acres <= 100
  const perAcre = data.items.reduce((sum, f) => sum + f.bagsPerAcre * f.pricePerBag, 0)

  return (
    <div className="space-y-4">
      {/* plan */}
      <Card>
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <CardTitle>{t('dash.fert.planTitle', { crop: g(data.crop) })}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Landmark className="size-3.5 shrink-0 text-brand" />
              {t('dash.fert.guidelines')}
            </CardDescription>
          </div>
          <div className="w-full space-y-1 sm:w-40">
            <Label htmlFor="acres">{t('dash.fert.fieldSize')}</Label>
            <Input
              id="acres"
              inputMode="decimal"
              value={acresInput}
              onChange={(e) => setAcresInput(e.target.value)}
              aria-invalid={!acresValid}
              className="h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-3">
          {data.items.length ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t('dash.fert.name')}</TableHead>
                  <TableHead>{t('dash.fert.when')}</TableHead>
                  <TableHead className="text-right">{t('dash.fert.bags')}</TableHead>
                  <TableHead className="text-right">{t('dash.fert.price')}</TableHead>
                  <TableHead className="text-right">{t('dash.fert.cost')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((f) => (
                  <TableRow key={f.name}>
                    <TableCell>
                      <p className="font-semibold">{g(f.name)}</p>
                      <p className="text-caption text-ink/60">
                        {f.nutrient} · {f.bagKg} kg
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ink/65">{t(`dash.fert.timing.${f.timing}`)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{f.bagsPerAcre}</TableCell>
                    <TableCell className="text-right tabular-nums text-ink/65">{fmt.inr(f.pricePerBag)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fmt.inr(f.bagsPerAcre * f.pricePerBag)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4}>{t('dash.fert.perAcreTotal')}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt.inr(perAcre)}</TableCell>
                </TableRow>
                <TableRow className="bg-brand-soft hover:bg-brand-soft">
                  <TableCell colSpan={4} className="text-brand">
                    {t('dash.fert.totalFor', { acres: acresValid ? acres : '—' })}
                  </TableCell>
                  <TableCell className="text-right text-base tabular-nums text-brand">{acresValid ? fmt.inr(perAcre * acres) : '—'}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          ) : (
            <EmptyState
              icon={Sprout}
              body={t('dash.fert.planEmpty')}
              action={
                <Link to="/dashboard/soil" className="text-xs font-semibold text-brand hover:underline">
                  {t('dash.nav.soil')} →
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* crops */}
      <section aria-labelledby="crops-title">
        <h2 id="crops-title" className="mb-3 text-sm font-semibold">
          {t('dash.fert.cropsTitle')}
        </h2>
        {data.topCrops.length ? (
          <ul className="grid gap-3 md:grid-cols-3">
            {data.topCrops.map((c, i) => (
              <li key={c.id}>
                <Card className={cn('h-full p-5', i === 0 && 'border-brand/30 ring-1 ring-brand/15')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={cn('grid size-10 place-items-center rounded-xl', i === 0 ? 'bg-brand text-white' : 'bg-brand-soft text-brand')}>
                        <Wheat className="size-5" />
                      </span>
                      <div>
                        <p className="text-body font-semibold leading-tight">
                          {i + 1}. {g(c.name)}
                        </p>
                        <p className="text-caption text-ink/60">{t(`dash.fert.season.${c.season}`)}</p>
                      </div>
                    </div>
                    <Badge variant="brand">{t('dash.fert.match', { value: c.suitability })}</Badge>
                  </div>
                  <p className="mt-5 text-caption font-medium uppercase tracking-wider text-ink/60">{t('dash.fert.profit')}</p>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight">
                    {fmt.inr(c.profitPerAcre)}
                    <span className="text-sm font-medium text-ink/60">{t('dash.fert.perAcre')}</span>
                  </p>
                  <Progress value={c.suitability} className="mt-3 h-1.5" aria-label={t('dash.fert.match', { value: c.suitability })} />
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-caption">
                    <div className="rounded-lg bg-surface py-2">
                      <dt className="text-ink/60">{t('dash.fert.costLabel')}</dt>
                      <dd className="font-semibold tabular-nums">{fmt.inr(c.costPerAcre)}</dd>
                    </div>
                    <div className="rounded-lg bg-surface py-2">
                      <dt className="text-ink/60">{t('dash.fert.yield')}</dt>
                      <dd className="font-semibold tabular-nums">{t('dash.fert.quintal', { value: c.yieldPerAcre })}</dd>
                    </div>
                    <div className="rounded-lg bg-surface py-2">
                      <dt className="sr-only">{t('dash.fert.waterNeed')}</dt>
                      <dd className="flex h-full items-center justify-center gap-1 font-semibold">
                        <Droplets className={cn('size-3', c.water === 'low' ? 'text-ok' : c.water === 'medium' ? 'text-sky-600' : 'text-warn')} />
                        {t(`dash.fert.water.${c.water}`)}
                      </dd>
                    </div>
                  </dl>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card>
            <EmptyState icon={Wheat} body={t('dash.fert.cropsEmpty')} />
          </Card>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dash.fert.avoidTitle')}</CardTitle>
            <Ban className="size-4 text-crit" />
          </CardHeader>
          <CardContent>
            {data.avoid.length ? (
              <ul className="space-y-2">
                {data.avoid.map((a) => (
                  <li key={a.name} className="flex items-center gap-3 rounded-xl bg-crit-soft/60 px-3 py-2.5">
                    <Ban className="size-4 shrink-0 text-crit" />
                    <span className="text-sm font-semibold">{g(a.name)}</span>
                    <span className="ml-auto text-right text-xs text-ink/60">{t(`dash.fert.avoid.${a.reasonKey}`)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Ban} body={t('dash.fert.cropsEmpty')} className="py-6" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dash.fert.tipsTitle')}</CardTitle>
            <Lightbulb className="size-4 text-warn" />
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5">
              {data.tipKeys.map((k, i) => (
                <li key={k} className="flex gap-3 text-sm">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-caption font-bold text-brand">{i + 1}</span>
                  <span className="leading-relaxed text-ink/75">{t(`dash.fert.tips.${k}`)}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
