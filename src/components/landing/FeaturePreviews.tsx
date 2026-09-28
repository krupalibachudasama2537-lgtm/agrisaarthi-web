import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  MessageSquare,
  Phone,
  Power,
  Siren,
  Volume2,
  WifiOff,
  Zap,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IMAGES } from '@/data/images'
import type { FeatureId, StationSnapshot } from '@/data/types'
import { translateTerm } from '@/lib/glossary'
import { cn, formatINR } from '@/lib/utils'

/**
 * Tiny mock-UI previews for each of the 12 feature cards.
 * Each one receives the station snapshot from api.getStationSnapshot().
 */
type PreviewProps = { data: StationSnapshot }

function Row({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex items-center justify-between gap-2', className)}>{children}</div>
}

function Chip({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold', className)}>
      {children}
    </span>
  )
}

function Meter({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
      <div className={cn('h-full rounded-full bg-olive', className)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  )
}

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values)
  const w = 100
  const h = 30
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-8 w-full', className)} preserveAspectRatio="none" aria-hidden>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(217,100,46,0.12)" stroke="none" />
      <polyline points={pts} fill="none" stroke="#D9642E" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/* 1 */
function SoilPreview({ data }: PreviewProps) {
  const { t } = useTranslation()
  const s = data.soil
  const dry = s.moisture < s.dryThreshold
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[
          { label: t('features.preview.moisture'), value: `${s.moisture}%`, warn: dry },
          { label: t('features.preview.temp'), value: `${s.temperature}°` },
          { label: t('features.preview.humidity'), value: `${s.humidity}%` },
        ].map((m) => (
          <div key={m.label} className={cn('rounded-lg bg-white px-1 py-2', m.warn && 'ring-1 ring-alert/50')}>
            <p className={cn('text-base font-semibold leading-none', m.warn && 'text-alert')}>{m.value}</p>
            <p className="mt-1 truncate text-3xs uppercase tracking-wider text-ink/60">{m.label}</p>
          </div>
        ))}
      </div>
      <Row>
        {dry && (
          <Chip className="bg-alert-soft text-alert">
            <AlertTriangle className="size-3" />
            {t('features.preview.tooDry')}
          </Chip>
        )}
        <span className="text-2xs text-ink/60">{t('features.preview.minAgo', { count: s.updatedMinutesAgo })}</span>
      </Row>
    </div>
  )
}

/* 2 */
function ChemistryPreview({ data }: PreviewProps) {
  const { t } = useTranslation()
  const c = data.chemistry
  const pos = ((c.ph - 4) / 6) * 100
  return (
    <div className="space-y-2.5">
      <Row className="text-caption">
        <span className="font-semibold">pH {c.ph}</span>
        <span className="text-ink/60">EC {c.ec} dS/m</span>
      </Row>
      <div className="relative h-2 rounded-full bg-gradient-to-r from-[#e0573b] via-[#e9d85a] via-50% to-[#3f6fb3]">
        <span className="absolute -top-1 size-4 -translate-x-1/2 rounded-full border-2 border-white bg-ink shadow" style={{ left: `${pos}%` }} />
      </div>
      <div className="flex gap-1.5">
        {(['n', 'p', 'k'] as const).map((k) => (
          <span key={k} className="flex-1 rounded-md bg-white px-1.5 py-1 text-center text-2xs">
            <b className="uppercase">{k}</b> {c.npk[k]}
          </span>
        ))}
      </div>
      <p className="text-2xs text-ink/60">✎ {t('features.preview.fromCard')}</p>
    </div>
  )
}

/* 3 */
function FertilizerPreview({ data }: PreviewProps) {
  const { t } = useTranslation()
  const total = data.fertilizer.reduce((sum, f) => sum + f.bagsPerAcre * f.pricePerBag, 0)
  return (
    <div className="text-caption">
      {data.fertilizer.map((f) => (
        <Row key={f.name} className="border-b border-ink/5 py-1.5">
          <span className="font-medium">{translateTerm(t, f.name)}</span>
          <span className="text-ink/60">
            {f.bagsPerAcre} × {f.bagKg} kg
          </span>
          <span className="w-14 text-right font-semibold tabular-nums">{formatINR(f.bagsPerAcre * f.pricePerBag)}</span>
        </Row>
      ))}
      <Row className="pt-2">
        <span className="text-ink/60">{t('features.preview.total')}</span>
        <span className="rounded-md bg-olive-deep px-2 py-0.5 font-semibold text-white tabular-nums">{formatINR(total)}</span>
      </Row>
    </div>
  )
}

