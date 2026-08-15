import { cn } from '@/utils/cn'

const TONES = {
  neutral: 'bg-foreground-faint',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
}

export default function StatusIndicator({
  tone = 'neutral',
  label,
  pulse = false,
  className,
}) {
  return (
    <span
      className={cn(
        'text-foreground-muted inline-flex items-center gap-1.5 text-xs font-semibold',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
              TONES[tone]
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', TONES[tone])} />
      </span>
      {label}
    </span>
  )
}
