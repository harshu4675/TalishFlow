import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
  dark = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-8' : 'px-6 py-12',
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            'mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border',
            dark ? 'border-white/10 bg-white/5' : 'border-border bg-surface-muted'
          )}
        >
          <Icon
            className={cn('h-5 w-5', dark ? 'text-white/40' : 'text-foreground-faint')}
            aria-hidden="true"
          />
        </div>
      )}

      {title && (
        <p
          className={cn(
            'mb-1.5 font-bold',
            compact ? 'text-sm' : 'text-[15px]',
            dark ? 'text-white' : 'text-foreground'
          )}
        >
          {title}
        </p>
      )}

      {description && (
        <p
          className={cn(
            'max-w-xs leading-relaxed',
            compact ? 'text-xs' : 'text-sm',
            dark ? 'text-white/40' : 'text-foreground-muted'
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {action && (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              size="sm"
              variant={dark ? 'ghost' : 'outline'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}