/* 4 */
function CropPreview({ data }: PreviewProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-1.5 text-caption">
      {data.crop.top.map((c, i) => (
        <div key={c.name} className="flex items-center gap-2">
          <span className="grid size-4 place-items-center rounded bg-olive-deep text-3xs font-bold text-white">{i + 1}</span>
          <span className="w-[72px] shrink-0 truncate font-medium">{translateTerm(t, c.name)}</span>
          <Meter value={c.suitability} />
          <span className="w-14 shrink-0 text-right font-semibold tabular-nums">{formatINR(c.profitPerAcre)}</span>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-1 pt-1">
        <span className="text-2xs text-ink/60">{t('features.preview.avoid')}:</span>
        {data.crop.avoid.map((a) => (
          <Chip key={a} className="bg-alert-soft text-alert line-through decoration-alert/60">
            {translateTerm(t, a)}
          </Chip>
        ))}
      </div>
    </div>
  )
}

/* 5 */
function DiseasePreview({ data }: PreviewProps) {
  const { t } = useTranslation()
  const d = data.disease
  return (
    <div className="flex gap-3">
      <div className="relative size-[88px] shrink-0 overflow-hidden rounded-lg">
        <img src={IMAGES.leaf} alt="" loading="lazy" className="size-full object-cover" />
        <div className="absolute inset-[22%] border border-white">
          <span className="absolute -left-[3px] -top-[3px] size-1.5 rounded-full bg-white" />
          <span className="absolute -bottom-[3px] -right-[3px] size-1.5 rounded-full bg-white" />
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 text-caption">
        <p className="font-semibold leading-tight">
          {translateTerm(t, d.disease)} <span className="font-normal text-ink/60">· {translateTerm(t, d.crop)}</span>
        </p>
        <div className="flex items-center gap-2">
          <Meter value={d.confidence * 100} />
          <span className="font-semibold tabular-nums">{Math.round(d.confidence * 100)}%</span>
        </div>
        <p className="line-clamp-2 text-2xs leading-snug text-ink/60">{t('features.preview.treatment')}</p>
        {d.offline && (
          <Chip className="bg-ink text-white">
            <WifiOff className="size-3" />
            {t('features.preview.offline')}
          </Chip>
        )}
      </div>
    </div>
  )
}

/* 6 */
function PestPreview({ data }: PreviewProps) {
  const { t } = useTranslation()
  const p = data.pest
  return (
    <div className="space-y-1.5 text-caption">
      <Row>
        <span className="font-semibold">
          {translateTerm(t, p.pest)} <span className="font-normal text-ink/60">· {translateTerm(t, p.crop)}</span>
        </span>
        <span className="font-semibold tabular-nums text-olive-dark">{Math.round(p.confidence * 100)}%</span>
      </Row>
      <p className="line-clamp-1 text-2xs text-ink/60">{t('features.preview.pestDose')}</p>
      <div className="rounded-lg bg-white px-2 pt-1.5">
        <Row className="text-3xs uppercase tracking-wider text-ink/60">
          <span>{t('features.preview.villageTrend')}</span>
          <span className="text-alert">▲ {p.villageTrend.at(-1)?.reports}</span>
        </Row>
        <Sparkline values={p.villageTrend.map((w) => w.reports)} />
      </div>
    </div>
  )
}

/* 7 */
function IrrigationPreview({ data }: PreviewProps) {
  const { t } = useTranslation()
  const ir = data.irrigation
  return (
    <div className="space-y-2.5 text-caption">
      <Row className="rounded-lg bg-white p-2">
        <span className="flex items-center gap-2 font-semibold">
          <Power className="size-3.5 text-olive" />
          {t('features.preview.pump')}
        </span>
        <span
          className={cn(
            'relative inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors',
            ir.pumpOn ? 'bg-olive' : 'bg-ink/20',
          )}
        >
          <span className="sr-only">{ir.pumpOn ? t('features.preview.on') : t('features.preview.off')}</span>
          <span className={cn('size-4 rounded-full bg-white shadow transition-transform', ir.pumpOn && 'translate-x-4')} />
        </span>
      </Row>
      <Row>
        <Chip className="bg-olive-deep text-white">{t('features.preview.run', { min: ir.recommendedMinutes })}</Chip>
        <span className="text-ink/60">{t('features.preview.rain', { pct: ir.rainChance })}</span>
      </Row>
      <p className="text-2xs text-ink/60">
        {translateTerm(t, ir.soilType)} · {translateTerm(t, ir.cropStage)} · {ir.moisture}%
      </p>
    </div>
  )
}

/* 8 */
function MeshPreview({ data }: PreviewProps) {
  const { t } = useTranslation()
  const nodes = new Map(data.mesh.nodes.map((n) => [n.id, n]))
  const online = data.mesh.nodes.filter((n) => n.online).length
  return (
    <div>
      <svg viewBox="0 0 100 56" className="h-[76px] w-full" aria-hidden>
        {data.mesh.links.map(([a, b]) => {
          const na = nodes.get(a)!
          const nb = nodes.get(b)!
          const broken = !na.online || !nb.online
          return (
            <line
              key={`${a}-${b}`}
              x1={na.x}
              y1={na.y * 0.56}
              x2={nb.x}
              y2={nb.y * 0.56}
              stroke={broken ? '#D9642E' : '#5E7A2E'}
              strokeWidth="0.8"
              strokeDasharray={broken ? '2 2' : undefined}
              opacity={broken ? 0.7 : 0.6}
            />
          )
        })}
        {data.mesh.nodes.map((n) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y * 0.56}
            r={n.gateway ? 4 : 2.6}
            fill={n.online ? (n.gateway ? '#1F4D1F' : '#5E7A2E') : '#fff'}
            stroke={n.online ? 'white' : '#D9642E'}
            strokeWidth="1"
          />
        ))}
      </svg>
      <Row className="text-2xs">
        <span className="text-ink/60">{t('features.preview.nodes', { online, total: data.mesh.nodes.length })}</span>
        <Chip className="bg-lime-soft text-olive-deep">{t('features.preview.rerouted')}</Chip>
      </Row>
    </div>
  )
}

