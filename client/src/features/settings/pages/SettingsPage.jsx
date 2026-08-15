import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { User, Link2, Bell, Shield } from 'lucide-react'
import { cn } from '@/utils/cn'
import ProfileSettings from '../components/ProfileSettings'
import ConnectedAccounts from '../components/ConnectedAccounts'
import SecuritySettings from '../components/SecuritySettings'
import NotificationSettings from '../components/NotificationSettings'
import PageHeader from '@/components/common/PageHeader'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User, component: ProfileSettings },
  {
    id: 'accounts',
    label: 'Connected Accounts',
    icon: Link2,
    component: ConnectedAccounts,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    component: NotificationSettings,
  },
  { id: 'security', label: 'Security', icon: Shield, component: SecuritySettings },
]

export default function SettingsPage({ tab: defaultTab }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState(
    () => defaultTab || searchParams.get('tab') || 'profile'
  )

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId }, { replace: true })
  }

  const ActiveComponent =
    TABS.find((t) => t.id === activeTab)?.component || ProfileSettings

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-5 lg:p-7">
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Settings"
          description="Manage your account, connected platforms, and preferences."
        />

        <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
          <div className="lg:w-[220px] lg:flex-shrink-0">
            <nav
              className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:flex-col lg:overflow-visible"
              aria-label="Settings sections"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'flex flex-shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150',
                      'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
                      isActive
                        ? 'bg-primary shadow-primary/25 text-white shadow-sm'
                        : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="min-w-0 flex-1">
            <div
              key={activeTab}
              className="animate-fade-in border-border bg-surface shadow-card overflow-hidden rounded-2xl border"
            >
              <ActiveComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
