import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Copy, Check, Wand2 } from 'lucide-react'
import clipService from '@/services/clipService'
import { useNotificationContext } from '@/context/NotificationContext'
import { copyToClipboard } from '@/utils/helpers'
import { cn } from '@/utils/cn'

const TITLE_FORMATS = [
  { key: 'youtube', label: 'YouTube', color: 'text-error' },
  { key: 'shorts', label: 'Shorts', color: 'text-error' },
  { key: 'instagram', label: 'Instagram', color: 'text-warning' },
  { key: 'seo', label: 'SEO', color: 'text-success' },
  { key: 'clickbait', label: 'Viral Hook', color: 'text-primary' },
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
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <span
          className={cn('text-[11px] font-bold tracking-wider uppercase', format.color)}
        >
          {format.label}
        </span>
        <button
          onClick={handleCopy}
          className="rounded-lg p-1.5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
          aria-label={`Copy ${format.label} title`}
        >
          {copied ? (
            <Check className="text-success h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => onUpdate(format.key, e.target.value)}
        className={cn(
          'w-full rounded-lg px-3 py-2.5 text-sm text-white',
          'border border-white/20 bg-white/10',
          'focus:ring-primary/50 focus:border-primary focus:ring-2 focus:outline-none',
          'transition-all duration-150 placeholder:text-white/30'
        )}
      />

      <p className="text-[10px] text-white/30">{title.length} characters</p>
    </div>
  )
}

export default function TitleEditor({ clip }) {
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
        <p className="mb-4 text-xs font-bold tracking-widest text-white/40 uppercase">
          Title Generator
        </p>

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
              <Loader2 className="h-4 w-4 animate-spin" /> Generating titles...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />{' '}
              {hasTitles ? 'Regenerate Titles' : 'Generate Titles'}
            </>
          )}
        </button>
      </div>

      {hasTitles && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-widest text-white/40 uppercase">
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
