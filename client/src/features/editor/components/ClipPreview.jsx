import { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
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
    <div className="flex w-full max-w-[220px] flex-col items-center gap-4">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
        {clip.filePath ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            playsInline
          >
            <source src={`/api/v1/clips/${clip._id}/stream`} type="video/mp4" />
          </video>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-xs text-white/30">Preview unavailable</p>
          </div>
        )}

        <button
          onClick={handlePlayPause}
          className="group absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/20"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-all',
              'opacity-0 group-hover:opacity-100',
              isPlaying && 'opacity-0 group-hover:opacity-100'
            )}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white" />
            ) : (
              <Play className="ml-0.5 h-5 w-5 text-white" />
            )}
          </div>
        </button>
      </div>

      <div className="flex w-full flex-col gap-2">
        <div
          className="h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/20"
          onClick={handleSeek}
          role="slider"
          aria-label="Video progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="bg-primary h-full rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleToggleMute}
            className="rounded p-1 text-white/40 transition-colors hover:text-white"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>

          <span className="text-[11px] font-medium text-white/40">
            {formatDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
