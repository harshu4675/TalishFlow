import { Upload, Link2, Youtube, Instagram, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/utils/constants'

const ACTIONS = [
  {
    action: 'upload',
    label: 'Upload Video',
    description: 'MP4, MOV or MKV up to 5GB',
    icon: Upload,
  },
  {
    action: 'youtube-url',
    label: 'YouTube URL',
    description: 'Import any video or Shorts',
    icon: Link2,
  },
  {
    action: 'connect-youtube',
    label: 'Connect YouTube',
    description: 'Publish to your channel',
    icon: Youtube,
  },
  {
    action: 'connect-instagram',
    label: 'Connect Instagram',
    description: 'Post Reels automatically',
    icon: Instagram,
  },
]

export default function QuickActions() {
  const navigate = useNavigate()

  const handleAction = (action) => {
    if (action === 'connect-youtube' || action === 'connect-instagram') {
      navigate(ROUTES.SETTINGS_ACCOUNTS)
      return
    }
    window.dispatchEvent(
      new CustomEvent('talishflow:open-upload', { detail: { tab: action } })
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {ACTIONS.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.action}
            type="button"
            onClick={() => handleAction(item.action)}
            className="group border-border bg-surface shadow-card hover:border-primary/30 hover:shadow-float focus-visible:ring-primary/40 relative flex items-center gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="bg-primary-light text-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-foreground block truncate text-sm font-bold">
                {item.label}
              </span>
              <span className="text-foreground-muted block truncate text-xs">
                {item.description}
              </span>
            </span>
            <ArrowUpRight
              className="text-foreground-faint group-hover:text-primary absolute top-3 right-3 h-4 w-4 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
              aria-hidden="true"
            />
          </button>
        )
      })}
    </div>
  )
}
