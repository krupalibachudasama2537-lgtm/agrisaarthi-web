import { Cpu, RefreshCw, RotateCcw, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DiagnosisPhase } from '@/hooks/useDiagnosis'
import { cn } from '@/lib/utils'

/** Uploaded photo with a scan-frame overlay while the offline model runs */
export function PhotoPreview({ src, phase, onReset }: { src: string; phase: DiagnosisPhase; onReset: () => void }) {
  const { t } = useTranslation()
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] bg-ink">
        <img src={src} alt={t('dash.doctor.photoAlt')} className="size-full object-cover" />
        {/* corner frame */}
        <div aria-hidden className="absolute inset-[12%] rounded-xl border-2 border-white/80">
          {phase === 'analyzing' && (
            <span className="absolute inset-x-0 top-0 h-0.5 animate-[scan_1.6s_ease-in-out_infinite] bg-lime shadow-[0_0_12px_2px_rgba(198,227,107,0.8)]" />
          )}
        </div>
        <Badge variant="default" className="absolute left-3 top-3 bg-ink/70 backdrop-blur">
          <WifiOff />
          {t('dash.doctor.offline')}
        </Badge>
      </div>
      <div className="flex items-center justify-end p-3">
        <Button variant="outline" size="sm" shape="rounded" onClick={onReset} disabled={phase === 'analyzing'}>
          <RotateCcw />
          {t('dash.doctor.newScan')}
        </Button>
      </div>
    </Card>
  )
}

/** "Analyzing offline…" card with a 2 s progress bar */
export function AnalyzingCard() {
  const { t } = useTranslation()
  return (
    <Card className="p-5" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
          <Cpu className="size-5 animate-pulse" />
        </span>
        <div>
          <p className="text-sm font-semibold">{t('dash.doctor.analyzing')}</p>
          <p className="text-xs text-ink/60">{t('dash.doctor.analyzingHint')}</p>
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink/[0.07]">
        <div className="h-full animate-grow-x rounded-full bg-brand" />
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </Card>
  )
}

export function AnalysisError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="p-6 text-center">
      <p className="text-sm font-semibold text-crit">{t('dash.doctor.failed')}</p>
      {message && (
        <p lang="en" className="mt-1 font-mono text-caption text-ink/60">
          {message}
        </p>
      )}
      <Button variant="outline" size="sm" shape="rounded" className="mt-4" onClick={onRetry}>
        <RefreshCw />
        {t('dash.common.retry')}
      </Button>
    </Card>
  )
}

export function ConfidenceBar({ value, className }: { value: number; className?: string }) {
  const { t } = useTranslation()
  const pct = Math.round(value * 100)
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ink/60">{t('dash.doctor.confidence')}</span>
        <span className="font-semibold tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink/[0.07]">
        <div className={cn('h-full rounded-full', pct >= 85 ? 'bg-ok' : pct >= 70 ? 'bg-warn' : 'bg-crit')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
