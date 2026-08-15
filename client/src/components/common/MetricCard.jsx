import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/formatters'
import { Skeleton } from '@/components/ui/skeleton'

function ChangeBadge({ change }) {
  if (change === null || change === undefined) return null

  const isPositive = change >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold',
        isPositive ? 'bg-success-light text-success-dark' : 'bg-error-light text-error'
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
      ) : (
        <TrendingDown className="h-3 w-3" aria-hidden="true" />
      )}
      {isPositive ? '+' : ''}
      {change}%
    </span>
  )
}

export default function MetricCard({
  label,
  value,
  change,
  context,
  icon,
  isLoading = false,
  className,
}) {
  const Icon = icon
  if (isLoading) {
    return (
      <div
        className={cn(
          'border-border bg-surface shadow-card rounded-2xl border p-5',
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
        <Skeleton className="mb-2 h-8 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group border-border bg-surface shadow-card hover:border-primary/30 hover:shadow-float relative overflow-hidden rounded-2xl border p-5 transition-all duration-200',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <p className="text-foreground-muted pt-1 text-xs font-bold tracking-wider uppercase">
          {label}
        </p>
        {Icon && (
          <div className="bg-primary-light text-primary flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105">
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
        )}
      </div>

      <p className="text-foreground mb-2 text-[28px] leading-none font-black tracking-tight">
        {formatNumber(value ?? 0)}
      </p>

      {(change !== undefined || context) && (
        <div className="flex items-center gap-2">
          <ChangeBadge change={change} />
          {context && (
            <span className="text-foreground-faint truncate text-[11px] font-medium">
              {context}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
