import { motion } from 'framer-motion'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileVideo,
  Clock,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatFileSize } from '@/utils/formatters'

const statusConfig = {
  preparing: {
    label: 'Preparing upload',
    icon: Clock,
    color: 'text-[#878787]',
  },
  uploading: {
    label: 'Uploading',
    icon: Loader2,
    color: 'text-[#2874F0]',
    spinning: true,
  },
  finalizing: {
    label: 'Finalizing upload',
    icon: Loader2,
    color: 'text-[#2874F0]',
    spinning: true,
  },
  importing: {
    label: 'Adding YouTube video',
    icon: Loader2,
    color: 'text-[#2874F0]',
    spinning: true,
  },
  queued: {
    label: 'Queued for processing',
    icon: CheckCircle2,
    color: 'text-[#22C55E]',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-[#22C55E]',
  },
  failed: {
    label: 'Upload failed',
    icon: AlertCircle,
    color: 'text-[#EF4444]',
  },
  cancelled: {
    label: 'Cancelled',
    icon: AlertCircle,
    color: 'text-[#878787]',
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
      className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F9FA] border border-[#E0E0E0]"
    >
      <div className="w-9 h-9 rounded-xl bg-white border border-[#E0E0E0] flex items-center justify-center flex-shrink-0 overflow-hidden">
        {upload.thumbnailUrl ? (
          <img
            src={upload.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <FileVideo className="w-4 h-4 text-[#2874F0]" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-[#212121] truncate">{upload.name}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Icon
              className={cn(
                'w-3.5 h-3.5',
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
          <p className="text-[11px] text-[#878787] truncate mt-0.5">
            {formatFileSize(upload.size || 0)}
            {upload.status === 'uploading' && ` · ${upload.progress || 0}%`}
          </p>
        )}

        {isActive && upload.kind === 'file' && (
          <div className="h-1.5 w-full rounded-full bg-white overflow-hidden mt-2">
            <motion.div
              className="h-full rounded-full bg-[#2874F0]"
              initial={{ width: 0 }}
              animate={{ width: `${upload.progress || 0}%` }}
              transition={{ duration: 0.25, ease: 'linear' }}
            />
          </div>
        )}

        {upload.error && (
          <p className="text-[11px] text-[#EF4444] mt-1 truncate">{upload.error}</p>
        )}
      </div>

      {isActive ? (
        <button
          onClick={() => onCancel(upload.id)}
          className="p-1.5 rounded-lg text-[#878787] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
          aria-label={`Cancel upload for ${upload.name}`}
        >
          <X className="w-4 h-4" />
        </button>
      ) : isTerminal ? (
        <button
          onClick={() => onRemove(upload.id)}
          className="p-1.5 rounded-lg text-[#878787] hover:text-[#212121] hover:bg-white transition-colors"
          aria-label={`Remove ${upload.name} from upload list`}
        >
          <X className="w-4 h-4" />
        </button>
      ) : null}
    </motion.div>
  )
}