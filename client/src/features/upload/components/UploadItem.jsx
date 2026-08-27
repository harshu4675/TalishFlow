import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileVideo,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatFileSize } from '@/utils/formatters'
import Progress from '@/components/ui/progress'

const statusConfig = {
  preparing: { label: 'Preparing upload', icon: Clock, color: 'text-foreground-muted', spinning: false },
  uploading: { label: 'Uploading', icon: Loader2, color: 'text-primary', spinning: true },
  finalizing: {
    label: 'Finalizing upload',
    icon: Loader2,
    color: 'text-primary',
    spinning: true,
  },
  importing: {
    label: 'Adding YouTube video',
    icon: Loader2,
    color: 'text-primary',
    spinning: true,
  },
  queued: { label: 'Queued for processing', icon: CheckCircle2, color: 'text-success', spinning: false },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-success', spinning: false },
  failed: { label: 'Upload failed', icon: AlertCircle, color: 'text-error', spinning: false },
  cancelled: { label: 'Cancelled', icon: AlertCircle, color: 'text-foreground-faint', spinning: false },
}

export default function UploadItem({ upload, onCancel, onRemove, onRetry }) {
  const config = statusConfig[upload.status] || statusConfig.preparing
  const Icon = config.icon
  const isActive = ['preparing', 'uploading', 'finalizing', 'importing'].includes(
    upload.status
  )
  const isTerminal = ['queued', 'completed', 'failed', 'cancelled'].includes(
    upload.status
  )
  const canRetry = upload.status === 'failed' && upload.kind === 'file'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="border-border bg-surface-muted/60 flex items-center gap-3 rounded-xl border p-3"
    >
      <div className="border-border bg-surface flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border">
        {upload.thumbnailUrl ? (
          <img
            src={upload.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <FileVideo className="text-primary h-4 w-4" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-foreground truncate text-xs font-bold">{upload.name}</p>
          <motion.span
            className={cn(
              'flex flex-shrink-0 items-center gap-1 text-[11px] font-semibold',
              config.color
            )}
            initial={false}
            animate={config.spinning ? { scale: [1, 1.05, 1] } : {}}
            transition={config.spinning ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
          >
            <Icon
              className={cn('h-3.5 w-3.5', config.spinning && 'animate-spin')}
              aria-hidden="true"
            />
            {config.label}
          </motion.span>
        </div>

        {upload.kind === 'file' && (
          <p className="text-foreground-faint mt-0.5 truncate text-[11px]">
            {formatFileSize(upload.size || 0)}
            {upload.status === 'uploading' && ` · ${upload.progress || 0}%`}
          </p>
        )}

        {isActive && upload.kind === 'file' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Progress 
              value={upload.progress || 0} 
              className="mt-2"
              getValueLabel={(value) => `${Math.round(value)}%`}
            />
          </motion.div>
        )}

        {upload.error && (
          <p className="text-error mt-1 truncate text-[11px]">{upload.error}</p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        {canRetry && (
          <button
            onClick={() => onRetry(upload.id)}
            className="text-foreground-muted hover:bg-surface hover:text-primary rounded-lg p-1.5 transition-colors"
            aria-label={`Retry upload for ${upload.name}`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {isActive ? (
          <button
            onClick={() => onCancel(upload.id)}
            className="text-foreground-muted hover:bg-error-light hover:text-error rounded-lg p-1.5 transition-colors"
            aria-label={`Cancel upload for ${upload.name}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : isTerminal ? (
          <button
            onClick={() => onRemove(upload.id)}
            className="text-foreground-muted hover:bg-surface hover:text-foreground rounded-lg p-1.5 transition-colors"
            aria-label={`Remove ${upload.name} from upload list`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </motion.div>
  )
}
