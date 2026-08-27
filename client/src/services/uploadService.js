import http from './http'
import { UPLOAD_CONFIG } from '@/utils/constants'
import { parseErrorMessage } from '@/utils/helpers'

const CHUNK_SIZE = UPLOAD_CONFIG.CHUNK_SIZE

function createChunk(file, index) {
  const start = index * CHUNK_SIZE
  const end = Math.min(file.size, start + CHUNK_SIZE)

  return file.slice(start, end)
}

async function initializeUpload(file, clipCount) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

  try {
    const response = await http.post('/videos/resumable/init', {
      filename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      totalChunks,
      clipCount,
    })

    return response.data.data
  } catch (error) {
    const message = parseErrorMessage(error)
    throw new Error(message)
  }
}

async function uploadChunk({ uploadId, chunk, chunkIndex, totalChunks, signal }) {
  const formData = new FormData()

  formData.append('chunk', chunk, `chunk-${chunkIndex}.part`)
  formData.append('uploadId', uploadId)
  formData.append('chunkIndex', String(chunkIndex))
  formData.append('totalChunks', String(totalChunks))

  try {
    const response = await http.post('/videos/resumable/chunk', formData, {
      signal,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 0,
    })

    return response.data.data
  } catch (error) {
    const message = parseErrorMessage(error)
    throw new Error(message)
  }
}

async function completeUpload(uploadId, clipCount) {
  try {
    const response = await http.post('/videos/resumable/complete', {
      uploadId,
      clipCount,
    })

    return response.data.data
  } catch (error) {
    const message = parseErrorMessage(error)
    throw new Error(message)
  }
}

export async function cancelUpload(uploadId) {
  try {
    const response = await http.delete(`/videos/resumable/${uploadId}`)
    return response.data
  } catch (error) {
    const message = parseErrorMessage(error)
    throw new Error(message)
  }
}

export async function uploadResumableVideo({
  file,
  clipCount = 10,
  onProgress,
  onStateChange,
  signal,
}) {
  let session
  try {
    session = await initializeUpload(file, clipCount)
  } catch (error) {
    onStateChange?.({
      status: 'failed',
      error: error.message || 'Failed to initialize upload',
    })
    throw error
  }

  const { uploadId, totalChunks } = session

  onStateChange?.({
    uploadId,
    status: 'uploading',
    progress: 0,
    totalChunks,
    uploadedChunks: 0,
  })

  try {
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      if (signal?.aborted) {
        throw new DOMException('Upload aborted', 'AbortError')
      }

      const chunk = createChunk(file, chunkIndex)

      try {
        await uploadChunk({
          uploadId,
          chunk,
          chunkIndex,
          totalChunks,
          signal,
        })
      } catch (chunkError) {
        onStateChange?.({
          uploadId,
          status: 'failed',
          error: `Failed to upload chunk ${chunkIndex + 1}/${totalChunks}: ${chunkError.message}`,
          progress: Math.round(((chunkIndex + 1) / totalChunks) * 100),
        })
        throw chunkError
      }

      const uploadedChunks = chunkIndex + 1
      const progress = Math.round((uploadedChunks / totalChunks) * 100)

      onProgress?.({
        uploadId,
        progress,
        uploadedChunks,
        totalChunks,
        bytesUploaded: Math.min(uploadedChunks * CHUNK_SIZE, file.size),
        totalBytes: file.size,
      })
    }

    onStateChange?.({
      uploadId,
      status: 'finalizing',
      progress: 100,
      totalChunks,
      uploadedChunks: totalChunks,
    })

    let result
    try {
      result = await completeUpload(uploadId, clipCount)
    } catch (completeError) {
      onStateChange?.({
        uploadId,
        status: 'failed',
        error: `Failed to finalize upload: ${completeError.message}`,
        progress: 100,
      })
      throw completeError
    }

    onStateChange?.({
      uploadId,
      status: 'completed',
      progress: 100,
      videoId: result.video._id,
      totalChunks,
      uploadedChunks: totalChunks,
    })

    return result
  } catch (error) {
    if (error.name !== 'AbortError' && uploadId) {
      onStateChange?.({
        uploadId,
        status: 'failed',
        error: error.userMessage || error.message || 'Upload failed',
      })
    }

    throw error
  }
}

export async function uploadYouTubeUrl({ url, clipCount }) {
  try {
    const response = await http.post('/videos/youtube', {
      url,
      clipCount,
    })

    return response.data.data
  } catch (error) {
    const message = parseErrorMessage(error)
    const enhancedError = new Error(message)
    enhancedError.userMessage = message
    enhancedError.details = error.response?.data
    throw enhancedError
  }
}
