import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Zap,
  Upload,
  Radio,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import { ROUTES } from '@/utils/constants'
import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/formatters'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: ROUTES.DASHBOARD },
  { label: 'Publishing', icon: Radio, to: ROUTES.PUBLISHING },
  { label: 'Analytics', icon: BarChart3, to: ROUTES.ANALYTICS },
  { label: 'Settings', icon: Settings, to: ROUTES.SETTINGS },
]

function NavItem({ item }) {
  const location = useLocation()
  const isActive =
    location.pathname === item.to ||
    (item.to !== ROUTES.DASHBOARD && location.pathname.startsWith(item.to))

  return (
    <NavLink
      to={item.to}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold',
        'transition-all duration-200',
        isActive
          ? 'bg-gradient-to-r from-[#2874F0] to-[#1B5FCC] text-white shadow-lg shadow-[#2874F0]/25'
          : 'text-[#878787] hover:bg-[#F8F9FA] hover:text-[#212121]'
      )}
    >
      <item.icon
        className={cn(
          'h-4.5 w-4.5 flex-shrink-0 transition-transform group-hover:scale-110',
          isActive ? 'text-white' : 'text-[#878787] group-hover:text-[#2874F0]'
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="h-5 w-1 rounded-full bg-white/40"
        />
      )}
    </NavLink>
  )
}

export default function Sidebar({ onClose }) {
  const { user } = useAuthContext()

  return (
    <aside className="flex h-full flex-col border-r border-[#E0E0E0] bg-white">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-[#F0F0F0] px-5 py-5">
        <NavLink to={ROUTES.DASHBOARD} className="group flex items-center gap-2.5">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2874F0] to-[#1B5FCC] shadow-lg shadow-[#2874F0]/30 transition-transform group-hover:scale-110">
              <Zap className="h-4.5 w-4.5 text-white" fill="white" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-[#FB641B]" />
          </div>
          <div>
            <span className="block text-[16px] leading-none font-extrabold tracking-tight text-[#212121]">
              TalishFlow
            </span>
            <span className="text-[10px] font-medium text-[#878787]">Pro Dashboard</span>
          </div>
        </NavLink>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-[#878787] transition-colors hover:bg-[#F8F9FA] hover:text-[#212121] lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pt-4">
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#FB641B] to-[#E8560F] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FB641B]/25 transition-all hover:shadow-xl hover:shadow-[#FB641B]/40"
          onClick={() => window.dispatchEvent(new CustomEvent('talishflow:open-upload'))}
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          <Upload className="relative z-10 h-4 w-4" />
          <span className="relative z-10">Upload Video</span>
          <Sparkles className="relative z-10 ml-auto h-3.5 w-3.5" />
        </motion.button>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-5">
        <div className="flex flex-col gap-1">
          <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.1em] text-[#B0B0B0] uppercase">
            Main Menu
          </p>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </div>
      </nav>

      <div className="flex-shrink-0 border-t border-[#F0F0F0] px-3 py-4">
        <NavLink
          to={ROUTES.SETTINGS_PROFILE}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-[#F8F9FA]"
        >
          <div className="relative flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#2874F0] to-[#1B5FCC] text-xs font-bold text-white ring-2 shadow-md ring-white">
                {getInitials(user?.name || 'User')}
              </div>
            )}
            <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#388E3C]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm leading-tight font-bold text-[#212121]">
              {user?.name || 'User'}
            </p>
            <p className="truncate text-[11px] leading-tight text-[#878787]">
              {user?.email}
            </p>
          </div>

          <ChevronRight className="h-3.5 w-3.5 text-[#B0B0B0] transition-all group-hover:translate-x-0.5 group-hover:text-[#2874F0]" />
        </NavLink>
      </div>
    </aside>
  )
}
