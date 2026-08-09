import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

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
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-8' : 'px-6 py-14',
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            'mb-5 flex h-12 w-12 items-center justify-center rounded-2xl',
            dark ? 'bg-white/10' : 'bg-[#F8F9FA]'
          )}
        >
          <Icon
            className={cn('h-5 w-5', dark ? 'text-white/40' : 'text-[#878787]')}
            aria-hidden="true"
          />
        </div>
      )}

      {title && (
        <p
          className={cn(
            'mb-2 font-bold',
            compact ? 'text-sm' : 'text-[15px]',
            dark ? 'text-white' : 'text-[#212121]'
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
            dark ? 'text-white/40' : 'text-[#878787]'
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150',
                'focus-visible:ring-primary/50 shadow-md focus-visible:ring-2 focus-visible:outline-none',
                'bg-[#2874F0] hover:bg-[#1B5FCC] shadow-primary/20 text-white'
              )}
            >
              {action.label}
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={cn(
                'rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150',
                dark
                  ? 'text-white/60 hover:bg-white/10 hover:text-white'
                  : 'text-[#878787] hover:text-[#212121] hover:bg-[#F8F9FA] border-[#E0E0E0] border'
              )}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
