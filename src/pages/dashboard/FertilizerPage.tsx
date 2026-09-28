import {
  Ban,
  Calculator,
  CheckCircle2,
  Droplets,
  Landmark,
  Lightbulb,
  Sprout,
  Wheat,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AsyncView, EmptyState, PageHeader } from '@/components/dashboard/states'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GUJARAT_CROPS_ICAR, calculateFertilizerPlan } from '@/data/fertilizerRules'
import type { FertilizerData, NpkEntry } from '@/data/types'
import { useApi } from '@/hooks/useApi'
import { useDashboard } from '@/hooks/useDashboard'
import { useFormatters } from '@/hooks/useFormatters'
import { useGlossary } from '@/hooks/useGlossary'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function FertilizerPage() {
  const { t } = useTranslation()
  const { farmId } = useDashboard()
  const fertQuery = useApi(() => api.getFertilizerPlan(farmId), [farmId])
  const soilQuery = useApi(() => api.getSoil(farmId), [farmId])

  return (
    <>
      <PageHeader title={t('dash.fert.title')} subtitle={t('dash.fert.subtitle')} />
      <AsyncView query={fertQuery}>
        {(data) => <FertilizerContent key={farmId} data={data} soilNpk={soilQuery.data?.npk} />}
      </AsyncView>
    </>
  )
}

