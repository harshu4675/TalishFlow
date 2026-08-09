import { motion } from 'framer-motion'
import { Play, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDuration } from '@/utils/formatters'

function ClipTile({ clip, isSelected, onClick, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={() => onClick(clip)}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-150',
        isSelected
          ? 'bg-[#2874F0]/20 border border-[#2874F0]/40'
          : 'border border-transparent hover:bg-white/5'
      )}
    >
      <div className="relative w-14 flex-shrink-0 aspect-[9/16] rounded-lg overflow-hidden bg-white/10">
        {clip.thumbnailPath ? (
          <img
            src={`/api/v1/clips/${clip._id}/thumbnail`}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-4 h-4 text-white/40" />
          </div>
        )}

        {clip.detectionScore > 0 && (
          <div className="absolute top-1 left-1 text-[9px] font-black text-white bg-[#2874F0] rounded px-1 py-0.5 leading-none">
            {clip.detectionScore}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-xs font-bold text-white truncate leading-snug">
          {clip.title || `Clip ${index + 1}`}
        </p>

        <p className="text-[11px] text-white/40 mt-1">
          {formatDuration(clip.duration)}
        </p>

        {clip.detectionReasons?.length > 0 && (
          <p className="text-[10px] text-white/30 mt-1 truncate">
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
      <div className="w-14 aspect-[9/16] rounded-lg skeleton flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2 pt-1">
        <div className="h-3 w-28 skeleton rounded" />
        <div className="h-2.5 w-12 skeleton rounded" />
      </div>
    </div>
  )
}

export default function ClipGrid({
  clips,
  isLoading,
  selectedClipId,
  onSelect,
  processingStatus,
}) {
  return (
    <div className="p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between px-1 py-2">
        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
          Clips
        </p>
        {isLoading && (
          <Loader2 className="w-3.5 h-3.5 text-white/30 animate-spin" />
        )}
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