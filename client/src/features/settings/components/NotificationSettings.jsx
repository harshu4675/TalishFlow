import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, BellRing } from 'lucide-react'
import { settingsService } from '@/services/settingsService'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNotificationContext } from '@/contexts/NotificationContext'
import Switch from '@/components/ui/switch'

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
    mutationFn: (prefs) =>
      settingsService.updateProfile({ preferences: { notifications: prefs } }),
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
      <div className="border-border-subtle border-b px-6 py-5">
        <h2 className="text-foreground text-[15px] font-bold">Notifications</h2>
        <p className="text-foreground-muted mt-0.5 text-xs">
          Choose what you want to be notified about.
        </p>
      </div>

      <div className="flex flex-col gap-3 px-6 py-6">
        {NOTIFICATION_OPTIONS.map((option) => (
          <div
            key={option.key}
            className="border-border-subtle bg-surface-muted/60 flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5"
          >
            <div className="min-w-0">
              <p className="text-foreground text-sm font-semibold">{option.label}</p>
              <p className="text-foreground-muted mt-0.5 text-xs">{option.description}</p>
            </div>
            <Switch
              checked={preferences[option.key] ?? true}
              onCheckedChange={(value) => handleToggle(option.key, value)}
              disabled={saveMutation.isPending}
              aria-label={`Toggle ${option.label}`}
            />
          </div>
        ))}

        {saveMutation.isPending && (
          <div
            className="text-foreground-muted flex items-center gap-2 text-xs font-semibold"
            role="status"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Saving...
          </div>
        )}

        {!saveMutation.isPending && (
          <div className="text-foreground-faint mt-1 flex items-center gap-2 text-xs">
            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
            Changes are saved automatically.
          </div>
        )}
      </div>
    </div>
  )
}