function FertilizerContent({ data, soilNpk }: { data: FertilizerData; soilNpk?: NpkEntry | null }) {
  const { t } = useTranslation()
  const { g } = useGlossary()
  const fmt = useFormatters()

  // Match initial crop from farm against ICAR crop rules
  const [selectedCropKey, setSelectedCropKey] = useState<string>(() => {
    const raw = data.crop.toLowerCase().trim()
    const found = Object.values(GUJARAT_CROPS_ICAR).find(
      (c) => c.id === raw || raw.includes(c.id) || c.name.toLowerCase() === raw,
    )
    return found ? found.id : 'groundnut'
  })

  const [acresInput, setAcresInput] = useState(String(data.acres))
  const acres = Number(acresInput)
  const acresValid = Number.isFinite(acres) && acres > 0 && acres <= 100

  // Calculate live plan from ICAR rules and soil health card
  const calculated = useMemo(() => {
    const soilInput =
      soilNpk ??
      (data.calculationSteps
        ? {
            n: data.calculationSteps.soilRatings.n.level,
            p: data.calculationSteps.soilRatings.p.level,
            k: data.calculationSteps.soilRatings.k.level,
          }
        : null)
    return calculateFertilizerPlan(selectedCropKey, soilInput, acresValid ? acres : data.acres)
  }, [selectedCropKey, soilNpk, data.calculationSteps, acresValid, acres, data.acres])

  const plan = calculated
  const steps = calculated.calculationSteps
  const items = plan.items
  const perAcre = items.reduce((sum, f) => sum + f.bagsPerAcre * f.pricePerBag, 0)

  return (
    <div className="space-y-4">
      {/* plan */}
      <Card>
        <CardHeader className="flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>{t('dash.fert.planTitle', { crop: g(plan.crop) })}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 mt-1">
              <Landmark className="size-3.5 shrink-0 text-brand" />
              {steps?.source ?? t('dash.fert.guidelines')}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-44 space-y-1">
              <Label htmlFor="crop-select">{t('dash.fert.cropSelect')}</Label>
              <Select value={selectedCropKey} onValueChange={setSelectedCropKey}>
                <SelectTrigger id="crop-select" className="h-9">
                  <SelectValue placeholder={t('dash.fert.cropSelect')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(GUJARAT_CROPS_ICAR).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {g(c.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-32 space-y-1">
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
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-3">
          {items.length ? (
            <>
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
                  {items.map((f) => (
                    <TableRow key={`${f.name}-${f.timing}`}>
                      <TableCell>
                        <p className="font-semibold">{g(f.name)}</p>
                        <p className="text-caption text-ink/60">
                          {f.nutrient} · {f.bagKg} kg
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-ink/65">{t(`dash.fert.timing.${f.timing}`)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{f.bagsPerAcre}</TableCell>
                      <TableCell className="text-right tabular-nums text-ink/65">{fmt.inr(f.pricePerBag)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt.inr(Math.round(f.bagsPerAcre * f.pricePerBag))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4}>{t('dash.fert.perAcreTotal')}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt.inr(Math.round(perAcre))}</TableCell>
                  </TableRow>
                  <TableRow className="bg-brand-soft hover:bg-brand-soft">
                    <TableCell colSpan={4} className="text-brand">
                      {t('dash.fert.totalFor', { acres: acresValid ? acres : '—' })}
                    </TableCell>
                    <TableCell className="text-right text-base tabular-nums text-brand">
                      {acresValid ? fmt.inr(Math.round(perAcre * acres)) : '—'}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>

              {/* Expandable Calculation Steps */}
              {steps && (
                <div className="mt-4 border-t border-surface-line pt-2">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="calc-steps" className="border-none">
                      <AccordionTrigger className="rounded-xl px-2 py-3 text-xs font-semibold text-brand hover:no-underline hover:bg-surface-muted sm:px-3">
                        <span className="flex items-center gap-2">
                          <Calculator className="size-4 shrink-0 text-brand" />
                          <span>{t('dash.fert.howCalculated')}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 text-xs">
                        <div className="space-y-3 rounded-2xl border border-surface-line bg-surface/40 p-3 sm:p-4">
                          {/* Step 1: Soil Test & Dose Adjustment */}
                          <div className="rounded-xl border border-surface-line bg-white p-3.5 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-line pb-2.5">
                              <span className="font-semibold text-ink flex items-center gap-1.5">
                                <CheckCircle2 className="size-3.5 text-brand" />
                                {t('dash.fert.calcStep1Title')}
                              </span>
                              <Badge variant="secondary" className="text-3xs font-semibold">
                                {steps.source}
                              </Badge>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              {(['n', 'p', 'k'] as const).map((nut) => {
                                const r = steps.soilRatings[nut]
                                const label = nut === 'n' ? 'Nitrogen (N)' : nut === 'p' ? 'Phosphorus (P)' : 'Potassium (K)'
                                return (
                                  <div key={nut} className="rounded-lg bg-surface p-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-ink">{label}</span>
                                      <Badge variant={r.level === 'low' ? 'warn' : 'ok'} className="text-3xs uppercase">
                                        {t(`dash.soil.rating.${r.level}`)}
                                      </Badge>
                                    </div>
                                    <p className="mt-1 text-2xs text-ink/70">
                                      {r.value !== undefined ? `${r.value} kg/ha` : t(`dash.soil.rating.${r.level}`)}
                                      {' · '}
                                      <span className="font-semibold text-brand">{r.percentLabel}</span>
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                            <div className="mt-3 text-2xs leading-relaxed text-ink/75">
                              <p>
                                <span className="font-semibold">{t('dash.fert.icarBase')}: </span>
                                N: {steps.baseDoseKgHa.n} · P₂O₅: {steps.baseDoseKgHa.p} · K₂O: {steps.baseDoseKgHa.k} kg/ha
                              </p>
                              <p className="mt-0.5">
                                <span className="font-semibold text-brand">{t('dash.fert.adjustedDose')}: </span>
                                N: {steps.adjustedDoseKgHa.n} · P₂O₅: {steps.adjustedDoseKgHa.p} · K₂O: {steps.adjustedDoseKgHa.k} kg/ha
                              </p>
                            </div>
                          </div>

                          {/* Step 2: Per-Acre Conversion */}
                          <div className="rounded-xl border border-surface-line bg-white p-3.5 shadow-sm">
                            <p className="font-semibold text-ink flex items-center gap-1.5">
                              <CheckCircle2 className="size-3.5 text-brand" />
                              {t('dash.fert.calcStep2Title')}
                            </p>
                            <p className="mt-1 text-2xs text-ink/60">
                              1 hectare = 2.471 acres (× 0.4047 ha/acre)
                            </p>
                            <p className="mt-2 text-2xs font-medium text-ink/80">
                              <span className="font-semibold">{t('dash.fert.perAcreReq')}: </span>
                              N: {steps.perAcreRequirement.n} kg/acre · P₂O₅: {steps.perAcreRequirement.p} kg/acre · K₂O: {steps.perAcreRequirement.k} kg/acre
                            </p>
                          </div>

                          {/* Step 3: Product Breakdown & DAP Nitrogen Credit */}
                          <div className="rounded-xl border border-surface-line bg-white p-3.5 shadow-sm">
                            <p className="font-semibold text-ink flex items-center gap-1.5">
                              <CheckCircle2 className="size-3.5 text-brand" />
                              {t('dash.fert.calcStep3Title')}
                            </p>
                            <ul className="mt-3 space-y-2 text-2xs text-ink/80">
                              {steps.dapStep.dapBagsPerAcre > 0 && (
                                <li className="rounded-lg bg-surface p-2.5">
                                  <p className="font-semibold text-ink">DAP (18% N, 46% P₂O₅)</p>
                                  <p className="mt-0.5">
                                    {t('dash.fert.dapCalcNote', {
                                      pKg: steps.dapStep.p2o5NeededKg,
                                      dapKg: steps.dapStep.dapKgPerAcre,
                                      bags: steps.dapStep.dapBagsPerAcre,
                                    })}
                                  </p>
                                  <p className="mt-1 font-semibold text-ok">
                                    ✓ {t('dash.fert.dapCreditNote', { n: steps.dapStep.nSuppliedKg })}
                                  </p>
                                </li>
                              )}
                              {steps.ureaStep.ureaBagsPerAcre > 0 && (
                                <li className="rounded-lg bg-surface p-2.5">
                                  <p className="font-semibold text-ink">Urea (46% N)</p>
                                  <p className="mt-0.5">
                                    Net N needed = {steps.ureaStep.totalNNeededKg} kg - {steps.ureaStep.nFromDapKg} kg (DAP credit) = {steps.ureaStep.netNNeededKg} kg N/acre.
                                  </p>
                                  <p className="mt-0.5">
                                    {t('dash.fert.ureaCalcNote', {
                                      netN: steps.ureaStep.netNNeededKg,
                                      ureaKg: steps.ureaStep.ureaKgPerAcre,
                                      bags: steps.ureaStep.ureaBagsPerAcre,
                                    })}
                                  </p>
                                </li>
                              )}
                              {steps.mopStep.mopBagsPerAcre > 0 && (
                                <li className="rounded-lg bg-surface p-2.5">
                                  <p className="font-semibold text-ink">MOP (60% K₂O)</p>
                                  <p className="mt-0.5">
                                    {t('dash.fert.mopCalcNote', {
                                      kKg: steps.mopStep.k2oNeededKg,
                                      mopKg: steps.mopStep.mopKgPerAcre,
                                      bags: steps.mopStep.mopBagsPerAcre,
                                    })}
                                  </p>
                                </li>
                              )}
                              {steps.costStep.gypsumCost > 0 && (
                                <li className="rounded-lg bg-surface p-2.5">
                                  <p className="font-semibold text-ink">Gypsum (Ca + S)</p>
                                  <p className="mt-0.5">
                                    {t('dash.fert.gypsumCalcNote', { bags: 4 })}
                                  </p>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Step 4: Subsidized Pricing */}
                          <div className="rounded-xl border border-surface-line bg-white p-3.5 shadow-sm">
                            <p className="font-semibold text-ink flex items-center gap-1.5">
                              <CheckCircle2 className="size-3.5 text-brand" />
                              {t('dash.fert.calcStep4Title')}
                            </p>
                            <p className="mt-1 text-2xs text-ink/60">
                              {t('dash.fert.subsidizedNote')}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-2xs font-medium">
                              <span className="rounded-md bg-surface px-2 py-1">
                                {t('dash.fert.perAcreTotal')}: <strong className="text-ink">{fmt.inr(Math.round(steps.costStep.totalPerAcre))}</strong>
                              </span>
                              {acresValid && (
                                <span className="rounded-md bg-brand-soft px-2 py-1 text-brand">
                                  {t('dash.fert.totalFor', { acres })}: <strong>{fmt.inr(Math.round(steps.costStep.totalPerAcre * acres))}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </>
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
