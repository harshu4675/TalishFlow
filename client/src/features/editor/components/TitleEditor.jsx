import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Copy, Check, Wand2 } from 'lucide-react'
import clipService from '@/services/clipService'
import { useNotificationContext } from '@/context/NotificationContext'
import { copyToClipboard } from '@/utils/helpers'
import { cn } from '@/utils/cn'

const TITLE_FORMATS = [
  { key: 'youtube', label: 'YouTube', color: 'text-[#EF4444]' },
  { key: 'shorts', label: 'Shorts', color: 'text-[#EF4444]' },
  { key: 'instagram', label: 'Instagram', color: 'text-[#F59E0B]' },
  { key: 'seo', label: 'SEO', color: 'text-[#22C55E]' },
  { key: 'clickbait', label: 'Viral Hook', color: 'text-[#2874F0]' },
]

function TitleRow({ format, title, onUpdate }) {
  const [copied, setCopied] = useState(false)
  const { success } = useNotificationContext()

  const handleCopy = async () => {
    await copyToClipboard(title)
    setCopied(true)
    success('Copied', `${format.label} title copied.`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between">
        <span className={cn('text-[11px] font-bold uppercase tracking-wider', format.color)}>
          {format.label}
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
          aria-label={`Copy ${format.label} title`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-[#22C55E]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => onUpdate(format.key, e.target.value)}
        className={cn(
          'w-full px-3 py-2.5 rounded-lg text-sm text-white',
          'bg-white/10 border border-white/20',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-[#2874F0]',
          'placeholder:text-white/30 transition-all duration-150'
        )}
      />

      <p className="text-[10px] text-white/30">
        {title.length} characters
      </p>
    </div>
  )
}

export default function TitleEditor({ clip, video }) {
  const [titles, setTitles] = useState(() => {
    const existing = {}
    clip.generatedTitles?.forEach((t) => {
      existing[t.platform] = t.title
    })
    return existing
  })

  const { error } = useNotificationContext()

  const generateMutation = useMutation({
    mutationFn: () => clipService.generateTitles(clip._id),
    onSuccess: (data) => {
      setTitles(data.titles)
    },
    onError: (err) => {
      error('Generation failed', err.userMessage || 'Could not generate titles.')
    },
  })

  const handleUpdate = (key, value) => {
    setTitles((prev) => ({ ...prev, [key]: value }))
  }

  const hasTitles = Object.keys(titles).length > 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-4">
          Title Generator
        </p>

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
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating titles...</>
          ) : (
            <><Wand2 className="w-4 h-4" /> {hasTitles ? 'Regenerate Titles' : 'Generate Titles'}</>
          )}
        </button>
      </div>

      {hasTitles && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
            Generated Titles
          </p>
          {TITLE_FORMATS.map((format) => (
            <TitleRow
              key={format.key}
              format={format}
              title={titles[format.key] || ''}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}