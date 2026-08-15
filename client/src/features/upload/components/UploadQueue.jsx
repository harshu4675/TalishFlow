import { AnimatePresence } from 'framer-motion'
import UploadItem from './UploadItem'

export default function UploadQueue({ uploads, onCancel, onRemove, onRetry, onClear }) {
  if (!uploads.length) return null

  const hasTerminal = uploads.some((upload) =>
    ['queued', 'completed', 'cancelled', 'failed'].includes(upload.status)
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-foreground text-sm font-bold">Upload queue</p>
        {hasTerminal && (
          <button
            onClick={onClear}
            className="text-foreground-muted hover:text-primary text-xs font-semibold transition-colors"
          >
            Clear finished
          </button>
        )}
      </div>

      <div className="no-scrollbar flex max-h-[260px] flex-col gap-2 overflow-y-auto">
        <AnimatePresence initial={false}>
          {uploads.map((upload) => (
            <UploadItem
              key={upload.id}
              upload={upload}
              onCancel={onCancel}
              onRemove={onRemove}
              onRetry={onRetry}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
