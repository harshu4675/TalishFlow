import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react'
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
    icon: 'text-[#22C55E]',
    bg: 'bg-[#22C55E]/10',
    border: 'border-[#388E3C]/20',
    progress: 'bg-[#22C55E]',
  },
  [NOTIFICATION_TYPES.ERROR]: {
    icon: 'text-[#EF4444]',
    bg: 'bg-[#EF4444]/10',
    border: 'border-[#FF6161]/20',
    progress: 'bg-[#EF4444]',
  },
  [NOTIFICATION_TYPES.WARNING]: {
    icon: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10',
    border: 'border-[#FF9F00]/20',
    progress: 'bg-[#F59E0B]',
  },
  [NOTIFICATION_TYPES.INFO]: {
    icon: 'text-[#2874F0]',
    bg: 'bg-[#2874F0]/10',
    border: 'border-[#2874F0]/20',
    progress: 'bg-[#2874F0]',
  },
  [NOTIFICATION_TYPES.PROGRESS]: {
    icon: 'text-[#2874F0]',
    bg: 'bg-[#2874F0]/10',
    border: 'border-[#2874F0]/20',
    progress: 'bg-[#2874F0]',
  },
}

function Toast({ notification, onRemove }) {
  const { id, type, title, message, meta, persistent } = notification
  const Icon = ICONS[type] || Info
  const style = STYLES[type] || STYLES[NOTIFICATION_TYPES.INFO]
  const isSpinning = type === NOTIFICATION_TYPES.PROGRESS

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.94 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative w-80 rounded-2xl border bg-white overflow-hidden',
        'shadow-float',
        style.border
      )}
      role="alert"
      aria-live="polite"
    >
      {meta?.progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', style.progress)}
            animate={{ width: `${meta.progress}%` }}
            transition={{ ease: 'linear', duration: 0.3 }}
          />
        </div>
      )}

      <div className="flex items-start gap-3 p-4">
        <div
          className={cn(
            'mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
            style.bg
          )}
        >
          <Icon
            className={cn(
              'w-4 h-4',
              style.icon,
              isSpinning && 'animate-spin'
            )}
            aria-hidden="true"
          />
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-bold text-[#212121] leading-snug">
              {title}
            </p>
          )}
          {message && (
            <p className="text-xs text-[#878787] mt-0.5 leading-relaxed">
              {message}
            </p>
          )}

          {meta?.progress !== undefined && (
            <p className="text-xs text-[#2874F0] font-semibold mt-1.5">
              {meta.progress}% complete
            </p>
          )}
        </div>

        {!persistent && (
          <button
            onClick={() => onRemove(id)}
            className="flex-shrink-0 -mt-0.5 -mr-0.5 p-1.5 rounded-lg text-[#878787] hover:text-[#212121] hover:bg-[#F8F9FA] transition-all"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
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
      className="fixed bottom-6 right-6 z-toast flex flex-col gap-2.5 pointer-events-none max-h-[calc(100dvh-100px)] overflow-hidden"
    >
      <AnimatePresence mode="popLayout">
        {notifications.slice(-5).map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <Toast notification={notification} onRemove={remove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}