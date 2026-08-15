import { Play, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDuration } from '@/utils/formatters'
import { motion } from 'framer-motion'

function ClipTile({ clip, isSelected, onClick, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={() => onClick(clip)}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all duration-150',
        isSelected
          ? 'bg-primary/20 border-primary/40 border'
          : 'border border-transparent hover:bg-white/5'
      )}
    >
      <div className="relative aspect-[9/16] w-14 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
        {clip.thumbnailPath ? (
          <img
            src={`/api/v1/clips/${clip._id}/thumbnail`}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="h-4 w-4 text-white/40" />
          </div>
        )}

        {clip.detectionScore > 0 && (
          <div className="bg-primary absolute top-1 left-1 rounded px-1 py-0.5 text-[9px] leading-none font-black text-white">
            {clip.detectionScore}
          </div>
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
    </motion.button>
  )
}

function ClipTileSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <div className="skeleton aspect-[9/16] w-14 flex-shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton h-2.5 w-12 rounded" />
      </div>
    </div>
  )
}

export default function ClipGrid({ clips, isLoading, selectedClipId, onSelect }) {
  return (
    <div className="flex flex-col gap-1 p-3">
      <div className="flex items-center justify-between px-1 py-2">
        <p className="text-[11px] font-bold tracking-widest text-white/40 uppercase">
          Clips
        </p>
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/30" />}
      </div>

      {isLoading
        ? Array.from({ length: 5 }).map((_, i) => <ClipTileSkeleton key={i} />)
        : clips.map((clip, index) => (
            <ClipTile
              key={clip._id}
              clip={clip}
              index={index}
              isSelected={clip._id === selectedClipId}
              onClick={onSelect}
            />
          ))}
    </div>
  )
}
