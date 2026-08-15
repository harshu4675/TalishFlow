import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/services/analyticsService'
import { videoService } from '@/services/videoService'
import { clipService } from '@/services/clipService'
import { publishingService } from '@/services/publishingService'
import { processingService } from '@/services/processingService'
import { queryKeys } from '@/utils/queryKeys'

export function useDashboard() {
  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: analyticsService.getDashboardStats,
    staleTime: 1000 * 60 * 2,
  })

  const recentUploadsQuery = useQuery({
    queryKey: queryKeys.dashboard.recentUploads,
    queryFn: () => videoService.listVideos({ limit: 5, sort: '-createdAt' }),
    staleTime: 1000 * 60,
  })

  const recentClipsQuery = useQuery({
    queryKey: queryKeys.dashboard.recentClips,
    queryFn: () => clipService.listClips({ limit: 6, sort: '-createdAt' }),
    staleTime: 1000 * 60,
  })

  const scheduledQuery = useQuery({
    queryKey: queryKeys.dashboard.scheduled,
    queryFn: () => publishingService.getScheduledPosts({ limit: 5 }),
    staleTime: 1000 * 60 * 2,
  })

  const processingQuery = useQuery({
    queryKey: queryKeys.dashboard.processingQueue,
    queryFn: processingService.getQueue,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 15,
  })

  const storageQuery = useQuery({
    queryKey: queryKeys.dashboard.storage,
    queryFn: analyticsService.getStorage,
    staleTime: 1000 * 60 * 5,
  })

  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,

    recentUploads: recentUploadsQuery.data?.videos || [],
    isLoadingUploads: recentUploadsQuery.isLoading,

    recentClips: recentClipsQuery.data?.clips || [],
    isLoadingClips: recentClipsQuery.isLoading,

    scheduledPosts: scheduledQuery.data?.posts || [],
    isLoadingScheduled: scheduledQuery.isLoading,

    processingJobs: processingQuery.data?.jobs || [],
    isLoadingQueue: processingQuery.isLoading,

    storage: storageQuery.data,
    isLoadingStorage: storageQuery.isLoading,
  }
}
