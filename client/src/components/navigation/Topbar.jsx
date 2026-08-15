import { useEffect, useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Menu,
  Bell,
  Sun,
  Moon,
  LogOut,
  Settings,
  User,
  Search,
  Zap,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  Youtube,
  Instagram,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useThemeContext } from '@/contexts/ThemeContext'
import { cn } from '@/utils/cn'
import { getInitials, formatRelativeTime } from '@/utils/formatters'
import { ROUTES } from '@/utils/constants'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import CommandMenu from './CommandMenu'

const PAGE_TITLES = {
  [ROUTES.DASHBOARD]: { title: 'Dashboard', breadcrumb: null },
  [ROUTES.ANALYTICS]: { title: 'Analytics', breadcrumb: null },
  [ROUTES.PUBLISHING]: { title: 'Publishing', breadcrumb: null },
  [ROUTES.SETTINGS]: { title: 'Settings', breadcrumb: null },
  [ROUTES.SETTINGS_PROFILE]: { title: 'Profile', breadcrumb: 'Settings' },
  [ROUTES.SETTINGS_ACCOUNTS]: { title: 'Connected Accounts', breadcrumb: 'Settings' },
  [ROUTES.SETTINGS_NOTIFICATIONS]: { title: 'Notifications', breadcrumb: 'Settings' },
  [ROUTES.SETTINGS_SECURITY]: { title: 'Security', breadcrumb: 'Settings' },
}

const ACTIVE_PROCESSING = [
  'queued',
  'downloading',
  'analyzing',
  'detecting_scenes',
  'detecting_speech',
  'detecting_faces',
  'generating_clips',
  'transcribing',
  'converting',
]

