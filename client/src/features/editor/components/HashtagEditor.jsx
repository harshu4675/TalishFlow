import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Copy, Check, Wand2, X, RefreshCw } from 'lucide-react'
import clipService from '@/services/clipService'
import { useNotificationContext } from '@/contexts/NotificationContext'
import { copyToClipboard } from '@/utils/helpers'
import { cn } from '@/utils/cn'

export default function HashtagEditor({ clip }) {
  const [hashtags, setHashtags] = useState(clip.generatedHashtags || [])
  const [category, setCategory] = useState('')
  const [copied, setCopied] = useState(false)
  const { success, error } = useNotificationContext()

  const generateMutation = useMutation({
    mutationFn: () => clipService.generateHashtags(clip._id, { category }),
    onSuccess: (data) => {
      setHashtags(data.hashtags)
    },
    onError: (err) => {
      error('Generation failed', err.userMessage || 'Could not generate hashtags.')
    },
  })

  const handleCopyAll = async () => {
    await copyToClipboard(hashtags.join(' '))
    setCopied(true)
    success('Copied', 'All hashtags copied to clipboard.')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRemove = (tag) => {
    setHashtags((prev) => prev.filter((t) => t !== tag))
  }

  const hasHashtags = hashtags.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-4 text-xs font-bold tracking-widest text-white/40 uppercase">
          Hashtag Generator
        </p>

        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/40 uppercase">
              Content Category (optional)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="fitness, cooking, business, gaming..."
              className={cn(
                'w-full rounded-xl px-4 py-2.5 text-sm text-white',
                'border border-white/20 bg-white/10',
                'focus:ring-primary/50 focus:border-primary focus:ring-2 focus:outline-none',
                'transition-all duration-150 placeholder:text-white/30'
              )}
            />
          </div>
        </div>

        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3',
            'bg-primary hover:bg-primary-hover text-sm font-semibold text-white',
            'shadow-primary/20 shadow-md transition-all duration-150',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating hashtags...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />{' '}
              {hasHashtags ? 'Regenerate Hashtags' : 'Generate Hashtags'}
            </>
          )}
        </button>
      </div>

      {hasHashtags && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase">
              {hashtags.length} Hashtags
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  className={cn(
                    'h-3.5 w-3.5',
                    generateMutation.isPending && 'animate-spin'
                  )}
                />
                Refresh
              </button>

              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/10 hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="text-success h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy All
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <div
                key={tag}
                className="group bg-primary/20 text-primary border-primary/30 hover:border-primary/60 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemove(tag)}
                  className="text-primary/60 hover:text-error opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="font-mono text-[11px] leading-relaxed break-all text-white/40">
              {hashtags.join(' ')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
