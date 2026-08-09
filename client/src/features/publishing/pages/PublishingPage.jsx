import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio,
  Youtube,
  Instagram,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  X,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import publishingService from '@/services/publishingService'
import { useNotificationContext } from '@/context/NotificationContext'
import PageTitle from '@/components/common/PageTitle'
import EmptyState from '@/components/common/EmptyState'
import { cn } from '@/utils/cn'
import { formatRelativeTime, formatDateTime, truncate } from '@/utils/formatters'

const STATUS_CONFIG = {
  pending: {
    label: 'Scheduled',
    icon: Calendar,
    color: 'text-[#2874F0]',
    bg: 'bg-[#2874F0]/10',
  },
  queued: {
    label: 'In Queue',
    icon: Clock,
    color: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10',
  },
  publishing: {
    label: 'Publishing',
    icon: Loader2,
    color: 'text-[#2874F0]',
    bg: 'bg-[#2874F0]/10',
    spin: true,
  },
  published: {
    label: 'Published',
    icon: CheckCircle2,
    color: 'text-[#22C55E]',
    bg: 'bg-[#22C55E]/10',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    color: 'text-[#EF4444]',
    bg: 'bg-[#EF4444]/10',
  },
  cancelled: {
    label: 'Cancelled',
    icon: X,
    color: 'text-[#878787]',
    bg: 'bg-[#F8F9FA]',
  },
}

const PLATFORM_CONFIG = {
  youtube: {
    label: 'YouTube',
    icon: Youtube,
    color: 'text-[#EF4444]',
    bg: 'bg-[#EF4444]/10',
  },
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    color: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10',
  },
}

function JobRow({ job, onCancel, onRetry }) {
  const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending
  const platform = PLATFORM_CONFIG[job.platform]
  const StatusIcon = status.icon
  const PlatformIcon = platform?.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#E0E0E0] hover:shadow-card transition-all"
    >
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          platform?.bg || 'bg-[#F8F9FA]'
        )}
      >
        {PlatformIcon && (
          <PlatformIcon
            className={cn('w-4.5 h-4.5', platform?.color || 'text-[#878787]')}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#212121] truncate">
          {job.title || job.clipId?.title || 'Untitled'}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-[#878787]">{platform?.label}</span>
          <span className="text-border" aria-hidden="true">·</span>
          {job.scheduledAt ? (
            <span className="text-xs text-[#878787]">
              {formatDateTime(job.scheduledAt)}
            </span>
          ) : (
            <span className="text-xs text-[#878787]">
              {formatRelativeTime(job.createdAt)}
            </span>
          )}
        </div>

        {job.errorMessage && (
          <p className="text-xs text-[#EF4444] mt-1 truncate">{job.errorMessage}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold',
            status.color,
            status.bg
          )}
        >
          <StatusIcon
            className={cn('w-3 h-3', status.spin && 'animate-spin')}
          />
          {status.label}
        </span>

        {job.platformVideoUrl && (
          <a
            href={job.platformVideoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-[#878787] hover:text-[#2874F0] hover:bg-[#2874F0]/10 transition-all"
            aria-label="View on platform"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {['pending', 'queued'].includes(job.status) && (
          <button
            onClick={() => onCancel(job._id)}
            className="p-1.5 rounded-lg text-[#878787] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
            aria-label="Cancel job"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {job.status === 'failed' && (
          <button
            onClick={() => onRetry(job._id)}
            className="p-1.5 rounded-lg text-[#878787] hover:text-[#2874F0] hover:bg-[#2874F0]/10 transition-all"
            aria-label="Retry job"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

function JobRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#E0E0E0]">
      <div className="w-10 h-10 rounded-xl skeleton flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-48 skeleton rounded-lg" />
        <div className="h-3 w-32 skeleton rounded-lg" />
      </div>
      <div className="h-6 w-20 skeleton rounded-full" />
    </div>
  )
}

export default function PublishingPage() {
  const queryClient = useQueryClient()
  const { success, error } = useNotificationContext()
  const [filter, setFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['publishing', 'jobs', filter],
    queryFn: () =>
      publishingService.listJobs({
        status: filter === 'all' ? undefined : filter,
        limit: 50,
      }),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 15,
  })

  const cancelMutation = useMutation({
    mutationFn: (jobId) => publishingService.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishing', 'jobs'] })
      success('Job cancelled', 'Publishing job has been cancelled.')
    },
    onError: (err) => {
      error('Cancel failed', err.userMessage || 'Could not cancel the job.')
    },
  })

  const retryMutation = useMutation({
    mutationFn: (jobId) => publishingService.retryJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishing', 'jobs'] })
      success('Job retrying', 'Publishing job has been queued for retry.')
    },
    onError: (err) => {
      error('Retry failed', err.userMessage || 'Could not retry the job.')
    },
  })

  const jobs = data?.jobs || []
  const total = data?.pagination?.total || 0

  const FILTER_TABS = [
    { id: 'all', label: 'All', count: null },
    { id: 'pending', label: 'Scheduled', count: null },
    { id: 'publishing', label: 'Publishing', count: null },
    { id: 'published', label: 'Published', count: null },
    { id: 'failed', label: 'Failed', count: null },
  ]

  return (
    <div className="p-5 lg:p-7 max-w-[1200px] mx-auto">
      <PageTitle title="Publishing" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-extrabold text-[#212121] tracking-tight">
              Publishing
            </h1>
            <p className="text-[#878787] text-sm mt-1">
              Manage all your YouTube and Instagram publications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#F8F9FA] rounded-xl p-1 w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                filter === tab.id
                  ? 'bg-white text-[#212121] shadow-sm'
                  : 'text-[#878787] hover:text-[#212121]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <JobRowSkeleton key={i} />)
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E0E0E0]">
              <EmptyState
                icon={Radio}
                title="No publishing jobs"
                description={
                  filter === 'all'
                    ? 'You have not published any content yet. Open a clip in the editor to publish.'
                    : `No ${filter} jobs found.`
                }
              />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {jobs.map((job) => (
                <JobRow
                  key={job._id}
                  job={job}
                  onCancel={(id) => cancelMutation.mutate(id)}
                  onRetry={(id) => retryMutation.mutate(id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {total > 0 && (
          <p className="text-xs text-[#878787] text-center">
            Showing {jobs.length} of {total} jobs
          </p>
        )}
      </motion.div>
    </div>
  )
}