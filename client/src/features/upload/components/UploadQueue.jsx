import { AnimatePresence } from 'framer-motion'
import UploadProgress from './UploadProgress'

export default function UploadQueue({ uploads, onCancel, onRemove, onClear }) {
  if (!uploads.length) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#212121]">Upload Queue</p>
        <button
          onClick={onClear}
          className="text-xs font-semibold text-[#878787] hover:text-[#2874F0] transition-colors"
        >
          Clear completed
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto no-scrollbar">
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