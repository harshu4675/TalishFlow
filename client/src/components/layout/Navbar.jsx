import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Bell,
  Sun,
  Moon,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Zap,
  Search,
} from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import { useThemeContext } from '@/context/ThemeContext'
import { cn } from '@/utils/cn'
import { getInitials, truncate } from '@/utils/formatters'
import { ROUTES } from '@/utils/constants'
import useClickOutside from '@/hooks/useClickOutside'

const PAGE_TITLES = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.ANALYTICS]: 'Analytics',
  [ROUTES.PUBLISHING]: 'Publishing',
  [ROUTES.SETTINGS]: 'Settings',
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(() => setOpen(false))

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-xl py-1.5 pr-3 pl-2',
          'transition-all duration-200 hover:bg-[#F8F9FA]',
          open && 'bg-[#F8F9FA]'
        )}
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-[#E0E0E0]"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2874F0] to-[#1B5FCC] text-xs font-bold text-white ring-2 ring-white">
            {getInitials(user?.name || 'User')}
          </div>
        )}
        <div className="hidden flex-col items-start sm:flex">
          <span className="text-xs leading-tight font-bold text-[#212121]">
            {truncate(user?.name?.split(' ')[0] || 'User', 12)}
          </span>
          <span className="text-[10px] leading-tight text-[#878787]">Creator</span>
        </div>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-[#878787] transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="z-dropdown absolute top-full right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-[#E0E0E0] bg-white shadow-2xl shadow-[#2874F0]/10"
          >
            <div className="border-b border-[#F0F0F0] bg-gradient-to-r from-[#E7F1FE] to-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2874F0] to-[#1B5FCC] text-sm font-bold text-white">
                  {getInitials(user?.name || 'User')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#212121]">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-[#878787]">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="p-1.5">
              <Link
                to={ROUTES.SETTINGS_PROFILE}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#212121] transition-all hover:bg-[#F8F9FA]"
              >
                <User className="h-4 w-4 text-[#2874F0]" />
                My Profile
              </Link>

              <Link
                to={ROUTES.SETTINGS}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#212121] transition-all hover:bg-[#F8F9FA]"
              >
                <Settings className="h-4 w-4 text-[#878787]" />
                Settings
              </Link>
            </div>

            <div className="border-t border-[#F0F0F0] p-1.5">
              <button
                onClick={() => {
                  setOpen(false)
                  onLogout()
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#FF6161] transition-all hover:bg-[#FFEBEE]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuthContext()
  const { isDark, toggleTheme } = useThemeContext()
  const location = useLocation()

  const pageTitle = PAGE_TITLES[location.pathname] || 'TalishFlow'

  return (
    <header className="z-sticky sticky top-0 flex-shrink-0 border-b border-[#F0F0F0] bg-white/85 backdrop-blur-xl">
      <div className="flex h-[64px] items-center justify-between gap-4 px-5 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-xl p-2 text-[#878787] transition-all hover:bg-[#F8F9FA] hover:text-[#212121] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2874F0] to-[#1B5FCC]">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-[#2874F0] to-[#FB641B]" />
            <div>
              <h1 className="text-[15px] leading-none font-extrabold text-[#212121]">
                {pageTitle}
              </h1>
              <p className="mt-0.5 text-[10px] font-medium text-[#878787]">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="ml-6 hidden max-w-md flex-1 items-center gap-2 xl:flex">
            <div className="relative w-full">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#B0B0B0]" />
              <input
                type="text"
                placeholder="Search videos, clips..."
                className="w-full rounded-xl border border-transparent bg-[#F8F9FA] py-2 pr-4 pl-10 text-sm text-[#212121] transition-all outline-none placeholder:text-[#B0B0B0] hover:border-[#E0E0E0] focus:border-[#2874F0] focus:bg-white focus:ring-4 focus:ring-[#2874F0]/10"
              />
              <kbd className="absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-[#E0E0E0] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#878787] sm:inline-block">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="rounded-xl p-2 text-[#878787] transition-all hover:bg-[#F8F9FA] hover:text-[#212121]"
          >
            {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          <button className="relative rounded-xl p-2 text-[#878787] transition-all hover:bg-[#F8F9FA] hover:text-[#212121]">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 animate-pulse rounded-full bg-[#FB641B] ring-2 ring-white" />
          </button>

          <div className="mx-1 h-6 w-px bg-[#E0E0E0]" />

          <UserMenu user={user} onLogout={logout} />
        </div>
      </div>
    </header>
  )
}
