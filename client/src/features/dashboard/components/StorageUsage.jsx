import { useQuery } from '@tanstack/react-query'
import { HardDrive, Video, Scissors, FileText } from 'lucide-react'
import { apiClient } from '@/services/api'
import { formatFileSize, formatPercent } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

async function fetchStorage() {
  const response = await apiClient.get('/analytics/storage')
  return response.data.data
}

const STORAGE_LIMIT = 50 * 1024 * 1024 * 1024

function StorageSegment({ label, icon: Icon, color, bg, bytes, total }) {
  void Icon
  const percent = total > 0 ? (bytes / total) * 100 : 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', bg)}>
          <Icon className={cn('h-3.5 w-3.5', color)} aria-hidden="true" />
        </div>
        <div>
          <p className="text-foreground text-xs font-semibold">{label}</p>
          <p className="text-foreground-muted text-[11px]">{formatPercent(percent)}</p>
        </div>
      </div>
      <span className="text-foreground text-xs font-bold">
        {formatFileSize(bytes || 0)}
      </span>
    </div>
  )
}

export default function StorageUsage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'storage'],
    queryFn: fetchStorage,
    staleTime: 1000 * 60 * 5,
  })

  const used = data?.totalUsed || 0
  const usedPercent = (used / STORAGE_LIMIT) * 100

  const getBarColor = () => {
    if (usedPercent >= 90) return 'bg-error'
    if (usedPercent >= 75) return 'bg-warning'
    return 'bg-primary'
  }

  return (
    <div className="bg-surface border-border rounded-2xl border">
      <div className="border-border border-b px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-[15px] font-bold">Storage</h2>
            <p className="text-foreground-muted mt-0.5 text-xs">Active file usage</p>
          </div>
          <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-xl">
            <HardDrive className="text-primary h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <div className="skeleton h-2.5 w-full rounded-full" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="skeleton h-7 w-7 rounded-lg" />
                    <div className="flex flex-col gap-1.5">
                      <div className="skeleton h-3 w-16 rounded" />
                      <div className="skeleton h-2.5 w-10 rounded" />
                    </div>
                  </div>
                  <div className="skeleton h-3 w-12 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted text-xs font-medium">
                  {formatFileSize(used)} used
                </span>
                <span className="text-foreground-muted text-xs font-medium">
                  {formatFileSize(STORAGE_LIMIT)} total
                </span>
              </div>

              <div className="bg-surface-muted h-2.5 w-full overflow-hidden rounded-full">
                <motion.div
                  className={cn('h-full rounded-full', getBarColor())}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(usedPercent, 100)}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <p className="text-foreground-muted text-[11px]">
                {formatPercent(usedPercent)} of {formatFileSize(STORAGE_LIMIT)} used
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              <StorageSegment
                label="Videos"
                icon={Video}
                color="text-primary"
                bg="bg-primary/10"
                bytes={data?.breakdown?.videos}
                total={used}
              />
              <StorageSegment
                label="Clips"
                icon={Scissors}
                color="text-accent"
                bg="bg-accent/10"
                bytes={data?.breakdown?.clips}
                total={used}
              />
              <StorageSegment
                label="Subtitles"
                icon={FileText}
                color="text-warning"
                bg="bg-warning/10"
                bytes={data?.breakdown?.subtitles}
                total={used}
              />
            </div>

            <div className="border-border border-t pt-3">
              <p className="text-foreground-muted text-[11px] leading-relaxed">
                Files are automatically deleted after 24 hours to protect your privacy.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
