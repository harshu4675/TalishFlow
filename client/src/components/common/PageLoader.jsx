import { Logo } from '@/components/brand/Logo'
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
          <Logo className="animate-pulse h-10 w-10" />
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

        <div className="tf-loader-bar mx-auto mt-4 h-1 w-40 overflow-hidden rounded-full">
          <div className="tf-loader-bar-fill" />
        </div>
        <p className={cn('text-foreground-faint sr-only mt-4 text-center text-xs font-semibold')}>
          {label}…
        </p>
      </div>
    </div>
  )
}
