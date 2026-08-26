import { memo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Zap,
  Upload,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  X,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { ROUTES } from '@/utils/constants'
import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/formatters'
import { Logo } from '@/components/brand/Logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import useLocalStorage from '@/hooks/useLocalStorage'

const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [{ label: 'Dashboard', icon: LayoutDashboard, to: ROUTES.DASHBOARD }],
  },
  {
    label: 'Distribute',
    items: [{ label: 'Publishing', icon: Radio, to: ROUTES.PUBLISHING }],
  },
  {
    label: 'Insights',
    items: [{ label: 'Analytics', icon: BarChart3, to: ROUTES.ANALYTICS }],
  },
  {
    label: 'Manage',
    items: [{ label: 'Settings', icon: Settings, to: ROUTES.SETTINGS }],
  },
]

const NavItem = memo(function NavItem({ item, collapsed }) {
  const location = useLocation()
  const isActive =
    location.pathname === item.to ||
    (item.to !== ROUTES.DASHBOARD && location.pathname.startsWith(item.to))

  const link = (
    <NavLink
      to={item.to}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl text-sm font-semibold transition-all duration-200',
        collapsed ? 'h-10 w-10 justify-center' : 'px-3 py-2.5',
        isActive
          ? 'bg-primary shadow-primary/25 text-white shadow-sm'
          : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <item.icon
        className={cn(
          'h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200',
          isActive ? 'text-white' : 'text-foreground-muted group-hover:text-primary'
        )}
        aria-hidden="true"
      />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && isActive && (
        <motion.span
          layoutId="sidebar-active-dot"
          className="h-1.5 w-1.5 rounded-full bg-white/70"
        />
      )}
    </NavLink>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
})

NavItem.displayName = 'NavItem'

export default function Sidebar({ onClose, collapsed = false, onCollapsedChange }) {
  const { user } = useAuthContext()
  const [localCollapsed, setLocalCollapsed] = useLocalStorage(
    'talishflow_sidebar_collapsed',
    false
  )
  const isCollapsed = onCollapsedChange ? collapsed : localCollapsed
  const setCollapsed = onCollapsedChange || setLocalCollapsed

  const openUpload = () => {
    window.dispatchEvent(new CustomEvent('talishflow:open-upload'))
  }

  const uploadButton = (
    <button
      onClick={openUpload}
      className={cn(
        'group bg-primary shadow-primary/25 hover:bg-primary-hover hover:shadow-primary/30 relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl text-white shadow-sm transition-all duration-200 hover:shadow-md',
        isCollapsed ? 'h-10 w-10 justify-center' : 'px-3.5 py-2.5'
      )}
    >
      <Upload className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      {!isCollapsed && <span className="text-sm font-bold">Upload Video</span>}
    </button>
  )

  return (
    <aside
      className={cn(
        'border-border bg-surface flex h-full flex-col border-r transition-[width] duration-200',
        isCollapsed ? 'w-[72px]' : 'w-[248px]'
      )}
    >
      <div
        className={cn(
          'border-border-subtle flex flex-shrink-0 items-center border-b',
          isCollapsed ? 'justify-center py-4' : 'justify-between px-4 py-4'
        )}
      >
        <NavLink
          to={ROUTES.DASHBOARD}
          className="group flex items-center gap-2.5"
          aria-label="TalishFlow dashboard"
        >
          <Logo className="h-9 w-9 transition-transform duration-200 group-hover:scale-105" />
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="text-foreground block truncate text-[15px] leading-tight font-extrabold tracking-tight">
                TalishFlow
              </span>
              <span className="text-foreground-faint block text-[10px] font-medium">
                Creator Studio
              </span>
            </div>
          )}
        </NavLink>

        {!isCollapsed && (
          <div className="flex items-center gap-1">
            {onClose && (
              <button
                onClick={onClose}
                className="text-foreground-muted hover:bg-surface-muted hover:text-foreground rounded-lg p-1.5 transition-colors lg:hidden"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            <button
              onClick={() => setCollapsed(true)}
              className="text-foreground-faint hover:bg-surface-muted hover:text-foreground hidden rounded-lg p-1.5 transition-colors lg:block"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {isCollapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="text-foreground-faint hover:bg-surface-muted hover:text-foreground mx-auto mb-2 hidden h-7 w-7 items-center justify-center rounded-lg transition-colors lg:flex"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      <div className={cn('flex-shrink-0 px-3 pt-4', isCollapsed && 'px-2')}>
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{uploadButton}</TooltipTrigger>
            <TooltipContent side="right">Upload Video</TooltipContent>
          </Tooltip>
        ) : (
          uploadButton
        )}
      </div>

      <nav
        className={cn(
          'no-scrollbar flex-1 overflow-y-auto py-5',
          isCollapsed ? 'px-2' : 'px-3'
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col gap-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!isCollapsed && (
                <p className="text-foreground-faint px-3 pb-2 text-[10px] font-bold tracking-[0.12em] uppercase">
                  {section.label}
                </p>
              )}
              {isCollapsed && <div className="bg-border-subtle mx-auto mb-2 h-px w-8" />}
              <div className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <NavItem key={item.to} item={item} collapsed={isCollapsed} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-border-subtle flex-shrink-0 border-t p-3">
        <NavLink
          to={ROUTES.SETTINGS_PROFILE}
          className={cn(
            'group hover:bg-surface-muted flex items-center rounded-xl transition-all duration-200',
            isCollapsed ? 'justify-center p-1.5' : 'gap-3 px-2.5 py-2'
          )}
        >
          <Avatar className="ring-border-subtle h-9 w-9 ring-2">
            {user?.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name || 'User'} />
            ) : (
              <AvatarFallback>{getInitials(user?.name || 'User')}</AvatarFallback>
            )}
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm leading-tight font-bold">
                  {user?.name || 'User'}
                </p>
                <p className="text-foreground-faint truncate text-[11px] leading-tight">
                  Creator
                </p>
              </div>
              <ChevronRight className="text-foreground-faint h-3.5 w-3.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
