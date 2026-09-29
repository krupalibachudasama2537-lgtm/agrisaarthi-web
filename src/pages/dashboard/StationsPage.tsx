import { CheckCircle2, Loader2, Network, Power, RotateCcw, Signal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AsyncView, EmptyState, PageHeader, StatusBadge } from '@/components/dashboard/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { MeshData } from '@/data/types'
import { useApi } from '@/hooks/useApi'
import { useGlossary } from '@/hooks/useGlossary'
import { api } from '@/lib/api'
import { computeRoutes, linkKey } from '@/lib/mesh'
import { COLORS } from '@/lib/status'
import { cn } from '@/lib/utils'

/** station that "simulate failure" takes offline, and the neighbour whose standby link takes over its traffic */
const FAIL_NODE = 'AS-01'
const VIA_NODE = 'AS-03'
const REROUTE_DELAY_MS = 1400
const H = 60 // svg height in viewBox units (width 100)

type FailPhase = 'idle' | 'detecting' | 'rerouted'

export default function StationsPage() {
  const { t } = useTranslation()
  const query = useApi(api.getMesh)
  const [phase, setPhase] = useState<FailPhase>('idle')
  const [elapsedSec, setElapsedSec] = useState<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const failed = phase !== 'idle'

  const simulate = () => {
    setPhase('detecting')
    setElapsedSec(null)
    toast.warning(t('dash.mesh.nodeDown', { node: FAIL_NODE }))
    const start = Date.now()
    timeoutRef.current = setTimeout(() => {
      const sec = (Date.now() - start) / 1000
      setElapsedSec(sec)
      setPhase('rerouted')
      toast.success(t('dash.mesh.reroutedBanner', { node: FAIL_NODE, via: VIA_NODE, sec: sec.toFixed(1) }))
    }, REROUTE_DELAY_MS)
  }

  const restore = () => {
    clearTimeout(timeoutRef.current)
    setPhase('idle')
    setElapsedSec(null)
    toast.success(t('dash.mesh.nodeUp', { node: FAIL_NODE }))
  }

  return (
    <>
      <PageHeader
        title={t('dash.mesh.title')}
        subtitle={t('dash.mesh.subtitle')}
        actions={
          query.data?.nodes.length ? (
            <Button
              size="sm"
              shape="rounded"
              variant={failed ? 'outline' : 'default'}
              className={cn(!failed && 'bg-crit hover:bg-crit/90')}
              onClick={failed ? restore : simulate}
            >
              {failed ? <RotateCcw /> : <Power />}
              {failed ? t('dash.mesh.restore', { node: FAIL_NODE }) : t('dash.mesh.simulate', { node: FAIL_NODE })}
            </Button>
          ) : null
        }
      />
      <AsyncView
        query={query}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        }
      >
        {(mesh) =>
          mesh.nodes.length ? (
            <MeshContent mesh={mesh} phase={phase} elapsedSec={elapsedSec} />
          ) : (
            <Card>
              <EmptyState icon={Network} body={t('dash.mesh.empty')} className="py-16" />
            </Card>
          )
        }
      </AsyncView>
    </>
  )
}

