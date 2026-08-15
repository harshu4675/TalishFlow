import { memo } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDuration } from '@/utils/formatters'
import { clipService } from '@/services/clipService'

const ClipTile = memo(function ClipTile({
  clip,
  isSelected,
  onClick,
  index,
  horizontal,
}) {
  return (
    <button
      onClick={() => onClick(clip)}
      className={cn(
        'flex items-start gap-3 rounded-xl p-2.5 text-left transition-all duration-150',
        'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:outline-none',
        horizontal ? 'w-40 flex-shrink-0' : 'w-full',
        isSelected
          ? 'border-primary/40 bg-primary/20 border'
          : 'border border-transparent hover:bg-white/5'
      )}
      aria-pressed={isSelected}
    >
      <div className="relative aspect-[9/16] w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
        {clip.thumbnailPath ? (
          <img
            src={clipService.getThumbnailUrl(clip._id)}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="h-4 w-4 text-white/40" aria-hidden="true" />
          </div>
        )}

        {clip.detectionScore > 0 && (
          <span className="bg-primary absolute top-1 left-1 rounded px-1 py-0.5 text-[9px] leading-none font-black text-white">
            {clip.detectionScore}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="truncate text-xs leading-snug font-bold text-white">
          {clip.title || `Clip ${index + 1}`}
        </p>
        <p className="mt-1 text-[11px] text-white/40">{formatDuration(clip.duration)}</p>
        {clip.detectionReasons?.length > 0 && (
          <p className="mt-1 truncate text-[10px] text-white/30">
            {clip.detectionReasons[0]}
          </p>
        )}
      </div>
    </button>
  )
})

ClipTile.displayName = 'ClipTile'

function ClipTileSkeleton({ horizontal }) {
  return (
    <div
      className={cn('flex items-start gap-3 p-2.5', horizontal && 'w-40 flex-shrink-0')}
    >
      <div className="skeleton aspect-[9/16] w-12 flex-shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-2.5 w-10 rounded" />
      </div>
    </div>
  )
}

export default function ClipRail({
  clips,
  isLoading,
  selectedClipId,
  onSelect,
  horizontal = false,
}) {
  return (
    <div
      className={cn(
        horizontal ? 'flex gap-2 overflow-x-auto p-3' : 'flex flex-col gap-1 p-3'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-1 py-1.5',
          horizontal && 'hidden'
        )}
      >
        <p className="text-[11px] font-bold tracking-widest text-white/40 uppercase">
          Clips
        </p>
        {isLoading && (
          <Loader2
            className="h-3.5 w-3.5 animate-spin text-white/30"
            aria-hidden="true"
          />
        )}
      </div>

      {isLoading
        ? Array.from({ length: horizontal ? 4 : 5 }).map((_, i) => (
            <ClipTileSkeleton key={i} horizontal={horizontal} />
          ))
        : clips.map((clip, index) => (
            <ClipTile
              key={clip._id}
              clip={clip}
              index={index}
              isSelected={clip._id === selectedClipId}
              onClick={onSelect}
              horizontal={horizontal}
            />
          ))}
    </div>
  )
}
