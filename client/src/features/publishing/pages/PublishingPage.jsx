import { memo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Send,
} from 'lucide-react'
import publishingService from '@/services/publishingService'
import { useNotificationContext } from '@/context/NotificationContext'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { formatRelativeTime, formatDateTime } from '@/utils/formatters'

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Scheduled' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'published', label: 'Published' },
  { id: 'failed', label: 'Failed' },
]

const STATUS_CONFIG = {
  pending: { label: 'Scheduled', icon: Calendar, tone: 'primary' },
  queued: { label: 'In Queue', icon: Clock, tone: 'warning' },
  publishing: { label: 'Publishing', icon: Loader2, tone: 'primary', spin: true },
  published: { label: 'Published', icon: CheckCircle2, tone: 'success' },
  failed: { label: 'Failed', icon: AlertCircle, tone: 'error' },
  cancelled: { label: 'Cancelled', icon: X, tone: 'neutral' },
}

const PLATFORM_CONFIG = {
  youtube: { label: 'YouTube', icon: Youtube },
  instagram: { label: 'Instagram', icon: Instagram },
}

const TONE_MAP = {
  primary: 'primary',
  warning: 'warning',
  success: 'success',
  error: 'error',
  neutral: 'neutral',
}

const JobRow = memo(function JobRow({ job, onCancel, onRetry }) {
  const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending
  const platform = PLATFORM_CONFIG[job.platform]
  const StatusIcon = status.icon
  const PlatformIcon = platform?.icon

  return (
    <div className="border-border bg-surface shadow-card hover:border-primary/25 hover:shadow-float flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-150 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-3 sm:min-w-0 sm:flex-1">
        <div className="bg-surface-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
          {PlatformIcon && (
            <PlatformIcon
              className="text-foreground-muted h-4.5 w-4.5"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-bold">
            {job.title || job.clipId?.title || 'Untitled'}
          </p>
          <div className="text-foreground-muted mt-0.5 flex items-center gap-1.5 text-xs">
            <span>{platform?.label}</span>
            <span aria-hidden="true">·</span>
            <span>
              {job.scheduledAt
                ? formatDateTime(job.scheduledAt)
                : formatRelativeTime(job.createdAt)}
            </span>
          </div>
          {job.errorMessage && (
            <p className="text-error mt-1 truncate text-xs">{job.errorMessage}</p>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center justify-between gap-2 sm:justify-end">
        <Badge variant={TONE_MAP[status.tone]}>
          <StatusIcon
            className={cn('h-3 w-3', status.spin && 'animate-spin')}
            aria-hidden="true"
          />
          {status.label}
        </Badge>

        {job.platformVideoUrl && (
          <a
            href={job.platformVideoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground-muted hover:bg-surface-muted hover:text-primary rounded-lg p-1.5 transition-colors"
            aria-label="View on platform"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}

        {['pending', 'queued'].includes(job.status) && (
          <button
            onClick={() => onCancel(job._id)}
            className="text-foreground-muted hover:bg-error-light hover:text-error rounded-lg p-1.5 transition-colors"
            aria-label="Cancel job"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}

        {job.status === 'failed' && (
          <button
            onClick={() => onRetry(job._id)}
            className="text-foreground-muted hover:bg-surface-muted hover:text-primary rounded-lg p-1.5 transition-colors"
            aria-label="Retry job"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
})
JobRow.displayName = 'JobRow'

function JobRowSkeleton() {
  return (
    <div className="border-border bg-surface shadow-card flex items-center gap-4 rounded-2xl border p-4">
      <div className="skeleton h-10 w-10 flex-shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-4 w-48 rounded-lg" />
        <div className="skeleton mt-2 h-3 w-32 rounded-lg" />
      </div>
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
  )
}

export default function PublishingPage() {
  const queryClient = useQueryClient()
  const { success, error } = useNotificationContext()
  const [filter, setFilter] = useState('all')

  const { data, isLoading, isError, refetch } = useQuery({
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

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-5 lg:p-7">
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Publishing"
          description="Manage all your YouTube and Instagram publications."
          actions={
            <Button
              variant="secondary"
              onClick={() =>
                window.dispatchEvent(new CustomEvent('talishflow:open-upload'))
              }
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              New upload
            </Button>
          }
        />

        <div
          role="group"
          aria-label="Filter publishing jobs"
          className="no-scrollbar bg-surface-muted flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-xl p-1"
        >
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-150',
                'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
                filter === tab.id
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-foreground-muted hover:text-foreground'
              )}
              aria-pressed={filter === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <JobRowSkeleton key={i} />)
          ) : isError ? (
            <div className="border-border bg-surface flex flex-col items-center gap-3 rounded-2xl border px-6 py-12 text-center">
              <div className="bg-error-light flex h-12 w-12 items-center justify-center rounded-2xl">
                <AlertCircle className="text-error h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-foreground text-sm font-bold">
                  Could not load publishing jobs
                </p>
                <p className="text-foreground-muted mt-0.5 text-xs">
                  Something went wrong while fetching your jobs.
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => refetch()}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Try again
              </Button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="border-border bg-surface rounded-2xl border">
              <EmptyState
                icon={Radio}
                title="No publishing jobs"
                description={
                  filter === 'all'
                    ? 'Your published videos will appear here once you publish your first clip.'
                    : `No ${filter} jobs found.`
                }
                action={
                  filter === 'all'
                    ? {
                        label: 'Open the editor',
                        onClick: () => {
                          window.dispatchEvent(new CustomEvent('talishflow:open-upload'))
                        },
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            jobs.map((job) => (
              <JobRow
                key={job._id}
                job={job}
                onCancel={(id) => cancelMutation.mutate(id)}
                onRetry={(id) => retryMutation.mutate(id)}
              />
            ))
          )}
        </div>

        {total > 0 && (
          <p className="text-foreground-faint text-center text-xs">
            Showing {jobs.length} of {total} jobs
          </p>
        )}
      </div>
    </div>
  )
}
