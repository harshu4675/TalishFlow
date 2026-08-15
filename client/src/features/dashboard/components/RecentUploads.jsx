import { memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { apiClient } from '@/services/api'
import { QUERY_KEYS, PROCESSING_STATUS } from '@/utils/constants'
import { formatRelativeTime, formatDuration, formatFileSize } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import EmptyState from '@/components/common/EmptyState'
import { motion } from 'framer-motion'

async function fetchRecentUploads() {
  const response = await apiClient.get('/videos?limit=5&sort=-createdAt')
  return response.data.data
}

function StatusBadge({ status }) {
  const config = {
    [PROCESSING_STATUS.COMPLETED]: {
      label: 'Ready',
      icon: CheckCircle2,
      class: 'text-success bg-success/10',
    },
    [PROCESSING_STATUS.FAILED]: {
      label: 'Failed',
      icon: AlertCircle,
      class: 'text-error bg-error/10',
    },
    [PROCESSING_STATUS.PENDING]: {
      label: 'Pending',
      icon: Clock,
      class: 'text-foreground-muted bg-surface-muted',
    },
    [PROCESSING_STATUS.ANALYZING]: {
      label: 'Processing',
      icon: Loader2,
      class: 'text-primary bg-primary/10',
      spin: true,
    },
  }

  const matched = config[status] || config[PROCESSING_STATUS.PENDING]
  const Icon = matched.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
        matched.class
      )}
    >
      <Icon
        className={cn('h-3 w-3', matched.spin && 'animate-spin')}
        aria-hidden="true"
      />
      {matched.label}
    </span>
  )
}

function VideoThumbnail({ video }) {
  return (
    <div className="bg-surface-muted relative h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg">
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Video className="text-foreground-muted h-5 w-5" aria-hidden="true" />
        </div>
      )}
      {video.duration && (
        <span className="absolute right-0.5 bottom-0.5 rounded bg-black/70 px-1 text-[9px] leading-snug font-bold text-white">
          {formatDuration(video.duration)}
        </span>
      )}
    </div>
  )
}

const UploadRow = memo(function UploadRow({ video, index }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="hover:bg-surface-muted group flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all duration-150"
      onClick={() => navigate(`/editor/${video._id}`)}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/editor/${video._id}`)}
      aria-label={`Open ${video.title}`}
    >
      <VideoThumbnail video={video} />

      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm leading-snug font-semibold">
          {video.title || 'Untitled Video'}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-foreground-muted text-[11px]">
            {formatRelativeTime(video.createdAt)}
          </span>
          {video.fileSize && (
            <>
              <span className="text-border" aria-hidden="true">
                ·
              </span>
              <span className="text-foreground-muted text-[11px]">
                {formatFileSize(video.fileSize)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <StatusBadge status={video.processingStatus} />
        <ChevronRight
          className="text-foreground-muted h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      </div>
    </motion.div>
  )
})
UploadRow.displayName = 'UploadRow'

function UploadRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="skeleton h-10 w-14 flex-shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-3.5 w-40 rounded-lg" />
        <div className="skeleton h-3 w-24 rounded-lg" />
      </div>
      <div className="skeleton h-6 w-16 rounded-full" />
    </div>
  )
}

export default function RecentUploads() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.RECENT_UPLOADS,
    queryFn: fetchRecentUploads,
    staleTime: 1000 * 60,
  })

  const videos = data?.videos || []

  return (
    <div className="bg-surface border-border rounded-2xl border">
      <div className="border-border flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-foreground text-[15px] font-bold">Recent Uploads</h2>
          <p className="text-foreground-muted mt-0.5 text-xs">
            Your latest video uploads
          </p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('talishflow:open-upload'))}
          className="text-primary hover:text-primary-hover text-xs font-semibold transition-colors"
        >
          Upload new
        </button>
      </div>

      <div className="p-2" role="table" aria-label="Recent uploads">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <UploadRowSkeleton key={i} />)
        ) : videos.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No uploads yet"
            description="Upload your first video to get started."
            action={{
              label: 'Upload Video',
              onClick: () =>
                window.dispatchEvent(new CustomEvent('talishflow:open-upload')),
            }}
          />
        ) : (
          videos.map((video, index) => (
            <UploadRow key={video._id} video={video} index={index} />
          ))
        )}
      </div>
    </div>
  )
}
