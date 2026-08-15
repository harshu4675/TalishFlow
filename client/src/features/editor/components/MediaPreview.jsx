import { forwardRef } from 'react'
import { useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDuration } from '@/utils/formatters'
import { clipService } from '@/services/clipService'
import { IconButton } from '@/components/ui/icon-button'

const MediaPreview = forwardRef(function MediaPreview(
  { clip, currentTime = 0, onTimeUpdate },
  videoRef
) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(clip.duration || 0)

  const handlePlayPause = () => {
    if (!videoRef?.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  const handleToggleMute = () => {
    if (!videoRef?.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleSeek = (event) => {
    if (!videoRef?.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    const pct = (event.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pct * videoRef.current.duration
    onTimeUpdate?.()
  }

  const progress = videoRef?.current?.duration
    ? (videoRef.current.currentTime / videoRef.current.duration) * 100
    : 0

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
      <div className="shadow-float relative aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-2xl border border-white/10 bg-black">
        {clip.filePath ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(e) => {
              setDuration(e.target.duration)
              onTimeUpdate?.(e.target.currentTime)
            }}
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            playsInline
          >
            <source src={clipService.getStreamUrl(clip._id)} type="video/mp4" />
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
              'flex h-12 w-12 items-center justify-center rounded-full bg-black/60 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100',
              !isPlaying && 'opacity-100'
            )}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white" aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 h-5 w-5 text-white" aria-hidden="true" />
            )}
          </div>
        </button>
      </div>

      <div className="flex w-full max-w-[240px] flex-col gap-2.5">
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
          <div className="flex items-center gap-1">
            <IconButton
              variant="ghost"
              size="sm"
              label={isMuted ? 'Unmute' : 'Mute'}
              onClick={handleToggleMute}
              className="text-white/40 hover:text-white"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
            </IconButton>
            <a
              href={clipService.getDownloadUrl(clip._id, 'clip.mp4')}
              download
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Download clip"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/40">
            <span>{formatDuration(currentTime || 0)}</span>
            <span aria-hidden="true">/</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
})

MediaPreview.displayName = 'MediaPreview'

export default MediaPreview
