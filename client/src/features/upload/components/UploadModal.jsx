import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Upload, Link2, ChevronDown } from 'lucide-react'
import DropZone from './DropZone'
import YoutubeUrlInput from './YoutubeUrlInput'
import UploadQueue from './UploadQueue'
import useUpload from '../hooks/useUpload'
import { useNotificationContext } from '@/context/NotificationContext'
import { cn } from '@/utils/cn'

const clipOptions = [5, 10, 20]

export default function UploadModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState('upload')
  const [clipCount, setClipCount] = useState(10)
  const [isImportingYoutube, setIsImportingYoutube] = useState(false)

  const {
    uploads,
    startFileUpload,
    startYoutubeUpload,
    cancel,
    removeUpload,
    clearCompleted,
  } = useUpload()

  const { success, error } = useNotificationContext()

  useEffect(() => {
    const openModal = (event) => {
      const requestedTab = event.detail?.tab

      if (requestedTab === 'youtube-url') {
        setTab('youtube')
      } else {
        setTab('upload')
      }

      setIsOpen(true)
    }

    window.addEventListener('talishflow:open-upload', openModal)

    return () => {
      window.removeEventListener('talishflow:open-upload', openModal)
    }
  }, [])

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', closeOnEscape)
    }

    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  const handleFilesSelected = async (files) => {
    const tasks = files.map(async (file) => {
      try {
        await startFileUpload({ file, clipCount })
        success('Upload complete', `${file.name} is queued for processing.`)
      } catch (uploadError) {
        if (uploadError.name !== 'AbortError') {
          error('Upload failed', uploadError.userMessage || `Could not upload ${file.name}.`)
        }
      }
    })

    await Promise.allSettled(tasks)
  }

  const handleYoutubeSubmit = async (url) => {
    setIsImportingYoutube(true)

    try {
      const result = await startYoutubeUpload({ url, clipCount })
      success('Video added', `${result.video.title} is queued for processing.`)
      setIsOpen(false)
    } catch (uploadError) {
      error('Could not add video', uploadError.userMessage || 'Please check the URL and try again.')
    } finally {
      setIsImportingYoutube(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#212121]/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[640px] max-h-[90dvh] overflow-y-auto no-scrollbar bg-white rounded-3xl border border-[#E0E0E0] shadow-float"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0E0E0]">
              <div>
                <h2
                  id="upload-modal-title"
                  className="text-lg font-extrabold text-[#212121] tracking-tight"
                >
                  Create New Project
                </h2>
                <p className="text-xs text-[#878787] mt-1">
                  Upload a video or import one from YouTube.
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-[#878787] hover:text-[#212121] hover:bg-[#F8F9FA] transition-colors"
                aria-label="Close upload modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center gap-1 p-1 bg-[#F8F9FA] rounded-xl">
                <button
                  onClick={() => setTab('upload')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all',
                    tab === 'upload'
                      ? 'bg-white text-[#212121] shadow-sm'
                      : 'text-[#878787] hover:text-[#212121]'
                  )}
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>

                <button
                  onClick={() => setTab('youtube')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all',
                    tab === 'youtube'
                      ? 'bg-white text-[#212121] shadow-sm'
                      : 'text-[#878787] hover:text-[#212121]'
                  )}
                >
                  <Link2 className="w-4 h-4" />
                  YouTube URL
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[#F8F9FA] border border-[#E0E0E0]">
                <div>
                  <p className="text-sm font-bold text-[#212121]">Generate clips</p>
                  <p className="text-xs text-[#878787] mt-0.5">
                    Choose how many top moments to create.
                  </p>
                </div>

                <div className="relative">
                  <select
                    value={clipCount}
                    onChange={(event) => setClipCount(Number(event.target.value))}
                    className="appearance-none bg-white border border-[#E0E0E0] rounded-xl pl-3 pr-9 py-2 text-sm font-bold text-[#212121] outline-none focus:ring-2 focus:ring-primary/30 focus:border-[#2874F0]"
                  >
                    {clipOptions.map((count) => (
                      <option key={count} value={count}>
                        Top {count}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#878787] pointer-events-none" />
                </div>
              </div>

              {tab === 'upload' ? (
                <DropZone onFilesSelected={handleFilesSelected} />
              ) : (
                <YoutubeUrlInput
                  onSubmit={handleYoutubeSubmit}
                  isLoading={isImportingYoutube}
                />
              )}

              <UploadQueue
                uploads={uploads}
                onCancel={cancel}
                onRemove={removeUpload}
                onClear={clearCompleted}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}