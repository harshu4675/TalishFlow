import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Scissors, Download, ExternalLink, Play } from 'lucide-react'
import { apiClient } from '@/services/api'
import { QUERY_KEYS } from '@/utils/constants'
import { formatDuration, formatRelativeTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import EmptyState from '@/components/common/EmptyState'

async function fetchRecentClips() {
  const response = await apiClient.get('/clips?limit=6&sort=-createdAt')
  return response.data.data
}

function ClipCard({ clip, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group relative bg-[#F8F9FA] rounded-xl overflow-hidden border border-[#E0E0E0] hover:border-[#2874F0]/30 transition-all duration-200 hover:shadow-md"
    >
      <div className="aspect-[9/16] relative bg-[#0A0E12]">
        {clip.thumbnailUrl ? (
          <img
            src={clip.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-6 h-6 text-[#878787]" aria-hidden="true" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {clip.duration && (
          <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white bg-black/70 rounded-md px-1.5 py-0.5">
            {formatDuration(clip.duration)}
          </span>
        )}

        <div className="absolute bottom-2 left-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-[11px] font-semibold text-white truncate leading-snug">
            {clip.title || 'Untitled Clip'}
          </p>
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            className="w-6 h-6 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Download clip"
          >
            <Download className="w-3 h-3 text-white" aria-hidden="true" />
          </button>
          <button
            className="w-6 h-6 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Open in editor"
          >
            <ExternalLink className="w-3 h-3 text-white" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="px-2.5 py-2">
        <p className="text-[11px] font-semibold text-[#212121] truncate">
          {clip.title || 'Untitled Clip'}
        </p>
        <p className="text-[10px] text-[#878787] mt-0.5">
          {formatRelativeTime(clip.createdAt)}
        </p>
      </div>
    </motion.div>
  )
}

function ClipCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#E0E0E0]">
      <div className="aspect-[9/16] skeleton" />
      <div className="px-2.5 py-2 flex flex-col gap-1.5">
        <div className="h-3 w-20 skeleton rounded" />
        <div className="h-2.5 w-14 skeleton rounded" />
      </div>
    </div>
  )
}

export default function RecentClips() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.RECENT_CLIPS,
    queryFn: fetchRecentClips,
    staleTime: 1000 * 60,
  })

  const clips = data?.clips || []

  return (
    <div className="bg-white rounded-2xl border border-[#E0E0E0]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0]">
        <div>
          <h2 className="text-[15px] font-bold text-[#212121]">Recent Clips</h2>
          <p className="text-xs text-[#878787] mt-0.5">Generated vertical shorts</p>
        </div>
        {clips.length > 0 && (
          <button className="text-xs font-semibold text-[#2874F0] hover:text-[#2874F0]-hover transition-colors">
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