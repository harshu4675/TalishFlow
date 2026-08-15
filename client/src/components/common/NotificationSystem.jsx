import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { useNotificationContext, NOTIFICATION_TYPES } from '@/context/NotificationContext'
import { cn } from '@/utils/cn'

const ICONS = {
  [NOTIFICATION_TYPES.SUCCESS]: CheckCircle2,
  [NOTIFICATION_TYPES.ERROR]: AlertCircle,
  [NOTIFICATION_TYPES.WARNING]: AlertTriangle,
  [NOTIFICATION_TYPES.INFO]: Info,
  [NOTIFICATION_TYPES.PROGRESS]: Loader2,
}

const STYLES = {
  [NOTIFICATION_TYPES.SUCCESS]: {
    icon: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success-dark/20',
  },
  [NOTIFICATION_TYPES.ERROR]: {
    icon: 'text-error',
    bg: 'bg-error/10',
    border: 'border-error/20',
  },
  [NOTIFICATION_TYPES.WARNING]: {
    icon: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
  [NOTIFICATION_TYPES.INFO]: {
    icon: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  [NOTIFICATION_TYPES.PROGRESS]: {
    icon: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
}

function Toast({ notification, onRemove }) {
  const { id, type, title, message, meta } = notification
  const Icon = ICONS[type]
  const style = STYLES[type]

  return (
    <motion.div
      key={id}
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'bg-surface shadow-float relative w-80 rounded-2xl border',
        'overflow-hidden p-4',
        style.border
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn('mt-0.5 flex-shrink-0 rounded-lg p-1.5', style.bg)}>
          <Icon
            className={cn(
              'h-4 w-4',
              style.icon,
              type === NOTIFICATION_TYPES.PROGRESS && 'animate-spin'
            )}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {title && (
            <p className="text-foreground text-sm leading-snug font-semibold">{title}</p>
          )}
          {message && (
            <p className="text-foreground-muted mt-0.5 text-sm leading-snug">{message}</p>
          )}

          {/* Progress Bar */}
          {meta?.progress !== undefined && (
            <div className="bg-surface-muted mt-2 h-1.5 overflow-hidden rounded-full">
              <motion.div
                className="bg-primary h-full rounded-full"
                animate={{ width: `${meta.progress}%` }}
                transition={{ ease: 'linear', duration: 0.3 }}
              />
            </div>
          )}
        </div>

        {/* Close Button */}
        {!notification.persistent && (
          <button
            onClick={() => onRemove(id)}
            className="text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-all-fast -mt-0.5 -mr-0.5 flex-shrink-0 rounded-lg p-1.5"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function NotificationSystem() {
  const { notifications, remove } = useNotificationContext()

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="z-toast pointer-events-none fixed right-6 bottom-6 flex flex-col gap-3"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <Toast notification={notification} onRemove={remove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
