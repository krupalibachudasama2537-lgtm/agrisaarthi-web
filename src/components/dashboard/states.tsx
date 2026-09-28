import { AlertTriangle, Inbox, RefreshCw, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Status } from '@/data/types'
import { cn } from '@/lib/utils'

/* ---------- page header ---------- */

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink/60">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ---------- empty / error / loading ---------- */

export function EmptyState({
  icon: Icon = Inbox,
  title,
  body,
  action,
  className,
}: {
  icon?: LucideIcon
  title?: string
  body: string
  action?: ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      <span className="grid size-11 place-items-center rounded-2xl bg-surface-muted text-ink/60">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-semibold">{title ?? t('dash.common.emptyTitle')}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink/60">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry, className }: { error?: Error | null; onRetry?: () => void; className?: string }) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <span className="grid size-11 place-items-center rounded-2xl bg-crit-soft text-crit">
        <AlertTriangle className="size-5" />
      </span>
      <p className="mt-3 text-sm font-semibold">{t('dash.common.errorTitle')}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink/60">{t('dash.common.errorBody')}</p>
      {error?.message && (
        <p lang="en" className="mt-2 font-mono text-caption text-ink/60">
          {error.message}
        </p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" shape="rounded" className="mt-4" onClick={onRetry}>
          <RefreshCw />
          {t('dash.common.retry')}
        </Button>
      )}
    </Card>
  )
}

/** Generic page skeleton: a row of small cards + two large blocks */
export function PageSkeleton({ kpis = 4 }: { kpis?: number }) {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className={cn('grid gap-3', kpis >= 6 ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6' : 'grid-cols-2 lg:grid-cols-4')}>
        {Array.from({ length: kpis }, (_, i) => (
          <Card key={i} className="space-y-3 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-4 p-5 lg:col-span-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-56 w-full" />
        </Card>
        <Card className="space-y-3 p-5">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      </div>
    </div>
  )
}

/**
 * Renders skeleton → error → content for a useApi() result.
 * `children` only runs once data is present.
 */
export function AsyncView<T>({
  query,
  skeleton,
  children,
}: {
  query: { data: T | null; error: Error | null; loading: boolean; reload: () => void }
  skeleton?: ReactNode
  children: (data: T) => ReactNode
}) {
  if (query.error) return <ErrorState error={query.error} onRetry={query.reload} />
  if (query.loading || query.data === null) return <>{skeleton ?? <PageSkeleton />}</>
  return <>{children(query.data)}</>
}

/* ---------- status helpers ---------- */

export function StatusBadge({ status, label, className }: { status: Status; label?: string; className?: string }) {
  const { t } = useTranslation()
  return (
    <Badge variant={status} className={className}>
      <StatusDot status={status} />
      {label ?? t(`dash.common.status.${status}`)}
    </Badge>
  )
}

export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-1.5 shrink-0 rounded-full',
        status === 'ok' && 'bg-ok',
        status === 'warn' && 'bg-warn',
        status === 'crit' && 'bg-crit',
        className,
      )}
    />
  )
}