function MeshContent({ mesh, phase, elapsedSec }: { mesh: MeshData; phase: FailPhase; elapsedSec: number | null }) {
  const { t } = useTranslation()
  const { g } = useGlossary()
  const down = useMemo(() => (phase === 'idle' ? new Set<string>() : new Set([FAIL_NODE])), [phase])
  const routeOffline = useMemo(() => (phase === 'rerouted' ? new Set([FAIL_NODE]) : new Set<string>()), [phase])
  const routing = useMemo(() => computeRoutes(mesh, routeOffline), [mesh, routeOffline])
  const byId = new Map(mesh.nodes.map((n) => [n.id, n]))

  const activeLinks = mesh.links.filter(([a, b]) => !down.has(a) && !down.has(b) && routing.active.has(linkKey(a, b)))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-col gap-2 sm:flex-row sm:items-center">
          <CardTitle>{t('dash.mesh.graphTitle')}</CardTitle>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink/60">
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-5 rounded-full bg-brand" />
              {t('dash.mesh.route')}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-5 border-t border-dotted border-ink/40" />
              {t('dash.mesh.standby')}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-5 border-t-2 border-dashed border-crit" />
              {t('dash.mesh.broken')}
            </li>
          </ul>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-ink/60">{t('dash.mesh.explainer')}</p>

          <div
            role="status"
            className={cn(
              'mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium',
              phase === 'detecting' ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-ok',
            )}
          >
            {phase === 'detecting' ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <CheckCircle2 className="size-4 shrink-0" />}
            {phase === 'idle' && t('dash.mesh.healthy')}
            {phase === 'detecting' && t('dash.mesh.detecting', { node: FAIL_NODE })}
            {phase === 'rerouted' &&
              t('dash.mesh.reroutedBanner', { node: FAIL_NODE, via: VIA_NODE, sec: (elapsedSec ?? 1.4).toFixed(1) })}
          </div>

          <div className="rounded-2xl bg-[radial-gradient(circle,#E3E7E0_1px,transparent_1.5px)] bg-[length:18px_18px] p-2">
            <svg viewBox={`0 0 100 ${H}`} className="mx-auto h-auto w-full max-w-[720px]" role="img" aria-label={t('dash.mesh.graphTitle')}>
              {mesh.links.map(([a, b]) => {
                const na = byId.get(a)!
                const nb = byId.get(b)!
                const broken = down.has(a) || down.has(b)
                const active = !broken && routing.active.has(linkKey(a, b))
                return (
                  <line
                    key={linkKey(a, b)}
                    x1={na.x}
                    y1={(na.y / 100) * H}
                    x2={nb.x}
                    y2={(nb.y / 100) * H}
                    stroke={broken ? COLORS.crit : active ? COLORS.brand : '#B9C0B6'}
                    strokeWidth={active ? 0.8 : broken ? 0.6 : 0.4}
                    strokeLinecap={active ? 'butt' : 'round'}
                    strokeDasharray={broken ? '1.6 1.2' : active ? undefined : '0.2 1.6'}
                    className="transition-[stroke] duration-500"
                  />
                )
              })}
              {activeLinks.map(([a, b]) => {
                const childId = routing.parent.get(a) === b ? a : b
                const parentId = childId === a ? b : a
                const child = byId.get(childId)!
                const par = byId.get(parentId)!
                const motionPath = `M ${child.x} ${(child.y / 100) * H} L ${par.x} ${(par.y / 100) * H}`
                return (
                  <circle key={`dot-${linkKey(a, b)}`} r={0.9} fill={COLORS.brand}>
                    <animateMotion dur="1.6s" repeatCount="indefinite" path={motionPath} />
                  </circle>
                )
              })}
              {mesh.nodes.map((n) => {
                const isDown = down.has(n.id)
                const cy = (n.y / 100) * H
                return (
                  <g key={n.id}>
                    {!isDown && <circle cx={n.x} cy={cy} r={n.gateway ? 5 : 4} fill={COLORS.brand} opacity={0.12} />}
                    <circle
                      cx={n.x}
                      cy={cy}
                      r={n.gateway ? 3.2 : 2.4}
                      fill={isDown ? '#fff' : n.gateway ? '#1C4427' : COLORS.brand}
                      stroke={isDown ? COLORS.crit : '#fff'}
                      strokeWidth={0.6}
                      className="transition-colors duration-500"
                    />
                    {isDown && (
                      <path
                        d={`M ${n.x - 1.1} ${cy - 1.1} L ${n.x + 1.1} ${cy + 1.1} M ${n.x + 1.1} ${cy - 1.1} L ${n.x - 1.1} ${cy + 1.1}`}
                        stroke={COLORS.crit}
                        strokeWidth={0.5}
                      />
                    )}
                    <text x={n.x} y={cy + (n.gateway ? 6.4 : 5.4)} textAnchor="middle" fontSize="2.4" fontWeight={600} fill={isDown ? COLORS.crit : '#3A4237'}>
                      {n.gateway ? t('dash.mesh.gateway') : n.id}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('dash.mesh.nodes')}</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-3">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('dash.mesh.node')}</TableHead>
                <TableHead>{t('dash.mesh.field')}</TableHead>
                <TableHead>{t('dash.alerts.statusCol')}</TableHead>
                <TableHead className="text-right">{t('dash.mesh.battery')}</TableHead>
                <TableHead>{t('dash.mesh.signal')}</TableHead>
                <TableHead className="text-right">{t('dash.mesh.lastSeen')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mesh.nodes.map((n) => {
                const isDown = down.has(n.id)
                const [, field] = n.name.split(' · ')
                const good = n.rssi > -70
                return (
                  <TableRow key={n.id} className={cn(isDown && 'bg-crit-soft/40 hover:bg-crit-soft/60')}>
                    <TableCell className="whitespace-nowrap font-semibold">{n.gateway ? t('dash.mesh.gateway') : n.id}</TableCell>
                    <TableCell className="whitespace-nowrap text-ink/70">{field ? g(field) : '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={isDown ? 'crit' : 'ok'} label={isDown ? t('dash.mesh.offline') : t('dash.mesh.online')} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{n.battery}%</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-ink/60">
                        <Signal className={cn('size-3.5', isDown ? 'text-ink/25' : good ? 'text-ok' : 'text-warn')} />
                        {isDown ? '—' : good ? t('dash.mesh.signalGood') : t('dash.mesh.signalWeak')}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-xs text-ink/60">
                      {isDown || n.lastSeenMin === 0 ? t('dash.common.justNow') : t('dash.common.minutesAgo', { count: n.lastSeenMin })}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
