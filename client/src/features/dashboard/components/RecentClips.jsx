import { memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Scissors, Download, ExternalLink, Play } from 'lucide-react'
import { apiClient } from '@/services/api'
import { QUERY_KEYS, ROUTES } from '@/utils/constants'
import { formatDuration, formatRelativeTime } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState'
import { motion } from 'framer-motion'

async function fetchRecentClips() {
  const response = await apiClient.get('/clips?limit=6&sort=-createdAt')
  return response.data.data
}

const ClipCard = memo(function ClipCard({ clip, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group bg-surface-muted border-border hover:border-primary/30 relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md"
    >
      <div className="relative aspect-[9/16] bg-[#0A0E12]">
        {clip.thumbnailUrl ? (
          <img
            src={clip.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="text-foreground-muted h-6 w-6" aria-hidden="true" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        {clip.duration && (
          <span className="absolute right-2 bottom-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {formatDuration(clip.duration)}
          </span>
        )}

        <div className="absolute right-10 bottom-2 left-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <p className="truncate text-[11px] leading-snug font-semibold text-white">
            {clip.title || 'Untitled Clip'}
          </p>
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm transition-colors hover:bg-black/80"
            aria-label="Download clip"
          >
            <Download className="h-3 w-3 text-white" aria-hidden="true" />
          </button>
          <button
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm transition-colors hover:bg-black/80"
            aria-label="Open in editor"
          >
            <ExternalLink className="h-3 w-3 text-white" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="px-2.5 py-2">
        <p className="text-foreground truncate text-[11px] font-semibold">
          {clip.title || 'Untitled Clip'}
        </p>
        <p className="text-foreground-muted mt-0.5 text-[10px]">
          {formatRelativeTime(clip.createdAt)}
        </p>
      </div>
    </motion.div>
  )
})
ClipCard.displayName = 'ClipCard'

function ClipCardSkeleton() {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="skeleton aspect-[9/16]" />
      <div className="flex flex-col gap-1.5 px-2.5 py-2">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-2.5 w-14 rounded" />
      </div>
    </div>
  )
}

export default function RecentClips() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.RECENT_CLIPS,
    queryFn: fetchRecentClips,
    staleTime: 1000 * 60,
  })

  const clips = data?.clips || []

  return (
    <div className="bg-surface border-border rounded-2xl border">
      <div className="border-border flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-foreground text-[15px] font-bold">Recent Clips</h2>
          <p className="text-foreground-muted mt-0.5 text-xs">
            Generated vertical shorts
          </p>
        </div>
        {clips.length > 0 && (
          <button
            onClick={() => navigate(ROUTES.PUBLISHING)}
            className="text-primary hover:text-primary-hover text-xs font-semibold transition-colors"
          >
            View all
          </button>
        )}
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ClipCardSkeleton key={i} />
            ))}
          </div>
        ) : clips.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title="No clips yet"
            description="Process a video to auto-generate viral clips."
          />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {clips.map((clip, index) => (
              <ClipCard key={clip._id} clip={clip} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
