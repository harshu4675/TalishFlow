import { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDuration } from '@/utils/formatters'

export default function ClipPreview({ clip }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(clip.duration || 0)

  const handlePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100
    setProgress(isNaN(pct) ? 0 : pct)
  }

  const handleSeek = (event) => {
    if (!videoRef.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    const pct = (event.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pct * videoRef.current.duration
  }

  const handleToggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[220px]">
      <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/10">
        {clip.filePath ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            playsInline
          >
            <source src={`/api/v1/clips/${clip._id}/stream`} type="video/mp4" />
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-xs text-white/30">Preview unavailable</p>
          </div>
        )}

        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <div className={cn(
            'w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all',
            'opacity-0 group-hover:opacity-100',
            isPlaying && 'opacity-0 group-hover:opacity-100'
          )}>
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </div>
        </button>
      </div>

      <div className="w-full flex flex-col gap-2">
        <div
          className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden cursor-pointer"
          onClick={handleSeek}
          role="slider"
          aria-label="Video progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[#2874F0] rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleToggleMute}
            className="p-1 rounded text-white/40 hover:text-white transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <span className="text-[11px] text-white/40 font-medium">
            {formatDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}