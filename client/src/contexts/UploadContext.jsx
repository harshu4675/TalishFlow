import { createContext, useCallback, useContext, useMemo, useReducer } from 'react'
import {
  uploadResumableVideo,
  uploadYouTubeUrl,
  cancelUpload,
} from '@/services/uploadService'
import { generateId, parseErrorMessage } from '@/utils/helpers'

const UploadContext = createContext(null)

const controllerRefs = new Map()

// In-flight uploads keyed by file identity / URL. Prevents duplicate queue
// entries when the same selection event fires twice (double click, repeated
// event handlers, component remounts) before the first upload has started.
const inflightByKey = new Map()

function uploadReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [action.payload, ...state]

    case 'UPDATE':
      return state.map((upload) =>
        upload.id === action.payload.id
          ? { ...upload, ...action.payload.updates }
          : upload
      )

    case 'REMOVE':
      return state.filter((upload) => upload.id !== action.payload)

    case 'CLEAR_COMPLETED':
      return state.filter(
        (upload) =>
          !['queued', 'completed', 'cancelled', 'failed'].includes(upload.status)
      )

    default:
      return state
  }
}

function fileKey(file) {
  return `file:${file.name}:${file.size}:${file.lastModified}`
}

function youtubeKey(url) {
  return `youtube:${url.trim().toLowerCase()}`
}

function releaseInflight(key, promise) {
  // Only clear the slot if it still points at THIS promise (a retry or a
  // new upload may have already replaced it).
  if (inflightByKey.get(key) === promise) {
    inflightByKey.delete(key)
  }
}

function dropInflight(key) {
  inflightByKey.delete(key)
}

function createUploadTask({ id, file, clipCount, updateUpload }) {
  const controller = new AbortController()
  controllerRefs.current.set(id, controller)

  const start = async () => {
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
      controllerRefs.current.delete(id)
    }
  }

  return { start, abort: () => controller.abort() }
}

export function UploadProvider({ children }) {
  const [uploads, dispatch] = useReducer(uploadReducer, [])

  const addUpload = useCallback((upload) => {
    dispatch({ type: 'ADD', payload: upload })
  }, [])

  const updateUpload = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE', payload: { id, updates } })
  }, [])

  const removeUpload = useCallback((id) => {
    const upload = uploads.find((item) => item.id === id)
    if (upload) {
      const key =
        upload.kind === 'file' ? fileKey(upload.file) : youtubeKey(upload.name)
      dropInflight(key)
    }
    controllerRefs.current.delete(id)
    dispatch({ type: 'REMOVE', payload: id })
  }, [uploads])

  const startFileUpload = useCallback(
    async ({ file, clipCount = 10 }) => {
      const key = fileKey(file)

      // Same file already uploading (or initializing) — reuse it instead of
      // inserting a duplicate queue entry.
      const existing = inflightByKey.get(key)
      if (existing) {
        return existing
      }

      const id = generateId('upload')

      addUpload({
        id,
        kind: 'file',
        name: file.name,
        size: file.size,
        file,
        clipCount,
        status: 'preparing',
        progress: 0,
        createdAt: Date.now(),
      })

      const task = createUploadTask({ id, file, clipCount, updateUpload })

      let promise
      promise = task
        .start()
        .finally(() => releaseInflight(key, promise))

      inflightByKey.set(key, promise)
      return promise
    },
    [addUpload, updateUpload]
  )

  const retryUpload = useCallback(
    async (id) => {
      const upload = uploads.find((item) => item.id === id)
      if (!upload?.file) return null

      const key = fileKey(upload.file)

      updateUpload(id, { status: 'preparing', error: null, progress: 0 })

      const task = createUploadTask({
        id,
        file: upload.file,
        clipCount: upload.clipCount,
        updateUpload,
      })

      let promise
      promise = task
        .start()
        .finally(() => releaseInflight(key, promise))

      inflightByKey.set(key, promise)

      try {
        return await promise
      } catch {
        return null
      }
    },
    [uploads, updateUpload]
  )

  const startYoutubeUpload = useCallback(
    async ({ url, clipCount = 10 }) => {
      const key = youtubeKey(url)

      const existing = inflightByKey.get(key)
      if (existing) {
        return existing
      }

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

      let promise
      promise = (async () => {
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
        } finally {
          releaseInflight(key, promise)
        }
      })()

      inflightByKey.set(key, promise)
      return promise
    },
    [addUpload, updateUpload]
  )

  const cancel = useCallback(
    async (id) => {
      const upload = uploads.find((item) => item.id === id)

      if (!upload) return

      controllerRefs.current.get(id)?.abort()

      if (upload.uploadId) {
        try {
          await cancelUpload(upload.uploadId)
        } catch {
          updateUpload(id, { status: 'cancelled' })
        }
      }

      // Release the dedupe slot so the user can immediately re-add the
      // same file/URL after cancelling.
      const key =
        upload.kind === 'file' ? fileKey(upload.file) : youtubeKey(upload.name)
      dropInflight(key)

      updateUpload(id, { status: 'cancelled' })
    },
    [uploads, updateUpload]
  )

  const clearCompleted = useCallback(() => {
    dispatch({ type: 'CLEAR_COMPLETED' })
  }, [])

  const value = useMemo(
    () => ({
      uploads,
      startFileUpload,
      startYoutubeUpload,
      retryUpload,
      cancel,
      removeUpload,
      clearCompleted,
    }),
    [
      uploads,
      startFileUpload,
      startYoutubeUpload,
      retryUpload,
      cancel,
      removeUpload,
      clearCompleted,
    ]
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
