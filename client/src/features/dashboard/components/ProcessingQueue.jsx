import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { processingService } from '@/services/processingService'
import { queryKeys } from '@/utils/queryKeys'
import { PROCESSING_STATUS, PROCESSING_STATUS_LABELS } from '@/utils/constants'
import { formatRelativeTime } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState'

function ProgressBar({ progress }) {
  return (
    <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
      <motion.div
        className="bg-primary h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress || 0}%` }}
        transition={{ ease: 'linear', duration: 0.5 }}
      />
    </div>
  )
}

function QueueItem({ job, index }) {
  const isActive = [
    PROCESSING_STATUS.ANALYZING,
    PROCESSING_STATUS.DETECTING_SCENES,
    PROCESSING_STATUS.DETECTING_SPEECH,
    PROCESSING_STATUS.DETECTING_FACES,
    PROCESSING_STATUS.GENERATING_CLIPS,
    PROCESSING_STATUS.TRANSCRIBING,
    PROCESSING_STATUS.CONVERTING,
    PROCESSING_STATUS.DOWNLOADING,
  ].includes(job.status)

  const isComplete = job.status === PROCESSING_STATUS.COMPLETED
  const isFailed = job.status === PROCESSING_STATUS.FAILED

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="bg-surface-muted border-border flex items-start gap-4 rounded-xl border p-4"
    >
      <div className="mt-0.5 flex-shrink-0">
        {isActive && (
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-xl">
            <Loader2 className="text-primary h-4 w-4 animate-spin" aria-hidden="true" />
          </div>
        )}
        {isComplete && (
          <div className="bg-success/10 flex h-8 w-8 items-center justify-center rounded-xl">
            <CheckCircle2 className="text-success h-4 w-4" aria-hidden="true" />
          </div>
        )}
        {isFailed && (
          <div className="bg-error/10 flex h-8 w-8 items-center justify-center rounded-xl">
            <AlertCircle className="text-error h-4 w-4" aria-hidden="true" />
          </div>
        )}
        {job.status === PROCESSING_STATUS.PENDING && (
          <div className="bg-surface-muted border-border flex h-8 w-8 items-center justify-center rounded-xl border">
            <Clock className="text-foreground-muted h-4 w-4" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-semibold">
              {job.videoTitle || 'Processing Video'}
            </p>
            <p className="text-foreground-muted mt-0.5 text-xs">
              {PROCESSING_STATUS_LABELS[job.status] || 'Processing'}
              {job.progress > 0 && ` · ${job.progress}%`}
            </p>
          </div>
          <span className="text-foreground-muted flex-shrink-0 text-[11px]">
            {formatRelativeTime(job.createdAt)}
          </span>
        </div>

        {isActive && (
          <div className="mt-3">
            <ProgressBar progress={job.progress} />
          </div>
        )}

        {isFailed && job.errorMessage && (
          <p className="text-error mt-2 text-xs leading-relaxed">{job.errorMessage}</p>
        )}
      </div>
    </motion.div>
  )
}

function QueueSkeleton() {
  return (
    <div className="bg-surface-muted border-border flex items-start gap-4 rounded-xl border p-4">
      <div className="skeleton h-8 w-8 flex-shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-3.5 w-40 rounded-lg" />
        <div className="skeleton h-3 w-24 rounded-lg" />
        <div className="skeleton mt-1 h-1.5 w-full rounded-full" />
      </div>
    </div>
  )
}

export default function ProcessingQueue() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.processingQueue,
    queryFn: processingService.getQueue,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 10,
  })

  const jobs = data?.jobs || []
  const activeJobs = jobs.filter((j) => j.status !== PROCESSING_STATUS.COMPLETED)

  if (!isLoading && activeJobs.length === 0) return null

  return (
    <div className="bg-surface border-border rounded-2xl border">
      <div className="border-border flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-foreground text-[15px] font-bold">Processing Queue</h2>
          <p className="text-foreground-muted mt-0.5 text-xs">
            {isLoading
              ? 'Loading...'
              : `${activeJobs.length} job${activeJobs.length !== 1 ? 's' : ''} in progress`}
          </p>
        </div>
        {activeJobs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
            <span className="text-primary text-xs font-semibold">Processing</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <QueueSkeleton key={i} />)
        ) : (
          <AnimatePresence mode="popLayout">
            {activeJobs.map((job, index) => (
              <QueueItem key={job._id} job={job} index={index} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
