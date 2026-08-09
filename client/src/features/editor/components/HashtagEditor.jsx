import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Copy, Check, Wand2, X, RefreshCw } from 'lucide-react'
import clipService from '@/services/clipService'
import { useNotificationContext } from '@/context/NotificationContext'
import { copyToClipboard } from '@/utils/helpers'
import { cn } from '@/utils/cn'

export default function HashtagEditor({ clip, video }) {
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
        <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-4">
          Hashtag Generator
        </p>

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-white/40 font-semibold uppercase">
              Content Category (optional)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="fitness, cooking, business, gaming..."
              className={cn(
                'w-full px-4 py-2.5 rounded-xl text-sm text-white',
                'bg-white/10 border border-white/20',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-[#2874F0]',
                'placeholder:text-white/30 transition-all duration-150'
              )}
            />
          </div>
        </div>

        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
            'bg-[#2874F0] hover:bg-[#1B5FCC] text-white text-sm font-semibold',
            'transition-all duration-150 shadow-md shadow-primary/20',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {generateMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating hashtags...</>
          ) : (
            <><Wand2 className="w-4 h-4" /> {hasHashtags ? 'Regenerate Hashtags' : 'Generate Hashtags'}</>
          )}
        </button>
      </div>

      {hasHashtags && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
              {hashtags.length} Hashtags
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', generateMutation.isPending && 'animate-spin')} />
                Refresh
              </button>

              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 text-[#22C55E]" /> Copied</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy All</>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <div
                key={tag}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2874F0]/20 text-[#2874F0] border border-[#2874F0]/30 hover:border-[#2874F0]/60 transition-all"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemove(tag)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#2874F0]/60 hover:text-[#EF4444]"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[11px] text-white/40 leading-relaxed font-mono break-all">
              {hashtags.join(' ')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}