import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import {
  uploadResumableVideo,
  uploadYouTubeUrl,
  cancelUpload,
} from '@/features/upload/services/uploadService'
import { generateId, parseErrorMessage } from '@/utils/helpers.js'

const UploadContext = createContext(null)

export function UploadProvider({ children }) {
  const [uploads, setUploads] = useState([])
  const controllers = useRef({})

  const updateUpload = useCallback((id, updates) => {
    setUploads((current) =>
      current.map((upload) => (upload.id === id ? { ...upload, ...updates } : upload))
    )
  }, [])

  const addUpload = useCallback((upload) => {
    setUploads((current) => [upload, ...current])
  }, [])

  const removeUpload = useCallback((id) => {
    setUploads((current) => current.filter((upload) => upload.id !== id))
  }, [])

  const startFileUpload = useCallback(
    async ({ file, clipCount = 10 }) => {
      const id = generateId('upload')
      const controller = new AbortController()

      controllers.current[id] = controller

      addUpload({
        id,
        kind: 'file',
        name: file.name,
        size: file.size,
        file,
        status: 'preparing',
        progress: 0,
        clipCount,
        createdAt: Date.now(),
      })

      try {
        const result = await uploadResumableVideo({
          file,
          clipCount,
          signal: controller.signal,
          onProgress: ({ progress, bytesUploaded, totalBytes, uploadId }) => {
            updateUpload(id, {
              uploadId,
              progress,
              bytesUploaded,
              totalBytes,
              status: 'uploading',
            })
          },
          onStateChange: (state) => {
            updateUpload(id, state)
          },
        })

        updateUpload(id, {
          status: 'queued',
          progress: 100,
          videoId: result.video._id,
          processingJobId: result.processingJob._id,
        })

        return result
      } catch (error) {
        if (error.name === 'AbortError') {
          updateUpload(id, { status: 'cancelled' })
        } else {
          updateUpload(id, {
            status: 'failed',
            error: parseErrorMessage(error),
          })
        }

        throw error
      } finally {
        delete controllers.current[id]
      }
    },
    [addUpload, updateUpload]
  )

  const startYoutubeUpload = useCallback(
    async ({ url, clipCount = 10 }) => {
      const id = generateId('youtube')

      addUpload({
        id,
        kind: 'youtube',
        name: url,
        status: 'importing',
        progress: 0,
        clipCount,
        createdAt: Date.now(),
      })

      try {
        const result = await uploadYouTubeUrl({ url, clipCount })

        updateUpload(id, {
          status: 'queued',
          progress: 100,
          videoId: result.video._id,
          processingJobId: result.processingJob._id,
          name: result.video.title,
          thumbnailUrl: result.video.thumbnailUrl,
        })

        return result
      } catch (error) {
        updateUpload(id, {
          status: 'failed',
          error: parseErrorMessage(error),
        })

        throw error
      }
    },
    [addUpload, updateUpload]
  )

  const cancel = useCallback(
    async (id) => {
      const upload = uploads.find((item) => item.id === id)

      if (!upload) return

      controllers.current[id]?.abort()

      if (upload.uploadId) {
        try {
          await cancelUpload(upload.uploadId)
        } catch {
          updateUpload(id, { status: 'cancelled' })
        }
      }

      updateUpload(id, { status: 'cancelled' })
    },
    [uploads, updateUpload]
  )

  const clearCompleted = useCallback(() => {
    setUploads((current) =>
      current.filter(
        (upload) =>
          !['queued', 'completed', 'cancelled', 'failed'].includes(upload.status)
      )
    )
  }, [])

  const value = useMemo(
    () => ({
      uploads,
      startFileUpload,
      startYoutubeUpload,
      cancel,
      removeUpload,
      clearCompleted,
    }),
    [uploads, startFileUpload, startYoutubeUpload, cancel, removeUpload, clearCompleted]
  )

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
}

export function useUploadContext() {
  const context = useContext(UploadContext)

  if (!context) {
    throw new Error('useUploadContext must be used inside UploadProvider')
  }

  return context
}