/* 9 */
function AlertsPreview({ data }: PreviewProps) {
  const { t } = useTranslation()
  const sms = data.alerts.find((a) => a.channel === 'sms')
  return (
    <div className="space-y-2 text-caption">
      {sms && (
        <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 shadow-sm">
          <p className="flex items-center gap-1 text-3xs font-semibold uppercase tracking-wider text-ink/60">
            <MessageSquare className="size-3" /> SMS · {sms.time}
          </p>
          <p className="mt-0.5 leading-snug">{t('features.preview.sms')}</p>
        </div>
      )}
      <div className="flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-white">
        <span className="grid size-6 place-items-center rounded-full bg-olive">
          <Phone className="size-3" />
        </span>
        <span className="flex-1">
          <span className="block text-3xs uppercase tracking-wider text-white/50">{t('features.preview.incomingCall')}</span>
          AgriSaarthi
        </span>
        <span className="grid size-6 place-items-center rounded-full bg-lime text-ink">
          <Phone className="size-3" />
        </span>
      </div>
    </div>
  )
}

/* 10 */
const WAVE = [4, 9, 14, 7, 18, 11, 6, 15, 20, 9, 13, 5, 16, 10, 7, 12, 4]
function VoicePreview({ data }: PreviewProps) {
  const { t } = useTranslation()
  const v = data.voice
  return (
    <div className="space-y-2.5 text-caption">
      <div className="flex gap-1.5">
        {v.languages.map((l) => (
          <Chip key={l} className={l === v.active ? 'bg-olive-deep text-white' : 'bg-white text-ink/60'}>
            {l === 'gu' ? 'ગુજરાતી' : l === 'hi' ? 'हिन्दी' : 'English'}
          </Chip>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2">
        <Volume2 className="size-4 shrink-0 text-olive" />
        <div className="flex h-5 flex-1 items-center gap-[3px]">
          {WAVE.map((h, i) => (
            <span key={i} className="w-[3px] rounded-full bg-olive/70" style={{ height: `${h + 2}px` }} />
          ))}
        </div>
        <span className="text-3xs uppercase tracking-wider text-ink/60">{t('features.preview.speaking')}</span>
      </div>
      <p className="truncate text-caption text-ink/70">“{v.sample}”</p>
    </div>
  )
}

/* 11 */
function AnimalPreview({ data }: PreviewProps) {
  const { t } = useTranslation()
  const a = data.animal
  return (
    <div className="flex gap-3">
      <div className="relative h-[88px] w-[104px] shrink-0 overflow-hidden rounded-lg bg-[#0d1a10]">
        <img src={IMAGES.darkSoil} alt="" loading="lazy" className="size-full object-cover opacity-50 mix-blend-screen grayscale" />
        <div className="absolute inset-0 bg-[#3aff6a]/15" />
        <div className="absolute left-[30%] top-[28%] h-[44%] w-[42%] border border-lime">
          <span className="absolute -top-3.5 left-0 whitespace-nowrap bg-lime px-1 text-3xs font-bold text-ink">
            {Math.round(a.confidence * 100)}%
          </span>
        </div>
        <span className="absolute bottom-1 left-1.5 font-mono text-3xs text-lime/90">IR · {a.time}</span>
        <Camera className="absolute right-1.5 top-1.5 size-3 text-lime/80" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 text-caption">
        <p className="font-semibold leading-tight">{translateTerm(t, a.animal)}</p>
        <div className="flex flex-wrap gap-1">
          {a.sirenOn && (
            <Chip className="bg-alert text-white">
              <Siren className="size-3" />
              {t('features.preview.siren')}
            </Chip>
          )}
          {a.strobeOn && (
            <Chip className="bg-lime text-ink">
              <Zap className="size-3" />
              {t('features.preview.strobe')}
            </Chip>
          )}
        </div>
        <div className="flex gap-1.5 text-ink/60">
          <Phone aria-hidden className="size-3.5" />
          <span className="sr-only">{t('features.preview.callMade')}</span>
          <MessageSquare aria-hidden className="size-3.5" />
          <span className="sr-only">{t('features.preview.smsSent')}</span>
          <ImageIcon aria-hidden className="size-3.5" />
          <span className="sr-only">{t('features.preview.photoSaved')}</span>
          <CheckCircle2 aria-hidden className="size-3.5 text-olive" />
          <span className="sr-only">{t('features.preview.confirmed')}</span>
        </div>
      </div>
    </div>
  )
}

/* 12 */
function GrainPreview({ data }: PreviewProps) {
  const { t } = useTranslation()
  const g = data.grain
  return (
    <div className="space-y-2 text-caption">
      <Row>
        <span>
          <b>{translateTerm(t, g.crop)}</b> · {g.moisture}% <span className="text-ink/60">/ {g.safeMax}%</span>
        </span>
        {g.ready && (
          <Chip className="bg-lime text-ink">
            <CheckCircle2 className="size-3" />
            {t('features.preview.ready')}
          </Chip>
        )}
      </Row>
      <div>
        {g.mandi.slice(0, 2).map((m) => (
          <Row key={m.market} className="border-b border-ink/5 py-1">
            <span className="truncate">{translateTerm(t, m.market)}</span>
            <span className="flex items-center gap-2 tabular-nums">
              <b>{formatINR(m.pricePerQuintal)}</b>
              <span className={m.change >= 0 ? 'text-olive-dark' : 'text-alert'}>
                {m.change >= 0 ? '▲' : '▼'} {Math.abs(m.change)}%
              </span>
            </span>
          </Row>
        ))}
      </div>
      <p className="text-2xs text-ink/60">{t('features.preview.bestDay', { market: translateTerm(t, g.bestMarket), day: translateTerm(t, g.bestDay) })}</p>
    </div>
  )
}

const PREVIEWS: Record<FeatureId, ComponentType<PreviewProps>> = {
  soil: SoilPreview,
  chemistry: ChemistryPreview,
  fertilizer: FertilizerPreview,
  crop: CropPreview,
  disease: DiseasePreview,
  pest: PestPreview,
  irrigation: IrrigationPreview,
  mesh: MeshPreview,
  alerts: AlertsPreview,
  voice: VoicePreview,
  animal: AnimalPreview,
  grain: GrainPreview,
}

/** Renders the mock preview for one feature card */
export function FeaturePreview({ id, data }: { id: FeatureId; data: StationSnapshot }) {
  const Preview = PREVIEWS[id]
  return <Preview data={data} />
}
