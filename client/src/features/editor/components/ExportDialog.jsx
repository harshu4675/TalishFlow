import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const QUALITY_OPTIONS = [
  {
    value: '1080p',
    label: '1080p HD',
    description: 'Recommended for all platforms',
    badge: 'Best',
  },
  {
    value: '2k',
    label: '2K QHD',
    description: 'High quality export',
  },
  {
    value: '4k',
    label: '4K UHD',
    description: 'Maximum quality, larger file',
  },
]

const CODEC_OPTIONS = [
  {
    value: 'h264',
    label: 'H.264',
    description: 'Universal compatibility',
    badge: 'Recommended',
  },
  {
    value: 'h265',
    label: 'H.265 / HEVC',
    description: 'Smaller file, newer devices',
  },
  {
    value: 'av1',
    label: 'AV1',
    description: 'Best compression, slowest',
  },
]

export default function ExportDialog({
  isOpen,
  onClose,
  onExport,
  isExporting,
  clipTitle,
}) {
  const [quality, setQuality] = useState('1080p')
  const [codec, setCodec] = useState('h264')

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="z-modal fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="shadow-float relative z-10 w-full max-w-[480px] overflow-hidden rounded-3xl border border-white/10 bg-[#141B22]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 id="export-title" className="text-[15px] font-extrabold text-white">
                  Export Clip
                </h2>
                {clipTitle && (
                  <p className="mt-0.5 max-w-[300px] truncate text-xs text-white/40">
                    {clipTitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-white/40 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-5 p-6">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold tracking-widest text-white/40 uppercase">
                  Quality
                </p>
                <div className="flex flex-col gap-2">
                  {QUALITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setQuality(option.value)}
                      className={cn(
                        'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all',
                        quality === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-white/10 bg-white/5 hover:border-white/30'
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">{option.label}</p>
                          {option.badge && (
                            <span className="text-primary bg-primary/20 rounded-full px-2 py-0.5 text-[10px] font-bold">
                              {option.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-white/40">
                          {option.description}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'h-4 w-4 flex-shrink-0 rounded-full border-2',
                          quality === option.value
                            ? 'border-primary bg-primary'
                            : 'border-white/30'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold tracking-widest text-white/40 uppercase">
                  Codec
                </p>
                <div className="flex gap-2">
                  {CODEC_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCodec(option.value)}
                      className={cn(
                        'flex flex-1 flex-col items-start rounded-xl border px-3 py-3 transition-all',
                        codec === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-white/10 bg-white/5 hover:border-white/30'
                      )}
                    >
                      <div className="mb-1 flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white">{option.label}</p>
                        {option.badge && (
                          <span className="text-success bg-success/20 rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] leading-snug text-white/30">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  disabled={isExporting}
                  className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-semibold text-white/60 transition-all hover:border-white/40 hover:text-white disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onExport({ quality, codec })}
                  disabled={isExporting}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl py-3',
                    'bg-primary hover:bg-primary-hover text-sm font-semibold text-white',
                    'shadow-primary/20 shadow-md transition-all',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" /> Export
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
