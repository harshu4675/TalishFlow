import { CheckCircle2, AlertCircle, Loader2, X, FileVideo, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatFileSize } from '@/utils/formatters'
import { motion } from 'framer-motion'

const statusConfig = {
  preparing: {
    label: 'Preparing upload',
    icon: Clock,
    color: 'text-foreground-muted',
  },
  uploading: {
    label: 'Uploading',
    icon: Loader2,
    color: 'text-primary',
    spinning: true,
  },
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
  queued: {
    label: 'Queued for processing',
    icon: CheckCircle2,
    color: 'text-success',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-success',
  },
  failed: {
    label: 'Upload failed',
    icon: AlertCircle,
    color: 'text-error',
  },
  cancelled: {
    label: 'Cancelled',
    icon: AlertCircle,
    color: 'text-foreground-muted',
  },
}

export default function UploadProgress({ upload, onCancel, onRemove }) {
  const config = statusConfig[upload.status] || statusConfig.preparing
  const Icon = config.icon
  const isActive = ['preparing', 'uploading', 'finalizing', 'importing'].includes(
    upload.status
  )
  const isTerminal = ['queued', 'completed', 'failed', 'cancelled'].includes(
    upload.status
  )

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-surface-muted border-border flex items-center gap-3 rounded-xl border p-3"
    >
      <div className="bg-surface border-border flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border">
        {upload.thumbnailUrl ? (
          <img src={upload.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <FileVideo className="text-primary h-4 w-4" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-foreground truncate text-xs font-bold">{upload.name}</p>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <Icon
              className={cn(
                'h-3.5 w-3.5',
                config.color,
                config.spinning && 'animate-spin'
              )}
              aria-hidden="true"
            />
            <span className={cn('text-[11px] font-semibold', config.color)}>
              {config.label}
            </span>
          </div>
        </div>

        {upload.kind === 'file' && (
          <p className="text-foreground-muted mt-0.5 truncate text-[11px]">
            {formatFileSize(upload.size || 0)}
            {upload.status === 'uploading' && ` · ${upload.progress || 0}%`}
          </p>
        )}

        {isActive && upload.kind === 'file' && (
          <div className="bg-surface mt-2 h-1.5 w-full overflow-hidden rounded-full">
            <motion.div
              className="bg-primary h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${upload.progress || 0}%` }}
              transition={{ duration: 0.25, ease: 'linear' }}
            />
          </div>
        )}

        {upload.error && (
          <p className="text-error mt-1 truncate text-[11px]">{upload.error}</p>
        )}
      </div>

      {isActive ? (
        <button
          onClick={() => onCancel(upload.id)}
          className="text-foreground-muted hover:text-error hover:bg-error/10 rounded-lg p-1.5 transition-colors"
          aria-label={`Cancel upload for ${upload.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      ) : isTerminal ? (
        <button
          onClick={() => onRemove(upload.id)}
          className="text-foreground-muted hover:text-foreground hover:bg-surface rounded-lg p-1.5 transition-colors"
          aria-label={`Remove ${upload.name} from upload list`}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </motion.div>
  )
}
