import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Youtube, Instagram, Link2, Unlink, Info } from 'lucide-react'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/context/NotificationContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import authService from '@/features/auth/services/authService'

async function fetchConnectedAccounts() {
  const response = await apiClient.get('/settings/connected-accounts')
  return response.data.data.accounts
}

const PLATFORMS = [
  {
    id: 'youtube',
    label: 'YouTube',
    description: 'Upload Shorts and long-form videos directly to your channel.',
    icon: Youtube,
    connect: () => authService.initiateGoogleOAuth(),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Publish Reels to your professional Instagram account via the Meta API.',
    icon: Instagram,
    connect: () => authService.initiateInstagramOAuth(),
  },
]

function AccountCard({ platform, tokenData, onDisconnect, isDisconnecting }) {
  const isConnected = !!tokenData
  const Icon = platform.icon

  return (
    <div className="border-border bg-surface-muted/60 hover:border-primary/25 flex flex-col gap-4 rounded-2xl border p-5 transition-colors duration-200 sm:flex-row sm:items-start sm:gap-4">
      <div className="bg-surface ring-border flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ring-1">
        <Icon className="text-foreground-muted h-5 w-5" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-foreground text-sm font-bold">{platform.label}</p>
          {isConnected && (
            <Badge variant="success">
              <span className="bg-success h-1.5 w-1.5 rounded-full" aria-hidden="true" />
              Connected
            </Badge>
          )}
        </div>

        {isConnected && tokenData.platformUsername && (
          <p className="text-foreground mt-0.5 text-xs font-semibold">
            @{tokenData.platformUsername}
          </p>
        )}

        <p className="text-foreground-muted mt-1.5 text-xs leading-relaxed">
          {platform.description}
        </p>
      </div>

      <div className="flex-shrink-0 sm:pt-1">
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            loading={isDisconnecting}
            onClick={() => onDisconnect(platform.id)}
            className="text-error hover:bg-error-light hover:text-error"
          >
            {!isDisconnecting && <Unlink className="h-3.5 w-3.5" aria-hidden="true" />}
            Disconnect
          </Button>
        ) : (
          <Button size="sm" onClick={platform.connect}>
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            Connect
          </Button>
        )}
      </div>
    </div>
  )
}

function AccountCardSkeleton() {
  return (
    <div className="border-border bg-surface-muted/60 flex items-start gap-4 rounded-2xl border p-5">
      <div className="skeleton h-11 w-11 flex-shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-4 w-24 rounded-lg" />
        <div className="skeleton h-3 w-48 rounded-lg" />
        <div className="skeleton h-3 w-36 rounded-lg" />
      </div>
      <div className="skeleton h-8 w-24 rounded-xl" />
    </div>
  )
}

export default function ConnectedAccounts() {
  const queryClient = useQueryClient()
  const { success, error } = useNotificationContext()

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['settings', 'connected-accounts'],
    queryFn: fetchConnectedAccounts,
  })

  const disconnectMutation = useMutation({
    mutationFn: (platform) =>
      apiClient.delete(`/settings/connected-accounts/${platform}`),
    onSuccess: (_, platform) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'connected-accounts'] })
      success('Account disconnected', `Your ${platform} account has been disconnected.`)
    },
    onError: (err) => {
      error('Disconnection failed', err.userMessage || 'Failed to disconnect account.')
    },
  })

  return (
    <div>
      <div className="border-border-subtle border-b px-6 py-5">
        <h2 className="text-foreground text-[15px] font-bold">Connected Accounts</h2>
        <p className="text-foreground-muted mt-0.5 text-xs">
          Connect your social platforms to publish directly from TalishFlow.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-6 py-6">
        {isLoading
          ? PLATFORMS.map((p) => <AccountCardSkeleton key={p.id} />)
          : PLATFORMS.map((platform) => (
              <AccountCard
                key={platform.id}
                platform={platform}
                tokenData={accounts?.[platform.id]}
                onDisconnect={(id) => disconnectMutation.mutate(id)}
                isDisconnecting={
                  disconnectMutation.isPending &&
                  disconnectMutation.variables === platform.id
                }
              />
            ))}

        <div
          className={cn(
            'border-border-subtle bg-surface-muted/40 flex items-start gap-2.5 rounded-xl border px-4 py-3'
          )}
        >
          <Info
            className="text-foreground-faint h-4 w-4 flex-shrink-0"
            aria-hidden="true"
          />
          <p className="text-foreground-muted text-xs leading-relaxed">
            Instagram publishing requires a Professional or Creator account and uses the
            official Meta Graph API. Only publicly supported features are available.
          </p>
        </div>
      </div>
    </div>
  )
}
