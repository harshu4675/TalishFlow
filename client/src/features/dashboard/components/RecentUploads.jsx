import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react'
import { apiClient } from '@/services/api'
import { QUERY_KEYS, PROCESSING_STATUS } from '@/utils/constants'
import { formatRelativeTime, formatDuration, formatFileSize } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import EmptyState from '@/components/common/EmptyState'

async function fetchRecentUploads() {
  const response = await apiClient.get('/videos?limit=5&sort=-createdAt')
  return response.data.data
}

function StatusBadge({ status }) {
  const config = {
    [PROCESSING_STATUS.COMPLETED]: {
      label: 'Ready',
      icon: CheckCircle2,
      class: 'text-[#22C55E] bg-[#22C55E]/10',
    },
    [PROCESSING_STATUS.FAILED]: {
      label: 'Failed',
      icon: AlertCircle,
      class: 'text-[#EF4444] bg-[#EF4444]/10',
    },
    [PROCESSING_STATUS.PENDING]: {
      label: 'Pending',
      icon: Clock,
      class: 'text-[#878787] bg-[#F8F9FA]',
    },
    [PROCESSING_STATUS.ANALYZING]: {
      label: 'Processing',
      icon: Loader2,
      class: 'text-[#2874F0] bg-[#2874F0]/10',
      spin: true,
    },
  }

  const matched = config[status] || config[PROCESSING_STATUS.PENDING]
  const Icon = matched.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold',
        matched.class
      )}
    >
      <Icon
        className={cn('w-3 h-3', matched.spin && 'animate-spin')}
        aria-hidden="true"
      />
      {matched.label}
    </span>
  )
}

function VideoThumbnail({ video }) {
  return (
    <div className="w-14 h-10 rounded-lg bg-[#F8F9FA] flex-shrink-0 overflow-hidden relative">
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Video className="w-5 h-5 text-[#878787]" aria-hidden="true" />
        </div>
      )}
      {video.duration && (
        <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold text-white bg-black/70 rounded px-1 leading-snug">
          {formatDuration(video.duration)}
        </span>
      )}
    </div>
  )
}

function UploadRow({ video, index }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8F9FA] transition-all duration-150 cursor-pointer group"
      onClick={() => navigate(`/editor/${video._id}`)}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/editor/${video._id}`)}
      aria-label={`Open ${video.title}`}
    >
      <VideoThumbnail video={video} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#212121] truncate leading-snug">
          {video.title || 'Untitled Video'}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-[#878787]">
            {formatRelativeTime(video.createdAt)}
          </span>
          {video.fileSize && (
            <>
              <span className="text-border" aria-hidden="true">·</span>
              <span className="text-[11px] text-[#878787]">
                {formatFileSize(video.fileSize)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={video.processingStatus} />
        <ChevronRight
          className="w-3.5 h-3.5 text-[#878787] opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      </div>
    </motion.div>
  )
}

function UploadRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="w-14 h-10 rounded-lg skeleton flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3.5 w-40 skeleton rounded-lg" />
        <div className="h-3 w-24 skeleton rounded-lg" />
      </div>
      <div className="h-6 w-16 skeleton rounded-full" />
    </div>
  )
}

export default function RecentUploads() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.RECENT_UPLOADS,
    queryFn: fetchRecentUploads,
    staleTime: 1000 * 60,
  })

  const videos = data?.videos || []

  return (
    <div className="bg-white rounded-2xl border border-[#E0E0E0]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0]">
        <div>
          <h2 className="text-[15px] font-bold text-[#212121]">Recent Uploads</h2>
          <p className="text-xs text-[#878787] mt-0.5">Your latest video uploads</p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('talishflow:open-upload'))}
          className="text-xs font-semibold text-[#2874F0] hover:text-[#2874F0]-hover transition-colors"
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
              onClick: () => window.dispatchEvent(new CustomEvent('talishflow:open-upload')),
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