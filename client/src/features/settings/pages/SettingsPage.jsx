import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Link2, Bell, Shield } from 'lucide-react'
import { cn } from '@/utils/cn'
import ProfileSettings from '../components/ProfileSettings'
import ConnectedAccounts from '../components/ConnectedAccounts'
import SecuritySettings from '../components/SecuritySettings'
import NotificationSettings from '../components/NotificationSettings'
import PageTitle from '@/components/common/PageTitle'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User, component: ProfileSettings },
  { id: 'accounts', label: 'Connected Accounts', icon: Link2, component: ConnectedAccounts },
  { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationSettings },
  { id: 'security', label: 'Security', icon: Shield, component: SecuritySettings },
]

export default function SettingsPage({ tab: defaultTab }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const getActiveTab = () => {
    if (defaultTab) return defaultTab
    return searchParams.get('tab') || 'profile'
  }

  const [activeTab, setActiveTab] = useState(getActiveTab)

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const ActiveComponent =
    TABS.find((t) => t.id === activeTab)?.component || ProfileSettings

  return (
    <div className="p-5 lg:p-7 max-w-[1200px] mx-auto">
      <PageTitle title="Settings" />

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[26px] font-extrabold text-[#212121] tracking-tight">
            Settings
          </h1>
          <p className="text-[#878787] text-sm mt-1">
            Manage your account and preferences.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[220px] xl:w-[240px] flex-shrink-0">
            <nav
              className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar"
              aria-label="Settings sections"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-left',
                      'transition-all duration-150 flex-shrink-0',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      isActive
                        ? 'bg-[#2874F0] text-white shadow-md shadow-primary/25'
                        : 'text-[#878787] hover:text-[#212121] hover:bg-[#F8F9FA]'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <tab.icon
                      className="w-4 h-4 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="flex-1 min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl border border-[#E0E0E0]"
            >
              <ActiveComponent />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}