import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Scissors, Divide, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDuration } from '@/utils/formatters'

function WaveformCanvas({ waveformData, duration, currentTime, trimStart, trimEnd, onSeek }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !waveformData?.length) return

    const ctx = canvas.getContext('2d')
    const { width, height } = canvas
    const samples = waveformData

    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = '#1A2330'
    ctx.fillRect(0, 0, width, height)

    const barWidth = width / samples.length
    const centerY = height / 2

    const trimStartX = duration > 0 ? (trimStart / duration) * width : 0
    const trimEndX = duration > 0 ? (trimEnd / duration) * width : width

    ctx.fillStyle = 'rgba(15, 110, 124, 0.08)'
    ctx.fillRect(0, 0, trimStartX, height)
    ctx.fillRect(trimEndX, 0, width - trimEndX, height)

    samples.forEach((amplitude, index) => {
      const x = index * barWidth
      const barHeight = Math.max(2, amplitude * (height * 0.8))
      const y = centerY - barHeight / 2

      const isInTrim = x >= trimStartX && x <= trimEndX

      ctx.fillStyle = isInTrim ? '#2874F0' : 'rgba(15, 110, 124, 0.3)'
      ctx.fillRect(x, y, Math.max(1, barWidth - 0.5), barHeight)
    })

    if (duration > 0) {
      const playheadX = (currentTime / duration) * width
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(playheadX - 1, 0, 2, height)
    }

    ctx.strokeStyle = '#2874F0'
    ctx.lineWidth = 2

    if (trimStartX > 0) {
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(trimStartX, 0)
      ctx.lineTo(trimStartX, height)
      ctx.stroke()
    }

    if (trimEndX < width) {
      ctx.beginPath()
      ctx.moveTo(trimEndX, 0)
      ctx.lineTo(trimEndX, height)
      ctx.stroke()
    }

    ctx.setLineDash([])
  }, [waveformData, duration, currentTime, trimStart, trimEnd])

  const handleClick = useCallback((event) => {
    const canvas = canvasRef.current
    if (!canvas || !duration) return
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const time = (x / canvas.width) * duration
    onSeek?.(Math.max(0, Math.min(time, duration)))
  }, [duration, onSeek])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={80}
      onClick={handleClick}
      className="w-full h-20 rounded-xl cursor-crosshair"
      aria-label="Waveform timeline"
    />
  )
}

