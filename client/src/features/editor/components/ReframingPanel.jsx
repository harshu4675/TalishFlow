import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Move, RotateCcw, Check, Loader2 } from 'lucide-react'
import timelineService from '@/services/timelineService'
import { useNotificationContext } from '@/context/NotificationContext'
import { cn } from '@/utils/cn'

function CropOverlay({ sourceWidth, sourceHeight, cropData, onCropChange }) {
  const containerRef = useRef(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, cropX: 0, cropY: 0 })

  const getScaleFactor = useCallback(() => {
    const container = containerRef.current
    if (!container) return 1
    return container.offsetWidth / sourceWidth
  }, [sourceWidth])

  const handleMouseDown = useCallback((event) => {
    event.preventDefault()
    isDragging.current = true
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      cropX: cropData.x,
      cropY: cropData.y,
    }

    const handleMouseMove = (moveEvent) => {
      if (!isDragging.current) return

      const scale = getScaleFactor()
      const deltaX = (moveEvent.clientX - dragStart.current.x) / scale
      const deltaY = (moveEvent.clientY - dragStart.current.y) / scale

      const newX = Math.max(0, Math.min(dragStart.current.cropX + deltaX, sourceWidth - cropData.width))
      const newY = Math.max(0, Math.min(dragStart.current.cropY + deltaY, sourceHeight - cropData.height))

      onCropChange({ ...cropData, x: Math.round(newX), y: Math.round(newY) })
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [cropData, sourceWidth, sourceHeight, onCropChange, getScaleFactor])

  const scale = sourceWidth > 0 ? 100 / sourceWidth : 1

  const overlayStyle = {
    left: `${cropData.x * scale}%`,
    top: `${(cropData.y / sourceHeight) * 100}%`,
    width: `${cropData.width * scale}%`,
    height: `${(cropData.height / sourceHeight) * 100}%`,
  }

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black/60 rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="absolute border-2 border-[#2874F0] cursor-move bg-[#2874F0]/5"
        style={overlayStyle}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-[#2874F0]/80 rounded-full p-2">
            <Move className="w-4 h-4 text-white" />
          </div>
        </div>

        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <div
              key={`${row}-${col}`}
              className="absolute border-white/20"
              style={{
                left: `${col * 33.33}%`,
                top: `${row * 33.33}%`,
                width: '33.33%',
                height: '33.33%',
                borderRightWidth: col < 2 ? '1px' : 0,
                borderBottomWidth: row < 2 ? '1px' : 0,
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}

function PresetCard({ preset, isSelected, onSelect, clipId }) {
  const previewUrl = timelineService.getReframingPreviewUrl(clipId, preset.cropData, 2)

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(preset)}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-left',
        isSelected
          ? 'border-[#2874F0] bg-[#2874F0]/10'
          : 'border-white/20 hover:border-white/40 bg-white/5'
      )}
    >
      <div className="w-full aspect-[9/16] rounded-lg overflow-hidden bg-black relative">
        <img
          src={previewUrl}
          alt={preset.label}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#2874F0]/20">
            <div className="w-6 h-6 rounded-full bg-[#2874F0] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-[11px] font-bold text-white text-center">{preset.label}</p>
        <p className="text-[10px] text-white/40 text-center mt-0.5">{preset.description}</p>
      </div>
    </motion.button>
  )
}

export default function ReframingPanel({ clip }) {
  const { success, error, info } = useNotificationContext()
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [customCrop, setCustomCrop] = useState(null)
  const [mode, setMode] = useState('preset')

  const optionsQuery = useQuery({
    queryKey: ['reframing', 'options', clip._id],
    queryFn: () => timelineService.getReframingOptions(clip._id),
    enabled: !!clip._id && !!clip.filePath,
    staleTime: 1000 * 60 * 10,
  })

  const reframingMutation = useMutation({
    mutationFn: (cropData) => timelineService.applyReframing(clip._id, cropData),
    onSuccess: () => {
      info('Reframing started', 'Your clip is being reframed. You will be notified when complete.')
    },
    onError: (err) => {
      error('Reframing failed', err.userMessage || 'Could not apply reframing.')
    },
  })

  const options = optionsQuery.data

  useEffect(() => {
    if (options?.options?.length && !selectedPreset) {
      const center = options.options.find((o) => o.id === 'center') || options.options[0]
      setSelectedPreset(center)
      setCustomCrop(center.cropData)
    }
  }, [options])

  const handleApply = () => {
    const cropData = mode === 'preset' ? selectedPreset?.cropData : customCrop

    if (!cropData) {
      error('No crop selected', 'Please select a crop option before applying.')
      return
    }

    reframingMutation.mutate(cropData)
  }

  if (optionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#2874F0] animate-spin" />
      </div>
    )
  }

  if (!options) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-white/40">Reframing options are not available for this clip.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">
          Smart Vertical Reframing
        </p>
        <p className="text-[11px] text-white/30">
          Original: {options.sourceWidth}×{options.sourceHeight} → Target: {options.targetWidth}×{options.targetHeight}
        </p>
      </div>

      <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
        <button
          onClick={() => setMode('preset')}
          className={cn(
            'flex-1 py-2 rounded-lg text-xs font-semibold transition-all',
            mode === 'preset'
              ? 'bg-[#2874F0] text-white'
              : 'text-white/50 hover:text-white'
          )}
        >
          Presets
        </button>
        <button
          onClick={() => setMode('custom')}
          className={cn(
            'flex-1 py-2 rounded-lg text-xs font-semibold transition-all',
            mode === 'custom'
              ? 'bg-[#2874F0] text-white'
              : 'text-white/50 hover:text-white'
          )}
        >
          Custom
        </button>
      </div>

      {mode === 'preset' && (
        <div className="grid grid-cols-3 gap-3">
          {options.options.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPreset?.id === preset.id}
              onSelect={(p) => {
                setSelectedPreset(p)
                setCustomCrop(p.cropData)
              }}
              clipId={clip._id}
            />
          ))}
        </div>
      )}

      {mode === 'custom' && customCrop && (
        <div className="flex flex-col gap-4">
          <CropOverlay
            sourceWidth={options.sourceWidth}
            sourceHeight={options.sourceHeight}
            cropData={customCrop}
            onCropChange={setCustomCrop}
          />

          <div className="grid grid-cols-2 gap-2 text-[11px] text-white/40">
            {[
              { label: 'X', value: customCrop.x, key: 'x', max: options.sourceWidth - customCrop.width },
              { label: 'Y', value: customCrop.y, key: 'y', max: options.sourceHeight - customCrop.height },
              { label: 'Width', value: customCrop.width, key: 'width', max: options.sourceWidth },
              { label: 'Height', value: customCrop.height, key: 'height', max: options.sourceHeight },
            ].map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <label className="font-semibold uppercase">{field.label}</label>
                <input
                  type="number"
                  value={field.value}
                  min={0}
                  max={field.max}
                  onChange={(e) =>
                    setCustomCrop((prev) => ({
                      ...prev,
                      [field.key]: Math.max(0, Math.min(parseInt(e.target.value) || 0, field.max)),
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              if (options.options.length) {
                setCustomCrop(options.options[0].cropData)
              }
            }}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors self-start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to default
          </button>
        </div>
      )}

      <button
        onClick={handleApply}
        disabled={reframingMutation.isPending || (!selectedPreset && !customCrop)}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
          'bg-[#2874F0] hover:bg-[#1B5FCC] text-white text-sm font-semibold',
          'transition-all shadow-md shadow-primary/20',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {reframingMutation.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Applying reframing...</>
        ) : (
          'Apply Reframing'
        )}
      </button>
    </div>
  )
}