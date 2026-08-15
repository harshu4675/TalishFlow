import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'

export default function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this content. Please try again.',
  onRetry,
  compact = false,
  dark = false,
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-8' : 'px-6 py-12',
        className
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border',
          dark ? 'border-white/10 bg-white/5' : 'border-error/20 bg-error-light'
        )}
      >
        <AlertTriangle
          className={cn('h-5 w-5', dark ? 'text-white/40' : 'text-error')}
          aria-hidden="true"
        />
      </div>

      <p
        className={cn(
          'mb-1.5 font-bold',
          compact ? 'text-sm' : 'text-[15px]',
          dark ? 'text-white' : 'text-foreground'
        )}
      >
        {title}
      </p>

      <p
        className={cn(
          'max-w-xs leading-relaxed',
          compact ? 'text-xs' : 'text-sm',
          dark ? 'text-white/40' : 'text-foreground-muted'
        )}
      >
        {description}
      </p>

      {onRetry && (
        <Button
          size="sm"
          variant={dark ? 'secondary' : 'outline'}
          className="mt-5"
          onClick={onRetry}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  )
}
