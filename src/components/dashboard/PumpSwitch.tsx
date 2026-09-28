import { Loader2, Power } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import type { PumpState } from '@/data/types'
import { useDashboard } from '@/hooks/useDashboard'
import { useFormatters } from '@/hooks/useFormatters'
import { useGlossary } from '@/hooks/useGlossary'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface PumpSwitchProps {
  pump: PumpState
  /** auto-stop duration shown in the confirm dialog */
  minutes: number
  onChange: (next: PumpState) => void
  size?: 'default' | 'lg'
  className?: string
}

/**
 * Pump relay ON/OFF with a confirmation dialog.
 * Used on Overview (compact) and Irrigation & Pump (large).
 */
export function PumpSwitch({ pump, minutes, onChange, size = 'default', className }: PumpSwitchProps) {
  const { t } = useTranslation()
  const { g } = useGlossary()
  const { farmId, farm } = useDashboard()
  const fmt = useFormatters()
  const [target, setTarget] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    if (target === null) return
    setBusy(true)
    try {
      const next = await api.setPump(farmId, target)
      onChange(next)
      toast.success(target ? t('dash.irr.started') : t('dash.irr.stopped'))
      setTarget(null)
    } catch (e) {
      toast.error(t('dash.irr.failed'), { description: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const large = size === 'lg'

  return (
    <>
      <div className={cn('flex items-center gap-4', className)}>
        <span
          className={cn(
            'grid shrink-0 place-items-center rounded-2xl transition-colors',
            large ? 'size-16' : 'size-11',
            pump.on ? 'bg-brand text-white' : 'bg-surface-muted text-ink/60',
          )}
        >
          <Power className={large ? 'size-7' : 'size-5'} />
          <span className="sr-only">{pump.on ? t('dash.common.on') : t('dash.common.off')}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('font-semibold', large ? 'text-xl' : 'text-sm')}>{pump.on ? t('dash.irr.pumpOn') : t('dash.irr.pumpOff')}</p>
          <p className="text-xs text-ink/60">
            {pump.on && pump.since ? t('dash.irr.runningSince', { time: fmt.time(pump.since) }) : t('dash.overview.pumpIdle')}
          </p>
        </div>
        <Switch
          size={size}
          checked={pump.on}
          onCheckedChange={(v) => setTarget(v)}
          aria-label={pump.on ? t('dash.irr.stop') : t('dash.irr.start')}
        />
      </div>

      <Dialog open={target !== null} onOpenChange={(o) => !o && !busy && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{target ? t('dash.irr.confirmOnTitle') : t('dash.irr.confirmOffTitle')}</DialogTitle>
            <DialogDescription>
              {target
                ? t('dash.irr.confirmOnBody', { farm: farm ? g(farm.name) : '', min: minutes })
                : t('dash.irr.confirmOffBody', { farm: farm ? g(farm.name) : '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" shape="rounded" onClick={() => setTarget(null)} disabled={busy}>
              {t('dash.common.cancel')}
            </Button>
            <Button
              shape="rounded"
              onClick={confirm}
              disabled={busy}
              className={target ? 'bg-brand hover:bg-brand-dark' : 'bg-crit hover:bg-crit/90'}
            >
              {busy && <Loader2 className="animate-spin" />}
              {target ? t('dash.irr.start') : t('dash.irr.stop')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
