import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, AlertCircle, Clock, X } from 'lucide-react'
import { apiClient } from '@/services/api'
import { PROCESSING_STATUS, PROCESSING_STATUS_LABELS } from '@/utils/constants'
import { formatRelativeTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import EmptyState from '@/components/common/EmptyState'

async function fetchQueue() {
  const response = await apiClient.get('/processing/queue')
  return response.data.data
}

function ProgressBar({ progress }) {
  return (
    <div className="h-1.5 w-full bg-[#F8F9FA] rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-[#2874F0]"
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
      className="flex items-start gap-4 p-4 rounded-xl bg-[#F8F9FA] border border-[#E0E0E0]"
    >
      <div className="flex-shrink-0 mt-0.5">
        {isActive && (
          <div className="w-8 h-8 rounded-xl bg-[#2874F0]/10 flex items-center justify-center">
            <Loader2
              className="w-4 h-4 text-[#2874F0] animate-spin"
              aria-hidden="true"
            />
          </div>
        )}
        {isComplete && (
          <div className="w-8 h-8 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
          </div>
        )}
        {isFailed && (
          <div className="w-8 h-8 rounded-xl bg-[#EF4444]/10 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
          </div>
        )}
        {job.status === PROCESSING_STATUS.PENDING && (
          <div className="w-8 h-8 rounded-xl bg-[#F8F9FA] border border-[#E0E0E0] flex items-center justify-center">
            <Clock className="w-4 h-4 text-[#878787]" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[#212121] truncate">
              {job.videoTitle || 'Processing Video'}
            </p>
            <p className="text-xs text-[#878787] mt-0.5">
              {PROCESSING_STATUS_LABELS[job.status] || 'Processing'}
              {job.progress > 0 && ` · ${job.progress}%`}
            </p>
          </div>
          <span className="text-[11px] text-[#878787] flex-shrink-0">
            {formatRelativeTime(job.createdAt)}
          </span>
        </div>

        {isActive && (
          <div className="mt-3">
            <ProgressBar progress={job.progress} />
          </div>
        )}

        {isFailed && job.errorMessage && (
          <p className="text-xs text-[#EF4444] mt-2 leading-relaxed">{job.errorMessage}</p>
        )}
      </div>
    </motion.div>
  )
}

function QueueSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-[#F8F9FA] border border-[#E0E0E0]">
      <div className="w-8 h-8 rounded-xl skeleton flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3.5 w-40 skeleton rounded-lg" />
        <div className="h-3 w-24 skeleton rounded-lg" />
        <div className="h-1.5 w-full skeleton rounded-full mt-1" />
      </div>
    </div>
  )
}

export default function ProcessingQueue() {
  const { data, isLoading } = useQuery({
    queryKey: ['processing', 'queue'],
    queryFn: fetchQueue,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 10,
  })

  const jobs = data?.jobs || []
  const activeJobs = jobs.filter((j) => j.status !== PROCESSING_STATUS.COMPLETED)

  if (!isLoading && activeJobs.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-[#E0E0E0]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0]">
        <div>
          <h2 className="text-[15px] font-bold text-[#212121]">Processing Queue</h2>
          <p className="text-xs text-[#878787] mt-0.5">
            {isLoading ? 'Loading...' : `${activeJobs.length} job${activeJobs.length !== 1 ? 's' : ''} in progress`}
          </p>
        </div>
        {activeJobs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#2874F0] animate-pulse" />
            <span className="text-xs font-semibold text-[#2874F0]">Processing</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
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