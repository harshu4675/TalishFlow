import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useProcessingSocket from '@/hooks/useWebSocket'
import { useNotificationContext } from '@/contexts/NotificationContext'
import { PROCESSING_STATUS_LABELS } from '@/utils/constants'
import { queryKeys } from '@/utils/queryKeys'

export default function useProcessing() {
  const queryClient = useQueryClient()
  const { success, error, update, progress } = useNotificationContext()
  const activeToasts = useRef({})

  const onProcessingProgress = useCallback(
    ({ jobId, status, currentStep, progress: percent }) => {
      const label = PROCESSING_STATUS_LABELS[status] || 'Processing'

      if (activeToasts.current[jobId]) {
        update(activeToasts.current[jobId], {
          meta: { progress: percent },
          message: currentStep || label,
        })
      } else {
        activeToasts.current[jobId] = progress(
          label,
          currentStep || `Processing your video`,
          {
            meta: { progress: percent },
          }
        )
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.processingQueue })
    },
    [queryClient, progress, update]
  )

  const onProcessingComplete = useCallback(
    ({ jobId, result }) => {
      if (activeToasts.current[jobId]) {
        update(activeToasts.current[jobId], {
          type: 'success',
          title: 'Processing complete',
          message: `${result?.clipCount || 0} clips generated successfully.`,
          persistent: false,
          meta: {},
        })
        delete activeToasts.current[jobId]
      } else {
        success('Processing complete', `Your clips are ready.`)
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentClips })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentUploads })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.processingQueue })
    },
    [queryClient, success, update]
  )

  const onProcessingError = useCallback(
    ({ jobId, error: errorMessage }) => {
      if (activeToasts.current[jobId]) {
        update(activeToasts.current[jobId], {
          type: 'error',
          title: 'Processing failed',
          message: errorMessage || 'An error occurred during processing.',
          persistent: false,
          meta: {},
        })
        delete activeToasts.current[jobId]
      } else {
        error('Processing failed', errorMessage || 'An error occurred.')
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.processingQueue })
    },
    [queryClient, error, update]
  )

  const { isConnected } = useProcessingSocket({
    onProcessingProgress,
    onProcessingComplete,
    onProcessingError,
  })

  return { isConnected }
}