function TrimHandle({ position, onDrag, side, duration }) {
  const handleRef = useRef(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startValue = useRef(0)

  const handleMouseDown = useCallback((event) => {
    event.preventDefault()
    isDragging.current = true
    startX.current = event.clientX
    startValue.current = position

    const handleMouseMove = (moveEvent) => {
      if (!isDragging.current) return

      const deltaX = moveEvent.clientX - startX.current
      const parent = handleRef.current?.closest('[data-timeline]')

      if (!parent) return

      const { width } = parent.getBoundingClientRect()
      const deltaTime = (deltaX / width) * duration
      const newTime = Math.max(0, Math.min(startValue.current + deltaTime, duration))

      onDrag(newTime)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [position, duration, onDrag])

  const percentage = duration > 0 ? (position / duration) * 100 : 0

  return (
    <div
      ref={handleRef}
      className={cn(
        'absolute top-0 h-full w-5 cursor-ew-resize z-10 flex items-center justify-center',
        'group touch-none select-none'
      )}
      style={{ left: `calc(${percentage}% - 10px)` }}
      onMouseDown={handleMouseDown}
      role="slider"
      aria-label={`${side} trim handle`}
      aria-valuenow={Math.round(position)}
    >
      <div className={cn(
        'w-1.5 h-12 rounded-full bg-[#2874F0] shadow-lg',
        'group-hover:bg-[#FB641B] transition-colors',
        'group-hover:scale-110 transition-transform'
      )}>
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-[#2874F0] rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {formatDuration(position)}
        </div>
      </div>
    </div>
  )
}

function SplitMarker({ splitTime, duration }) {
  const percentage = duration > 0 ? (splitTime / duration) * 100 : 50

  return (
    <div
      className="absolute top-0 h-full flex flex-col items-center pointer-events-none"
      style={{ left: `${percentage}%` }}
    >
      <div className="w-0.5 h-full bg-[#F59E0B]/80" />
      <div className="absolute -top-2 text-[10px] font-bold text-[#F59E0B] bg-[#F59E0B]/20 rounded px-1 whitespace-nowrap">
        Split: {formatDuration(splitTime)}
      </div>
    </div>
  )
}

export default function TimelineEditor({
  clip,
  waveformData,
  currentTime,
  onSeek,
  onTrim,
  onSplit,
  isTrimming,
  isSplitting,
}) {
  const duration = clip?.duration || 0
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(duration)
  const [mode, setMode] = useState('trim')
  const [splitTime, setSplitTime] = useState(duration / 2)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    setTrimStart(0)
    setTrimEnd(duration)
    setSplitTime(duration / 2)
  }, [clip?._id, duration])

  const handleTrimStartDrag = useCallback((time) => {
    setTrimStart(Math.min(time, trimEnd - 3))
  }, [trimEnd])

  const handleTrimEndDrag = useCallback((time) => {
    setTrimEnd(Math.max(time, trimStart + 3))
  }, [trimStart])

  const handleSplitDrag = useCallback((time) => {
    setSplitTime(Math.max(3, Math.min(time, duration - 3)))
  }, [duration])

  const handleApplyTrim = () => {
    if (trimStart === 0 && trimEnd === duration) return
    onTrim(trimStart, trimEnd)
  }

  const handleApplySplit = () => {
    onSplit(splitTime)
  }

  const trimmedDuration = trimEnd - trimStart
  const isChanged = trimStart > 0 || trimEnd < duration

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
          <button
            onClick={() => setMode('trim')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
              mode === 'trim'
                ? 'bg-[#2874F0] text-white'
                : 'text-white/50 hover:text-white'
            )}
          >
            <Scissors className="w-3.5 h-3.5" />
            Trim
          </button>
          <button
            onClick={() => setMode('split')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
              mode === 'split'
                ? 'bg-[#F59E0B] text-white'
                : 'text-white/50 hover:text-white'
            )}
          >
            <Divide className="w-3.5 h-3.5" />
            Split
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            disabled={zoom <= 1}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-white/40 w-10 text-center">{zoom}x</span>
          <button
            onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
            disabled={zoom >= 4}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative" data-timeline>
        <WaveformCanvas
          waveformData={waveformData}
          duration={duration}
          currentTime={currentTime}
          trimStart={mode === 'trim' ? trimStart : 0}
          trimEnd={mode === 'trim' ? trimEnd : duration}
          onSeek={onSeek}
        />

        {mode === 'trim' && duration > 0 && (
          <>
            <TrimHandle
              position={trimStart}
              onDrag={handleTrimStartDrag}
              side="start"
              duration={duration}
            />
            <TrimHandle
              position={trimEnd}
              onDrag={handleTrimEndDrag}
              side="end"
              duration={duration}
            />
          </>
        )}

        {mode === 'split' && duration > 0 && (
          <div
            className="absolute top-0 h-full"
            style={{ width: '100%' }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const time = (x / rect.width) * duration
              handleSplitDrag(time)
            }}
          >
            <SplitMarker splitTime={splitTime} duration={duration} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-white/40">
        <span>{formatDuration(0)}</span>
        <span>{formatDuration(duration / 2)}</span>
        <span>{formatDuration(duration)}</span>
      </div>

      {mode === 'trim' && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold">Start</p>
              <p className="text-sm font-bold text-white">{formatDuration(trimStart)}</p>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold">End</p>
              <p className="text-sm font-bold text-white">{formatDuration(trimEnd)}</p>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold">Duration</p>
              <p className="text-sm font-bold text-[#2874F0]">{formatDuration(trimmedDuration)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isChanged && (
              <button
                onClick={() => {
                  setTrimStart(0)
                  setTrimEnd(duration)
                }}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Reset trim"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleApplyTrim}
              disabled={isTrimming || !isChanged}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold',
                'bg-[#2874F0] hover:bg-[#1B5FCC] text-white transition-all',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <Scissors className="w-3.5 h-3.5" />
              {isTrimming ? 'Trimming...' : 'Apply Trim'}
            </button>
          </div>
        </div>
      )}

      {mode === 'split' && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold">Split Point</p>
              <p className="text-sm font-bold text-[#F59E0B]">{formatDuration(splitTime)}</p>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold">Part 1</p>
              <p className="text-sm font-bold text-white">{formatDuration(splitTime)}</p>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold">Part 2</p>
              <p className="text-sm font-bold text-white">{formatDuration(duration - splitTime)}</p>
            </div>
          </div>

          <button
            onClick={handleApplySplit}
            disabled={isSplitting}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold',
              'bg-[#F59E0B] hover:bg-yellow-500 text-white transition-all',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <Divide className="w-3.5 h-3.5" />
            {isSplitting ? 'Splitting...' : 'Apply Split'}
          </button>
        </div>
      )}
    </div>
  )
}