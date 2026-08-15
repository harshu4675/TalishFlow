import { FileText, Clock, Gauge, Calendar, Hash, Film } from 'lucide-react'
import { formatDuration, formatRelativeTime, formatNumber } from '@/utils/formatters'

function InfoRow({ icon, label, value }) {
  const Icon = icon
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="flex items-center gap-2 text-xs font-semibold text-white/50">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </span>
      <span className="truncate text-xs font-bold text-white">{value}</span>
    </div>
  )
}

export default function ClipInfo({ clip, video }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-3 text-xs font-bold tracking-widest text-white/40 uppercase">
          Clip details
        </p>
        <div className="flex flex-col gap-2">
          <InfoRow icon={Film} label="Source video" value={video?.title || '—'} />
          <InfoRow icon={Clock} label="Duration" value={formatDuration(clip.duration)} />
          <InfoRow
            icon={Gauge}
            label="Detection score"
            value={clip.detectionScore || '—'}
          />
          <InfoRow
            icon={Calendar}
            label="Created"
            value={formatRelativeTime(clip.createdAt)}
          />
          {clip.detectionReasons?.length > 0 && (
            <InfoRow
              icon={Hash}
              label="Detected for"
              value={clip.detectionReasons.join(', ')}
            />
          )}
        </div>
      </div>

      {clip.stats && (
        <div>
          <p className="mb-3 text-xs font-bold tracking-widest text-white/40 uppercase">
            Clip performance
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Views', value: formatNumber(clip.stats.views) },
              { label: 'Likes', value: formatNumber(clip.stats.likes) },
              { label: 'Shares', value: formatNumber(clip.stats.shares) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center"
              >
                <p className="text-sm font-black text-white">{stat.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-white/40 uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
