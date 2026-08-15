import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNotificationContext } from '@/context/NotificationContext'
import clipService from '@/services/clipService'

export default function useEditor(clipId) {
  const queryClient = useQueryClient()
  const { success, error } = useNotificationContext()

  const clipQuery = useQuery({
    queryKey: ['clips', clipId],
    queryFn: () => clipService.getClip(clipId),
    enabled: !!clipId,
  })

  const updateMutation = useMutation({
    mutationFn: (data) => clipService.updateClip(clipId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clips', clipId] })
      success('Saved', 'Clip details updated.')
    },
    onError: (err) => {
      error('Save failed', err.userMessage || 'Could not save changes.')
    },
  })

  const exportMutation = useMutation({
    mutationFn: (options) => clipService.exportClip(clipId, options),
    onSuccess: () => {
      success('Export started', 'You will be notified when your export is ready.')
    },
    onError: (err) => {
      error('Export failed', err.userMessage || 'Could not start export.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => clipService.deleteClip(clipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clips'] })
      success('Deleted', 'Clip has been deleted.')
    },
    onError: (err) => {
      error('Delete failed', err.userMessage || 'Could not delete clip.')
    },
  })

  return {
    clip: clipQuery.data,
    isLoading: clipQuery.isLoading,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    exportClip: exportMutation.mutate,
    isExporting: exportMutation.isPending,
    deleteClip: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}
