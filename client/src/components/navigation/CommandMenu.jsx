import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Radio,
  BarChart3,
  Settings,
  Upload,
  Link2,
  Video,
  Scissors,
  Search,
  CornerDownLeft,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ROUTES } from '@/utils/constants'
import { queryKeys } from '@/utils/queryKeys'
import { cn } from '@/utils/cn'
import { formatRelativeTime } from '@/utils/formatters'

function openUpload(tab = 'upload') {
  window.dispatchEvent(new CustomEvent('talishflow:open-upload', { detail: { tab } }))
}

export default function CommandMenu({ open, onOpenChange }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef(null)

  const groups = useMemo(() => {
    const uploads =
      queryClient.getQueryData(queryKeys.dashboard.recentUploads)?.videos || []
    const clips = queryClient.getQueryData(queryKeys.dashboard.recentClips)?.clips || []
    const q = query.trim().toLowerCase()

    const nav = [
      {
        id: 'nav-dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        action: () => navigate(ROUTES.DASHBOARD),
      },
      {
        id: 'nav-publishing',
        label: 'Publishing',
        icon: Radio,
        action: () => navigate(ROUTES.PUBLISHING),
      },
      {
        id: 'nav-analytics',
        label: 'Analytics',
        icon: BarChart3,
        action: () => navigate(ROUTES.ANALYTICS),
      },
      {
        id: 'nav-settings',
        label: 'Settings',
        icon: Settings,
        action: () => navigate(ROUTES.SETTINGS),
      },
    ]

    const actions = [
      {
        id: 'act-upload',
        label: 'Upload video file',
        hint: 'MP4, MOV, MKV up to 5GB',
        icon: Upload,
        action: () => openUpload('upload'),
      },
      {
        id: 'act-youtube',
        label: 'Import from YouTube URL',
        hint: 'Paste a video or Shorts link',
        icon: Link2,
        action: () => openUpload('youtube-url'),
      },
    ]

    const recent = [
      ...uploads.slice(0, 3).map((v) => ({
        id: `video-${v._id}`,
        label: v.title || 'Untitled video',
        hint: formatRelativeTime(v.createdAt),
        icon: Video,
        action: () => navigate(`/editor/${v._id}`),
      })),
      ...clips.slice(0, 3).map((c) => ({
        id: `clip-${c._id}`,
        label: c.title || 'Untitled clip',
        hint: formatRelativeTime(c.createdAt),
        icon: Scissors,
        action: () => c.videoId && navigate(`/editor/${c.videoId}`),
      })),
    ]

    const filter = (items) =>
      q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items

    return [
      { label: 'Navigate', items: filter(nav) },
      { label: 'Actions', items: filter(actions) },
      ...(recent.length ? [{ label: 'Recent content', items: filter(recent) }] : []),
    ].filter((g) => g.items.length > 0)
  }, [query, navigate, queryClient])

  const flatItems = groups.flatMap((g) => g.items)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      flatItems[activeIndex]?.action()
      onOpenChange(false)
    }
  }

  let index = -1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[12vh] max-w-xl translate-y-0 overflow-hidden p-0"
        showCloseButton={false}
        aria-label="Command menu"
      >
        <div className="border-border-subtle flex items-center gap-3 border-b px-4">
          <Search
            className="text-foreground-faint h-4 w-4 flex-shrink-0"
            aria-hidden="true"
          />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, videos, clips..."
            className="text-foreground placeholder:text-foreground-faint h-12 w-full bg-transparent text-sm outline-none"
            aria-label="Search"
          />
          <kbd className="border-border bg-surface-muted text-foreground-faint rounded-md border px-1.5 py-0.5 text-[10px] font-bold">
            ESC
          </kbd>
        </div>

        <div className="no-scrollbar max-h-[min(420px,60dvh)] overflow-y-auto p-2">
          {flatItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <div className="bg-surface-muted flex h-10 w-10 items-center justify-center rounded-xl">
                <Search className="text-foreground-faint h-4 w-4" aria-hidden="true" />
              </div>
              <p className="text-foreground text-sm font-semibold">No results found</p>
              <p className="text-foreground-muted text-xs">
                Try a different search term.
              </p>
            </div>
          ) : (
            <div ref={listRef} role="listbox">
              {groups.map((group) => (
                <div key={group.label} className="mb-1">
                  <p className="text-foreground-faint px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] uppercase">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    index += 1
                    const current = index
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={activeIndex === current}
                        onClick={() => {
                          item.action()
                          onOpenChange(false)
                        }}
                        onMouseEnter={() => setActiveIndex(current)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                          activeIndex === current
                            ? 'bg-primary-light text-foreground'
                            : 'text-foreground-muted'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                            activeIndex === current
                              ? 'bg-primary text-white'
                              : 'bg-surface-muted text-foreground-muted'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-foreground block truncate font-semibold">
                            {item.label}
                          </span>
                          {item.hint && (
                            <span className="text-foreground-faint block truncate text-[11px]">
                              {item.hint}
                            </span>
                          )}
                        </span>
                        {activeIndex === current && (
                          <CornerDownLeft
                            className="text-foreground-faint h-3.5 w-3.5 flex-shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-border-subtle bg-surface-muted/60 flex items-center justify-between border-t px-4 py-2">
          <div className="text-foreground-faint flex items-center gap-1 text-[10px] font-semibold">
            <Zap className="h-3 w-3" aria-hidden="true" />
            TalishFlow command menu
          </div>
          <div className="text-foreground-faint flex items-center gap-3 text-[10px] font-semibold">
            <span className="flex items-center gap-1">
              <kbd className="border-border bg-surface rounded border px-1">↑</kbd>
              <kbd className="border-border bg-surface rounded border px-1">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="border-border bg-surface rounded border px-1">↵</kbd>
              select
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
