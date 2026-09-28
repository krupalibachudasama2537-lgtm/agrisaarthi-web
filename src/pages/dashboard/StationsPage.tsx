import { CheckCircle2, GitBranch, Network, Power, RotateCcw, Signal } from 'lucide-react'
import { useMemo, useState } from 'react'
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

/** station that the "simulate failure" button takes offline */
const FAIL_NODE = 'AS-04'
const H = 60 // svg height in viewBox units (width 100)

export default function StationsPage() {
  const { t } = useTranslation()
  const query = useApi(api.getMesh)
  const [offline, setOffline] = useState<Set<string>>(new Set())
  const failed = offline.has(FAIL_NODE)

  const toggle = () => {
    setOffline((prev) => {
      const next = new Set(prev)
      if (next.has(FAIL_NODE)) next.delete(FAIL_NODE)
      else next.add(FAIL_NODE)
      return next
    })
    if (failed) toast.success(t('dash.mesh.nodeUp', { node: FAIL_NODE }))
    else toast.warning(t('dash.mesh.nodeDown', { node: FAIL_NODE }))
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
              onClick={toggle}
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
            <MeshContent mesh={mesh} offline={offline} />
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

function MeshContent({ mesh, offline }: { mesh: MeshData; offline: Set<string> }) {
  const { t } = useTranslation()
  const { g } = useGlossary()
  const baseline = useMemo(() => computeRoutes(mesh, new Set()), [mesh])
  const routing = useMemo(() => computeRoutes(mesh, offline), [mesh, offline])
  const byId = new Map(mesh.nodes.map((n) => [n.id, n]))

  const rerouted = mesh.nodes
    .filter((n) => !offline.has(n.id) && !n.gateway)
    .filter((n) => (routing.path.get(n.id) ?? []).join() !== (baseline.path.get(n.id) ?? []).join())
    .map((n) => n.id)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-col gap-2 sm:flex-row sm:items-center">
          <CardTitle>{t('dash.mesh.graphTitle')}</CardTitle>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink/60">
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-5 rounded bg-brand" />
              {t('dash.mesh.route')}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-5 border-t border-dashed border-ink/30" />
              {t('dash.mesh.standby')}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-5 border-t-2 border-dashed border-crit" />
              {t('dash.mesh.broken')}
            </li>
          </ul>
        </CardHeader>
        <CardContent>
          <div
            role="status"
            className={cn(
              'mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium',
              rerouted.length ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-ok',
            )}
          >
            {rerouted.length ? <GitBranch className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
            {rerouted.length ? t('dash.mesh.rerouted', { nodes: rerouted.join(', ') }) : t('dash.mesh.healthy')}
          </div>

          <div className="rounded-2xl bg-[radial-gradient(circle,#E3E7E0_1px,transparent_1.5px)] bg-[length:18px_18px] p-2">
            <svg viewBox={`0 0 100 ${H}`} className="mx-auto h-auto w-full max-w-[720px]" role="img" aria-label={t('dash.mesh.graphTitle')}>
              {mesh.links.map(([a, b]) => {
                const na = byId.get(a)!
                const nb = byId.get(b)!
                const broken = offline.has(a) || offline.has(b)
                const active = routing.active.has(linkKey(a, b))
                return (
                  <line
                    key={linkKey(a, b)}
                    x1={na.x}
                    y1={(na.y / 100) * H}
                    x2={nb.x}
                    y2={(nb.y / 100) * H}
                    stroke={broken ? COLORS.crit : active ? COLORS.brand : '#B9C0B6'}
                    strokeWidth={active ? 0.7 : 0.35}
                    strokeDasharray={broken ? '1.2 1.2' : active ? '2 1' : '0.8 0.8'}
                    className={cn('transition-[stroke] duration-500', active && 'animate-dash-flow')}
                  />
                )
              })}
              {mesh.nodes.map((n) => {
                const down = offline.has(n.id)
                const cy = (n.y / 100) * H
                return (
                  <g key={n.id}>
                    {!down && <circle cx={n.x} cy={cy} r={n.gateway ? 5 : 4} fill={COLORS.brand} opacity={0.12} />}
                    <circle
                      cx={n.x}
                      cy={cy}
                      r={n.gateway ? 3.2 : 2.4}
                      fill={down ? '#fff' : n.gateway ? '#1C4427' : COLORS.brand}
                      stroke={down ? COLORS.crit : '#fff'}
                      strokeWidth={0.6}
                      className="transition-colors duration-500"
                    />
                    {down && (
                      <path d={`M ${n.x - 1.1} ${cy - 1.1} L ${n.x + 1.1} ${cy + 1.1} M ${n.x + 1.1} ${cy - 1.1} L ${n.x - 1.1} ${cy + 1.1}`} stroke={COLORS.crit} strokeWidth={0.5} />
                    )}
                    <text x={n.x} y={cy + (n.gateway ? 6.4 : 5.4)} textAnchor="middle" fontSize="2.4" fontWeight={600} fill={down ? COLORS.crit : '#3A4237'}>
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
                <TableHead>{t('dash.alerts.statusCol')}</TableHead>
                <TableHead className="text-right">{t('dash.mesh.battery')}</TableHead>
                <TableHead>{t('dash.mesh.signal')}</TableHead>
                <TableHead>{t('dash.mesh.path')}</TableHead>
                <TableHead className="text-right">{t('dash.mesh.lastSeen')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mesh.nodes.map((n) => {
                const down = offline.has(n.id)
                const path = routing.path.get(n.id)
                const bars = n.rssi > -60 ? 4 : n.rssi > -70 ? 3 : n.rssi > -80 ? 2 : 1
                return (
                  <TableRow key={n.id} className={cn(down && 'bg-crit-soft/40 hover:bg-crit-soft/60')}>
                    <TableCell className="whitespace-nowrap font-semibold">{g(n.name)}</TableCell>
                    <TableCell>
                      <StatusBadge status={down ? 'crit' : 'ok'} label={down ? t('dash.mesh.offline') : t('dash.mesh.online')} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{n.battery}%</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-ink/60">
                        <Signal className={cn('size-3.5', down ? 'text-ink/25' : bars >= 3 ? 'text-ok' : 'text-warn')} />
                        {down ? '—' : `${n.rssi} dBm`}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {n.gateway ? (
                        <span className="text-ink/60">—</span>
                      ) : path ? (
                        <span className={cn(rerouted.includes(n.id) && 'font-semibold text-warn')}>
                          {path.join(' → ')} <span className="text-ink/60">({t('dash.mesh.hops')}: {path.length - 1})</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-crit">{t('dash.mesh.unreachable')}</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-xs text-ink/60">
                      {down || n.lastSeenMin === 0 ? t('dash.common.justNow') : t('dash.common.minutesAgo', { count: n.lastSeenMin })}
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
