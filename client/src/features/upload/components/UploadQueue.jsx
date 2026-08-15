import { AnimatePresence } from 'framer-motion'
import UploadProgress from './UploadProgress'

export default function UploadQueue({ uploads, onCancel, onRemove, onClear }) {
  if (!uploads.length) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-foreground text-sm font-bold">Upload Queue</p>
        <button
          onClick={onClear}
          className="text-foreground-muted hover:text-primary text-xs font-semibold transition-colors"
        >
          Clear completed
        </button>
      </div>

      <div className="no-scrollbar flex max-h-[260px] flex-col gap-2 overflow-y-auto">
        <AnimatePresence initial={false}>
          {uploads.map((upload) => (
            <UploadProgress
              key={upload.id}
              upload={upload}
              onCancel={onCancel}
              onRemove={onRemove}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