function NotificationsMenu() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const items = useMemo(() => {
    if (!open) return []

    const jobs =
      queryClient
        .getQueriesData({ queryKey: ['publishing', 'jobs'] })
        .map(([, data]) => data?.jobs || [])
        .flat() || []
    const queue = queryClient.getQueryData(['dashboard', 'processing-queue'])?.jobs || []

    const processing = queue
      .filter((job) => ACTIVE_PROCESSING.includes(job.status))
      .slice(0, 3)
      .map((job) => ({
        id: `p-${job._id}`,
        title: job.videoTitle || 'Processing video',
        meta: `${job.status.replace(/_/g, ' ')}${job.progress ? ` · ${job.progress}%` : ''}`,
        icon: Loader2,
        tone: 'text-primary',
        spin: true,
      }))

    const failed = queue
      .filter((job) => job.status === 'failed')
      .slice(0, 2)
      .map((job) => ({
        id: `f-${job._id}`,
        title: job.videoTitle || 'Processing failed',
        meta: job.errorMessage || 'Something went wrong',
        icon: AlertCircle,
        tone: 'text-error',
      }))

    const published = jobs
      .filter((job) => job.status === 'published')
      .slice(0, 3)
      .map((job) => ({
        id: `pub-${job._id}`,
        title: job.title || 'Content published',
        meta: `${job.platform === 'youtube' ? 'YouTube' : 'Instagram'} · ${formatRelativeTime(job.updatedAt || job.createdAt)}`,
        icon: job.platform === 'youtube' ? Youtube : Instagram,
        tone: 'text-success',
      }))

    const scheduled = jobs
      .filter((job) => ['pending', 'queued'].includes(job.status))
      .slice(0, 2)
      .map((job) => ({
        id: `s-${job._id}`,
        title: job.title || 'Scheduled publication',
        meta: `${job.platform === 'youtube' ? 'YouTube' : 'Instagram'} · ${formatRelativeTime(job.scheduledAt || job.createdAt)}`,
        icon: Clock,
        tone: 'text-warning',
      }))

    return [...published, ...processing, ...scheduled, ...failed].slice(0, 8)
  }, [queryClient, open])

  const hasUnread = items.some((i) => i.spin || i.tone === 'text-error')

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              className="text-foreground-muted hover:bg-surface-muted hover:text-foreground focus-visible:ring-primary/40 relative rounded-xl p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
              {hasUnread && (
                <span className="bg-accent ring-surface absolute top-1.5 right-1.5 h-2 w-2 rounded-full ring-2" />
              )}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Notifications</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <div className="bg-surface-muted flex h-10 w-10 items-center justify-center rounded-xl">
              <Bell className="text-foreground-faint h-4 w-4" aria-hidden="true" />
            </div>
            <p className="text-foreground text-sm font-semibold">You're all caught up</p>
            <p className="text-foreground-muted text-xs">
              Activity from processing and publishing will appear here.
            </p>
          </div>
        ) : (
          <div className="flex max-h-[360px] flex-col overflow-y-auto">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <DropdownMenuItem key={item.id} className="items-start">
                  <span
                    className={cn(
                      'bg-surface-muted mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                      item.tone
                    )}
                  >
                    <Icon
                      className={cn('h-3.5 w-3.5', item.spin && 'animate-spin')}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="text-foreground block truncate text-xs font-bold">
                      {item.title}
                    </span>
                    <span className="text-foreground-faint block truncate text-[11px] capitalize">
                      {item.meta}
                    </span>
                  </span>
                </DropdownMenuItem>
              )
            })}
          </div>
        )}
        <DropdownMenuSeparator />
        <Link to={ROUTES.PUBLISHING}>
          <DropdownMenuItem className="text-primary justify-center text-xs font-bold">
            View publishing queue
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu({ user, onLogout }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="hover:bg-surface-muted focus-visible:ring-primary/40 flex items-center gap-2 rounded-xl py-1 pr-2 pl-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Open profile menu"
        >
          <Avatar className="ring-border-subtle h-8 w-8 ring-2">
            {user?.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name || 'User'} />
            ) : (
              <AvatarFallback>{getInitials(user?.name || 'User')}</AvatarFallback>
            )}
          </Avatar>
          <span className="hidden flex-col items-start sm:flex">
            <span className="text-foreground text-xs leading-tight font-bold">
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <span className="text-foreground-faint text-[10px] leading-tight">
              Creator
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="border-border-subtle border-b px-3 py-3">
          <p className="text-foreground truncate text-sm font-bold">{user?.name}</p>
          <p className="text-foreground-faint truncate text-xs">{user?.email}</p>
        </div>
        <div className="mt-1.5 flex flex-col gap-0.5">
          <Link to={ROUTES.SETTINGS_PROFILE}>
            <DropdownMenuItem>
              <User className="text-foreground-muted h-4 w-4" aria-hidden="true" />
              My profile
            </DropdownMenuItem>
          </Link>
          <Link to={ROUTES.SETTINGS}>
            <DropdownMenuItem>
              <Settings className="text-foreground-muted h-4 w-4" aria-hidden="true" />
              Settings
            </DropdownMenuItem>
          </Link>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-error focus:text-error"
          onSelect={() => onLogout()}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuthContext()
  const { isDark, toggleTheme } = useThemeContext()
  const location = useLocation()
  const [commandOpen, setCommandOpen] = useState(false)

  const page = PAGE_TITLES[location.pathname] || { title: 'TalishFlow', breadcrumb: null }

  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    []
  )

  return (
    <header className="z-sticky border-border bg-surface/85 sticky top-0 flex-shrink-0 border-b backdrop-blur-xl">
      <div className="flex h-[60px] items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="text-foreground-muted hover:bg-surface-muted hover:text-foreground rounded-xl p-2 transition-colors lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="gradient-primary shadow-primary/25 flex h-8 w-8 items-center justify-center rounded-lg shadow-sm">
              <Zap className="h-4 w-4 text-white" fill="white" aria-hidden="true" />
            </div>
          </div>

          <div className="hidden min-w-0 items-center gap-2.5 md:flex">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {page.breadcrumb && (
                  <>
                    <Link
                      to={ROUTES.SETTINGS}
                      className="text-foreground-faint hover:text-primary text-xs font-semibold transition-colors"
                    >
                      {page.breadcrumb}
                    </Link>
                    <ChevronRight
                      className="text-foreground-faint h-3 w-3"
                      aria-hidden="true"
                    />
                  </>
                )}
                <h1 className="text-foreground truncate text-[15px] leading-none font-extrabold">
                  {page.title}
                </h1>
              </div>
              <p className="text-foreground-faint mt-1 hidden text-[10px] font-medium sm:block">
                {today}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCommandOpen(true)}
            className="border-border bg-surface-muted text-foreground-faint hover:border-foreground-faint/50 hover:bg-surface focus-visible:ring-primary/30 ml-auto flex h-9 w-full max-w-[320px] items-center gap-2 rounded-xl border px-3 text-left text-xs font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:outline-none xl:max-w-md"
            aria-label="Open search"
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">Search videos, clips, pages...</span>
            <kbd className="border-border bg-surface text-foreground-faint hidden flex-shrink-0 items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-bold sm:flex">
              <span>Ctrl</span>
              <span>K</span>
            </kbd>
          </button>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="text-foreground-muted hover:bg-surface-muted hover:text-foreground focus-visible:ring-primary/40 rounded-xl p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
                ) : (
                  <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isDark ? 'Light mode' : 'Dark mode'}
            </TooltipContent>
          </Tooltip>

          <NotificationsMenu />

          <div className="bg-border mx-1 h-6 w-px" />

          <UserMenu user={user} onLogout={logout} />
        </div>
      </div>

      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  )
}
