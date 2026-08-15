import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Upload, Link2, X } from 'lucide-react'
import DropZone from './DropZone'
import YoutubeUrlInput from './YoutubeUrlInput'
import UploadQueue from './UploadQueue'
import { useUploadContext } from '@/contexts/UploadContext'
import { useNotificationContext } from '@/contexts/NotificationContext'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CLIP_OPTIONS = [5, 10, 20]

export default function CreateDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState('upload')
  const [clipCount, setClipCount] = useState(10)
  const [isImportingYoutube, setIsImportingYoutube] = useState(false)

  const {
    uploads,
    startFileUpload,
    startYoutubeUpload,
    retryUpload,
    cancel,
    removeUpload,
    clearCompleted,
  } = useUploadContext()

  const { success, error } = useNotificationContext()

  useEffect(() => {
    const openModal = (event) => {
      setTab(event.detail?.tab === 'youtube-url' ? 'youtube' : 'upload')
      setIsOpen(true)
    }

    window.addEventListener('talishflow:open-upload', openModal)

    return () => {
      window.removeEventListener('talishflow:open-upload', openModal)
    }
  }, [])

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
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

  const handleRetry = async (id) => {
    const result = await retryUpload(id)
    if (result) {
      success('Upload retrying', 'Your video is uploading again.')
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
            className="no-scrollbar border-border bg-surface shadow-float relative z-10 max-h-[90dvh] w-full max-w-[640px] overflow-y-auto rounded-2xl border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-dialog-title"
          >
            <div className="border-border-subtle flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2
                  id="create-dialog-title"
                  className="text-foreground text-lg font-extrabold tracking-tight"
                >
                  Create new project
                </h2>
                <p className="text-foreground-muted mt-1 text-xs">
                  Upload a video or import one from YouTube.
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-foreground-muted hover:bg-surface-muted hover:text-foreground rounded-xl p-2 transition-colors"
                aria-label="Close upload dialog"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-6 p-6">
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger
                    value="upload"
                    className="flex-1 justify-center gap-2 py-2.5"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger
                    value="youtube"
                    className="flex-1 justify-center gap-2 py-2.5"
                  >
                    <Link2 className="h-4 w-4" aria-hidden="true" />
                    YouTube URL
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="border-border-subtle bg-surface-muted/60 flex items-center justify-between gap-4 rounded-xl border px-4 py-3">
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
                    {CLIP_OPTIONS.map((count) => (
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
                onRetry={handleRetry}
                onClear={clearCompleted}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
