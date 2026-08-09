import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

export default function ExportModal({
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
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
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
            className="relative z-10 w-full max-w-[480px] bg-[#141B22] border border-white/10 rounded-3xl shadow-float overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <h2
                  id="export-title"
                  className="text-[15px] font-extrabold text-white"
                >
                  Export Clip
                </h2>
                {clipTitle && (
                  <p className="text-xs text-white/40 mt-0.5 truncate max-w-[300px]">
                    {clipTitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                  Quality
                </p>
                <div className="flex flex-col gap-2">
                  {QUALITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setQuality(option.value)}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left',
                        quality === option.value
                          ? 'border-[#2874F0] bg-[#2874F0]/10'
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">{option.label}</p>
                          {option.badge && (
                            <span className="text-[10px] font-bold text-[#2874F0] bg-[#2874F0]/20 px-2 py-0.5 rounded-full">
                              {option.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">{option.description}</p>
                      </div>
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border-2 flex-shrink-0',
                          quality === option.value
                            ? 'border-[#2874F0] bg-[#2874F0]'
                            : 'border-white/30'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                  Codec
                </p>
                <div className="flex gap-2">
                  {CODEC_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCodec(option.value)}
                      className={cn(
                        'flex-1 flex flex-col items-start px-3 py-3 rounded-xl border transition-all',
                        codec === option.value
                          ? 'border-[#2874F0] bg-[#2874F0]/10'
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-bold text-white">{option.label}</p>
                        {option.badge && (
                          <span className="text-[9px] font-bold text-[#22C55E] bg-[#22C55E]/20 px-1.5 py-0.5 rounded-full">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/30 leading-snug">
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
                  className="flex-1 py-3 rounded-xl border border-white/20 text-sm font-semibold text-white/60 hover:text-white hover:border-white/40 transition-all disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onExport({ quality, codec })}
                  disabled={isExporting}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl',
                    'bg-[#2874F0] hover:bg-[#1B5FCC] text-white text-sm font-semibold',
                    'transition-all shadow-md shadow-primary/20',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isExporting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Export</>
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