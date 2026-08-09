import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, RefreshCw, Copy, Check, Wand2, ChevronDown } from 'lucide-react'
import clipService from '@/services/clipService'
import { useNotificationContext } from '@/context/NotificationContext'
import { copyToClipboard } from '@/utils/helpers'
import { CAPTION_LANGUAGES, CAPTION_STYLES } from '@/utils/constants'
import { cn } from '@/utils/cn'

export default function CaptionEditor({ clip, video }) {
  const [caption, setCaption] = useState(
    clip.generatedCaptions?.[clip.generatedCaptions.length - 1]?.text || ''
  )
  const [style, setStyle] = useState('professional')
  const [language, setLanguage] = useState('en')
  const [platform, setPlatform] = useState('general')
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')
  const { success, error } = useNotificationContext()

  const generateMutation = useMutation({
    mutationFn: () => clipService.generateCaption(clip._id, { style, language, platform }),
    onSuccess: (data) => {
      setCaption(data.caption)
    },
    onError: (err) => {
      error('Generation failed', err.userMessage || 'Could not generate caption.')
    },
  })

  const regenerateMutation = useMutation({
    mutationFn: () =>
      clipService.regenerateCaption(clip._id, { style, language, platform, feedback }),
    onSuccess: (data) => {
      setCaption(data.caption)
      setFeedback('')
    },
    onError: (err) => {
      error('Regeneration failed', err.userMessage || 'Could not regenerate caption.')
    },
  })

  const handleCopy = async () => {
    await copyToClipboard(caption)
    setCopied(true)
    success('Copied', 'Caption copied to clipboard.')
    setTimeout(() => setCopied(false), 2000)
  }

  const isLoading = generateMutation.isPending || regenerateMutation.isPending

  const selectClass = cn(
    'w-full px-3 py-2.5 rounded-xl text-sm text-white',
    'bg-white/10 border border-white/20 appearance-none',
    'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-[#2874F0]',
    'transition-all duration-150'
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-4">
          Caption Generator
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-white/40 font-semibold uppercase">Style</label>
            <div className="relative">
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className={selectClass}
              >
                {CAPTION_STYLES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#1A2330]">
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-white/40 font-semibold uppercase">Language</label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={selectClass}
              >
                {CAPTION_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#1A2330]">
                    {l.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-white/40 font-semibold uppercase">Platform</label>
            <div className="relative">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className={selectClass}
              >
                <option value="general" className="bg-[#1A2330]">General</option>
                <option value="youtube" className="bg-[#1A2330]">YouTube</option>
                <option value="instagram" className="bg-[#1A2330]">Instagram</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          onClick={() => generateMutation.mutate()}
          disabled={isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
            'bg-[#2874F0] hover:bg-[#1B5FCC] text-white text-sm font-semibold',
            'transition-all duration-150 shadow-md shadow-primary/20',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {generateMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating caption...</>
          ) : (
            <><Wand2 className="w-4 h-4" /> Generate Caption</>
          )}
        </button>
      </div>

      {caption && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
              Generated Caption
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => regenerateMutation.mutate()}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', regenerateMutation.isPending && 'animate-spin')} />
                Regenerate
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 text-[#22C55E]" /> Copied</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy</>
                )}
              </button>
            </div>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={6}
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm text-white',
              'bg-white/10 border border-white/20 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-[#2874F0]',
              'placeholder:text-white/30 transition-all duration-150'
            )}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-white/40 font-semibold uppercase">
              Feedback for regeneration (optional)
            </label>
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Make it shorter, more energetic, add a question..."
              className={cn(
                'w-full px-4 py-2.5 rounded-xl text-sm text-white',
                'bg-white/10 border border-white/20',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-[#2874F0]',
                'placeholder:text-white/30 transition-all duration-150'
              )}
            />
          </div>
        </div>
      )}
    </div>
  )
}