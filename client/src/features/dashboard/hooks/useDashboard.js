import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { QUERY_KEYS } from '@/utils/constants'

async function fetchDashboardStats() {
  const response = await apiClient.get('/analytics/dashboard-stats')
  return response.data.data
}

async function fetchRecentUploads() {
  const response = await apiClient.get('/videos?limit=5&sort=-createdAt')
  return response.data.data
}

async function fetchRecentClips() {
  const response = await apiClient.get('/clips?limit=6&sort=-createdAt')
  return response.data.data
}

async function fetchScheduledPosts() {
  const response = await apiClient.get('/publishing/scheduled?limit=5')
  return response.data.data
}

async function fetchProcessingQueue() {
  const response = await apiClient.get('/processing/queue')
  return response.data.data
}

export function useDashboard() {
  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.STATS,
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60 * 2,
  })

  const recentUploadsQuery = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.RECENT_UPLOADS,
    queryFn: fetchRecentUploads,
    staleTime: 1000 * 60 * 1,
  })

  const recentClipsQuery = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.RECENT_CLIPS,
    queryFn: fetchRecentClips,
    staleTime: 1000 * 60 * 1,
  })

  const scheduledQuery = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.SCHEDULED,
    queryFn: fetchScheduledPosts,
    staleTime: 1000 * 60 * 2,
  })

  const processingQuery = useQuery({
    queryKey: ['processing', 'queue'],
    queryFn: fetchProcessingQueue,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 15,
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
  }
}