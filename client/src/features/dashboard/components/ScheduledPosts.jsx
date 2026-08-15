import { memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Calendar, Youtube, Instagram, Clock } from 'lucide-react'
import { publishingService } from '@/services/publishingService'
import { ROUTES } from '@/utils/constants'
import { queryKeys } from '@/utils/queryKeys'
import { formatDateTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import EmptyState from '@/components/common/EmptyState'
import { motion } from 'framer-motion'

const PLATFORM_CONFIG = {
  youtube: {
    icon: Youtube,
    color: 'text-error',
    bg: 'bg-error/10',
    label: 'YouTube',
  },
  instagram: {
    icon: Instagram,
    color: 'text-warning',
    bg: 'bg-warning/10',
    label: 'Instagram',
  },
}

const ScheduledItem = memo(function ScheduledItem({ post, index }) {
  const platform = PLATFORM_CONFIG[post.platform] || PLATFORM_CONFIG.youtube
  const PlatformIcon = platform.icon
  const isPast = new Date(post.scheduledAt) < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="hover:bg-surface-muted flex items-center gap-3 rounded-xl p-3 transition-all duration-150"
    >
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl',
          platform.bg
        )}
      >
        <PlatformIcon className={cn('h-4 w-4', platform.color)} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm leading-snug font-semibold">
          {post.title || 'Untitled Post'}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Clock className="text-foreground-muted h-3 w-3" aria-hidden="true" />
          <span className="text-foreground-muted text-[11px]">
            {formatDateTime(post.scheduledAt)}
          </span>
        </div>
      </div>

      <span
        className={cn(
          'flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold',
          isPast ? 'text-success bg-success/10' : 'text-primary bg-primary/10'
        )}
      >
        {isPast ? 'Published' : 'Scheduled'}
      </span>
    </motion.div>
  )
})
ScheduledItem.displayName = 'ScheduledItem'

function ScheduledItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="skeleton h-8 w-8 flex-shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-3.5 w-36 rounded-lg" />
        <div className="skeleton h-3 w-24 rounded-lg" />
      </div>
      <div className="skeleton h-6 w-16 rounded-full" />
    </div>
  )
}

export default function ScheduledPosts() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.scheduled,
    queryFn: () => publishingService.getScheduledPosts({ limit: 5 }),
    staleTime: 1000 * 60 * 2,
  })

  const posts = data?.posts || []

  return (
    <div className="bg-surface border-border rounded-2xl border">
      <div className="border-border flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="text-foreground text-[15px] font-bold">Scheduled Posts</h2>
          <p className="text-foreground-muted mt-0.5 text-xs">Upcoming publications</p>
        </div>
        {posts.length > 0 && (
          <button
            onClick={() => navigate(ROUTES.PUBLISHING)}
            className="text-primary hover:text-primary-hover text-xs font-semibold transition-colors"
          >
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
