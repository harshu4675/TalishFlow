import { memo, useEffect, useMemo, useState } from 'react'
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
  Search,
  Video,
} from 'lucide-react'
import { publishingService } from '@/services/publishingService'
import { queryKeys } from '@/utils/queryKeys'
import { useNotificationContext } from '@/contexts/NotificationContext'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'
import ErrorState from '@/components/common/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Pagination from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utils/cn'
import { formatRelativeTime, formatDateTime } from '@/utils/formatters'
import useDebounce from '@/hooks/useDebounce'

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Scheduled' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'published', label: 'Published' },
  { id: 'failed', label: 'Failed' },
]

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'scheduledAt', label: 'Schedule date' },
  { value: 'title', label: 'Title A-Z' },
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

function JobThumbnail({ job }) {
  const clip = job.clipId

  return (
    <div className="bg-surface-muted relative flex h-11 w-[74px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg">
      {clip?.thumbnailPath ? (
        <img
          src={clip.thumbnailPath}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <Video className="text-foreground-faint h-4 w-4" aria-hidden="true" />
      )}
      {clip?.duration && (
        <span className="absolute right-0.5 bottom-0.5 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
          {Math.floor(clip.duration / 60)}:
          {String(Math.floor(clip.duration % 60)).padStart(2, '0')}
        </span>
      )}
    </div>
  )
}

const JobRow = memo(function JobRow({ job, onCancel, onRetry }) {
  const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending
  const platform = PLATFORM_CONFIG[job.platform]
  const StatusIcon = status.icon
  const PlatformIcon = platform?.icon

  return (
    <div className="border-border bg-surface shadow-card hover:border-primary/25 hover:shadow-float flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-150 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-3 sm:min-w-0 sm:flex-1">
        <JobThumbnail job={job} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {PlatformIcon && (
              <span
                className={cn(
                  'bg-surface-muted flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md'
                )}
              >
                <PlatformIcon
                  className="text-foreground-muted h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </span>
            )}
            <p className="text-foreground truncate text-sm font-bold">
              {job.title || job.clipId?.title || 'Untitled'}
            </p>
          </div>
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
      <div className="skeleton h-11 w-[74px] flex-shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-4 w-48 rounded-lg" />
        <div className="skeleton h-3 w-32 rounded-lg" />
      </div>
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
  )
}

export default function PublishingPage() {
  const queryClient = useQueryClient()
  const { success, error } = useNotificationContext()
  const [filter, setFilter] = useState('all')
  const [platform, setPlatform] = useState('all')
  const [sort, setSort] = useState('-createdAt')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)

  const searching = debouncedSearch.trim().length > 0
  const pageSize = 10

  const params = {
    status: filter === 'all' ? undefined : filter,
    platform: platform === 'all' ? undefined : platform,
    sort,
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.publishing.jobs(
      searching ? { ...params, search: true } : { ...params, page, limit: pageSize }
    ),
    queryFn: () =>
      publishingService.listJobs(
        searching ? { ...params, limit: 100 } : { ...params, page, limit: pageSize }
      ),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 15,
    placeholderData: (previous) => previous,
  })

  useEffect(() => {
    setPage(1)
  }, [filter, platform, sort])

  const jobs = useMemo(() => {
    const allJobs = data?.jobs || []
    if (!searching) return allJobs
    const q = debouncedSearch.trim().toLowerCase()
    return allJobs.filter((job) =>
      `${job.title || ''} ${job.clipId?.title || ''} ${job.platform || ''}`
        .toLowerCase()
        .includes(q)
    )
  }, [data, searching, debouncedSearch])

  const pagination = data?.pagination
  const totalPages = pagination?.pages || 1

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

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                className="text-foreground-faint absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter jobs..."
                className="h-9 w-full pl-8 sm:w-52"
                aria-label="Filter publishing jobs"
              />
            </div>

            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="h-9 w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isLoading && !data ? (
            Array.from({ length: 5 }).map((_, i) => <JobRowSkeleton key={i} />)
          ) : isError ? (
            <div className="border-border bg-surface rounded-2xl border">
              <ErrorState
                title="Could not load publishing jobs"
                description="Something went wrong while fetching your jobs."
                onRetry={() => refetch()}
              />
            </div>
          ) : jobs.length === 0 ? (
            <div className="border-border bg-surface rounded-2xl border">
              <EmptyState
                icon={Radio}
                title="No publishing jobs"
                description={
                  searching || filter !== 'all'
                    ? 'No jobs match the current filters.'
                    : 'Your published videos will appear here once you publish your first clip.'
                }
                action={
                  !searching && filter === 'all'
                    ? {
                        label: 'Open the editor',
                        onClick: () =>
                          window.dispatchEvent(new CustomEvent('talishflow:open-upload')),
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

        {!searching && pagination && pagination.total > pageSize && (
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-foreground-faint text-xs">
              Showing {(pagination.page - 1) * pageSize + 1}–
              {Math.min(pagination.page * pageSize, pagination.total)} of{' '}
              {pagination.total} jobs
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
