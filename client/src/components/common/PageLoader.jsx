import { Zap } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function PageLoader({ label = 'Loading' }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="bg-canvas flex min-h-[100dvh] items-center justify-center p-6"
    >
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="gradient-primary shadow-primary/25 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg">
            <Zap className="h-5 w-5 text-white" fill="white" aria-hidden="true" />
          </div>
          <span className="text-foreground text-lg font-extrabold tracking-tight">
            TalishFlow
          </span>
        </div>

        <div className="border-border bg-surface shadow-card rounded-2xl border p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-9 w-9 rounded-xl" />
          </div>
          <div className="skeleton mb-2 h-7 w-20" />
          <div className="skeleton mb-4 h-3 w-32" />
          <div className="skeleton h-40 w-full rounded-xl" />
        </div>

        <p className={cn('text-foreground-faint mt-4 text-center text-xs font-semibold')}>
          {label}...
        </p>
      </div>
    </div>
  )
}
