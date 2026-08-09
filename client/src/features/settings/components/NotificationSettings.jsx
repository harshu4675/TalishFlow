import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { apiClient } from '@/services/api'
import { useAuthContext } from '@/context/AuthContext'
import { useNotificationContext } from '@/context/NotificationContext'
import { cn } from '@/utils/cn'

const NOTIFICATION_OPTIONS = [
  {
    key: 'processing',
    label: 'Processing Updates',
    description: 'Get notified when your videos finish processing.',
  },
  {
    key: 'publishing',
    label: 'Publishing Updates',
    description: 'Get notified when your content is published.',
  },
  {
    key: 'email',
    label: 'Email Notifications',
    description: 'Receive important updates via email.',
  },
  {
    key: 'marketing',
    label: 'Product Updates',
    description: 'Tips, new features, and product announcements.',
  },
]

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        enabled ? 'bg-[#2874F0]' : 'bg-border'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}

export default function NotificationSettings() {
  const { user, updateUser } = useAuthContext()
  const { success, error } = useNotificationContext()
  const [preferences, setPreferences] = useState(
    user?.preferences?.notifications || {
      processing: true,
      publishing: true,
      email: true,
      marketing: false,
    }
  )

  const saveMutation = useMutation({
    mutationFn: async (prefs) => {
      const response = await apiClient.patch('/settings/profile', {
        preferences: { notifications: prefs },
      })
      return response.data.data.user
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      success('Preferences saved', 'Your notification settings have been updated.')
    },
    onError: (err) => {
      error('Save failed', err.userMessage || 'Could not save notification settings.')
    },
  })

  const handleToggle = (key, value) => {
    const updated = { ...preferences, [key]: value }
    setPreferences(updated)
    saveMutation.mutate(updated)
  }

  return (
    <div>
      <div className="px-6 py-5 border-b border-[#E0E0E0]">
        <h2 className="text-[15px] font-bold text-[#212121]">Notifications</h2>
        <p className="text-xs text-[#878787] mt-0.5">
          Choose what you want to be notified about.
        </p>
      </div>

      <div className="px-6 py-6 flex flex-col gap-4">
        {NOTIFICATION_OPTIONS.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#F8F9FA] border border-[#E0E0E0]"
          >
            <div>
              <p className="text-sm font-semibold text-[#212121]">{option.label}</p>
              <p className="text-xs text-[#878787] mt-0.5">{option.description}</p>
            </div>

            <Toggle
              enabled={preferences[option.key] ?? true}
              onChange={(value) => handleToggle(option.key, value)}
            />
          </div>
        ))}

        {saveMutation.isPending && (
          <div className="flex items-center gap-2 text-xs text-[#878787]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Saving...
          </div>
        )}
      </div>
    </div>
  )
}