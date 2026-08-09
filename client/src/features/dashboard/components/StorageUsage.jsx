import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { HardDrive, Video, Scissors, FileText } from 'lucide-react'
import { apiClient } from '@/services/api'
import { formatFileSize, formatPercent } from '@/utils/formatters'
import { cn } from '@/utils/cn'

async function fetchStorage() {
  const response = await apiClient.get('/analytics/storage')
  return response.data.data
}

const STORAGE_LIMIT = 50 * 1024 * 1024 * 1024

function StorageSegment({ label, icon: Icon, color, bg, bytes, total }) {
  const percent = total > 0 ? (bytes / total) * 100 : 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', bg)}>
          <Icon className={cn('w-3.5 h-3.5', color)} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#212121]">{label}</p>
          <p className="text-[11px] text-[#878787]">{formatPercent(percent)}</p>
        </div>
      </div>
      <span className="text-xs font-bold text-[#212121]">
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
    if (usedPercent >= 90) return 'bg-[#EF4444]'
    if (usedPercent >= 75) return 'bg-[#F59E0B]'
    return 'bg-[#2874F0]'
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E0E0E0]">
      <div className="px-5 py-4 border-b border-[#E0E0E0]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-[#212121]">Storage</h2>
            <p className="text-xs text-[#878787] mt-0.5">Active file usage</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#2874F0]/10 flex items-center justify-center">
            <HardDrive className="w-4 h-4 text-[#2874F0]" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <div className="h-2.5 w-full skeleton rounded-full" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 skeleton rounded-lg" />
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3 w-16 skeleton rounded" />
                      <div className="h-2.5 w-10 skeleton rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-12 skeleton rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#878787] font-medium">
                  {formatFileSize(used)} used
                </span>
                <span className="text-xs text-[#878787] font-medium">
                  {formatFileSize(STORAGE_LIMIT)} total
                </span>
              </div>

              <div className="h-2.5 w-full bg-[#F8F9FA] rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', getBarColor())}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(usedPercent, 100)}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <p className="text-[11px] text-[#878787]">
                {formatPercent(usedPercent)} of {formatFileSize(STORAGE_LIMIT)} used
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              <StorageSegment
                label="Videos"
                icon={Video}
                color="text-[#2874F0]"
                bg="bg-[#2874F0]/10"
                bytes={data?.breakdown?.videos}
                total={used}
              />
              <StorageSegment
                label="Clips"
                icon={Scissors}
                color="text-[#FB641B]"
                bg="bg-[#FB641B]/10"
                bytes={data?.breakdown?.clips}
                total={used}
              />
              <StorageSegment
                label="Subtitles"
                icon={FileText}
                color="text-[#F59E0B]"
                bg="bg-[#F59E0B]/10"
                bytes={data?.breakdown?.subtitles}
                total={used}
              />
            </div>

            <div className="pt-3 border-t border-[#E0E0E0]">
              <p className="text-[11px] text-[#878787] leading-relaxed">
                Files are automatically deleted after 24 hours to protect your privacy.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}