import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, Youtube, Instagram, Clock, CheckCircle2 } from 'lucide-react'
import { apiClient } from '@/services/api'
import { QUERY_KEYS } from '@/utils/constants'
import { formatDateTime, formatRelativeTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import EmptyState from '@/components/common/EmptyState'

async function fetchScheduled() {
  const response = await apiClient.get('/publishing/scheduled?limit=5')
  return response.data.data
}

const PLATFORM_CONFIG = {
  youtube: {
    icon: Youtube,
    color: 'text-[#EF4444]',
    bg: 'bg-[#EF4444]/10',
    label: 'YouTube',
  },
  instagram: {
    icon: Instagram,
    color: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10',
    label: 'Instagram',
  },
}

function ScheduledItem({ post, index }) {
  const platform = PLATFORM_CONFIG[post.platform] || PLATFORM_CONFIG.youtube
  const PlatformIcon = platform.icon
  const isPast = new Date(post.scheduledAt) < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8F9FA] transition-all duration-150"
    >
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
          platform.bg
        )}
      >
        <PlatformIcon
          className={cn('w-4 h-4', platform.color)}
          aria-hidden="true"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#212121] truncate leading-snug">
          {post.title || 'Untitled Post'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3 h-3 text-[#878787]" aria-hidden="true" />
          <span className="text-[11px] text-[#878787]">
            {formatDateTime(post.scheduledAt)}
          </span>
        </div>
      </div>

      <span
        className={cn(
          'text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0',
          isPast
            ? 'text-[#22C55E] bg-[#22C55E]/10'
            : 'text-[#2874F0] bg-[#2874F0]/10'
        )}
      >
        {isPast ? 'Published' : 'Scheduled'}
      </span>
    </motion.div>
  )
}

function ScheduledItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="w-8 h-8 rounded-xl skeleton flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3.5 w-36 skeleton rounded-lg" />
        <div className="h-3 w-24 skeleton rounded-lg" />
      </div>
      <div className="h-6 w-16 skeleton rounded-full" />
    </div>
  )
}

export default function ScheduledPosts() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.SCHEDULED,
    queryFn: fetchScheduled,
    staleTime: 1000 * 60 * 2,
  })

  const posts = data?.posts || []

  return (
    <div className="bg-white rounded-2xl border border-[#E0E0E0]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0]">
        <div>
          <h2 className="text-[15px] font-bold text-[#212121]">Scheduled Posts</h2>
          <p className="text-xs text-[#878787] mt-0.5">Upcoming publications</p>
        </div>
        {posts.length > 0 && (
          <button className="text-xs font-semibold text-[#2874F0] hover:text-[#2874F0]-hover transition-colors">
            View calendar
          </button>
        )}
      </div>

      <div className="p-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <ScheduledItemSkeleton key={i} />)
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Nothing scheduled"
            description="Schedule your clips to publish automatically."
          />
        ) : (
          posts.map((post, index) => (
            <ScheduledItem key={post._id} post={post} index={index} />
          ))
        )}
      </div>
    </div>
  )
}