import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, RefreshCw, Copy, Check, Wand2, ChevronDown } from 'lucide-react'
import clipService from '@/services/clipService'
import { useNotificationContext } from '@/contexts/NotificationContext'
import { copyToClipboard } from '@/utils/helpers'
import { CAPTION_LANGUAGES, CAPTION_STYLES } from '@/utils/constants'
import { cn } from '@/utils/cn'

export default function CaptionEditor({ clip }) {
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
    mutationFn: () =>
      clipService.generateCaption(clip._id, { style, language, platform }),
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
    'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
    'transition-all duration-150'
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-4 text-xs font-bold tracking-widest text-white/40 uppercase">
          Caption Generator
        </p>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/40 uppercase">
              Style
            </label>
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
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/40 uppercase">
              Language
            </label>
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
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/40 uppercase">
              Platform
            </label>
            <div className="relative">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className={selectClass}
              >
                <option value="general" className="bg-[#1A2330]">
                  General
                </option>
                <option value="youtube" className="bg-[#1A2330]">
                  YouTube
                </option>
                <option value="instagram" className="bg-[#1A2330]">
                  Instagram
                </option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            </div>
          </div>
        </div>

        <button
          onClick={() => generateMutation.mutate()}
          disabled={isLoading}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3',
            'bg-primary hover:bg-primary-hover text-sm font-semibold text-white',
            'shadow-primary/20 shadow-md transition-all duration-150',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating caption...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" /> Generate Caption
            </>
          )}
        </button>
      </div>

      {caption && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold tracking-widest text-white/40 uppercase">
                Generated Caption
              </p>
              <span className="border-primary/30 bg-primary/10 text-primary rounded-md border px-2 py-0.5 text-[10px] font-bold">
                {platform === 'general' ? 'All platforms' : platform}
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/50 capitalize">
                {style}
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <button
                onClick={() => regenerateMutation.mutate()}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  className={cn(
                    'h-3.5 w-3.5',
                    regenerateMutation.isPending && 'animate-spin'
                  )}
                />
                Regenerate
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/10 hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="text-success h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="border-primary/25 from-primary/15 via-primary/5 overflow-hidden rounded-2xl border bg-gradient-to-br to-white/5">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={6}
              className={cn(
                'w-full resize-none bg-transparent px-4 py-3.5 text-sm leading-relaxed text-white',
                'focus:outline-none',
                'transition-all duration-150 placeholder:text-white/30'
              )}
            />
            <div className="border-primary/15 flex items-center justify-between border-t px-4 py-2">
              <span className="text-primary/70 text-[10px] font-semibold tracking-wide uppercase">
                Caption text
              </span>
              <span className="text-[11px] font-semibold text-white/40">
                {caption.length} / 2200 characters
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-white/40 uppercase">
              Feedback for regeneration (optional)
            </label>
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Make it shorter, more energetic, add a question..."
              className={cn(
                'w-full rounded-xl px-4 py-2.5 text-sm text-white',
                'border border-white/20 bg-white/10',
                'focus:ring-primary/50 focus:border-primary focus:ring-2 focus:outline-none',
                'transition-all duration-150 placeholder:text-white/30'
              )}
            />
          </div>
        </div>
      )}
    </div>
  )
}
