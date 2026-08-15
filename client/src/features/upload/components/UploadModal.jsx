import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Link2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
          error(
            'Upload failed',
            uploadError.userMessage || `Could not upload ${file.name}.`
          )
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
      error(
        'Could not add video',
        uploadError.userMessage || 'Please check the URL and try again.'
      )
    } finally {
      setIsImportingYoutube(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="z-modal fixed inset-0 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-overlay absolute inset-0 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="no-scrollbar bg-surface border-border shadow-float relative z-10 max-h-[90dvh] w-full max-w-[640px] overflow-y-auto rounded-3xl border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
          >
            <div className="border-border flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2
                  id="upload-modal-title"
                  className="text-foreground text-lg font-extrabold tracking-tight"
                >
                  Create New Project
                </h2>
                <p className="text-foreground-muted mt-1 text-xs">
                  Upload a video or import one from YouTube.
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-foreground-muted hover:text-foreground hover:bg-surface-muted rounded-xl p-2 transition-colors"
                aria-label="Close upload modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-6 p-6">
              <div className="bg-surface-muted flex items-center gap-1 rounded-xl p-1">
                <button
                  onClick={() => setTab('upload')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
                    tab === 'upload'
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                  )}
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </button>

                <button
                  onClick={() => setTab('youtube')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
                    tab === 'youtube'
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                  )}
                >
                  <Link2 className="h-4 w-4" />
                  YouTube URL
                </button>
              </div>

              <div className="bg-surface-muted border-border flex items-center justify-between gap-4 rounded-xl border px-4 py-3">
                <div>
                  <p className="text-foreground text-sm font-bold">Generate clips</p>
                  <p className="text-foreground-muted mt-0.5 text-xs">
                    Choose how many top moments to create.
                  </p>
                </div>

                <Select
                  value={String(clipCount)}
                  onValueChange={(value) => setClipCount(Number(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clipOptions.map((count) => (
                      <SelectItem key={count} value={String(count)}>
                        Top {count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
