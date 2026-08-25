import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  Youtube,
  Instagram,
  Link2,
  Unlink,
  Info,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { settingsService } from '@/services/settingsService'
import authService from '@/services/authService'
import { useNotificationContext } from '@/contexts/NotificationContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/utils/cn'
import { formatRelativeTime } from '@/utils/formatters'

const fetchConnectedAccounts = () => settingsService.getConnectedAccounts()
const fetchIntegrations = () => settingsService.getIntegrations()

const OAUTH_RESULT_COPY = {
  youtube: {
    connected: ['YouTube connected', 'Your YouTube channel is now linked to TalishFlow.'],
  },
  instagram: {
    connected: [
      'Instagram connected',
      'Your Instagram Professional account is now linked to TalishFlow.',
    ],
  },
}

const OAUTH_ERROR_COPY = {
  instagram_cancelled: [
    'Connection cancelled',
    'You cancelled the Meta authorization. No changes were made.',
  ],
  instagram_denied: [
    'Authorization declined',
    'Meta declined the request. Make sure your Meta app allows this account.',
  ],
  instagram_invalid_state: [
    'Session expired',
    'The authorization session expired. Please try connecting again.',
  ],
  INSTAGRAM_NO_FACEBOOK_PAGE: [
    'Facebook Page required',
    'Instagram publishing works through a Facebook Page. Create one, link your Instagram Professional account to it, then try again.',
  ],
  INSTAGRAM_NOT_PROFESSIONAL: [
    'Professional account required',
    'Your Instagram account must be a Business or Creator account linked to a Facebook Page. Convert it in the Instagram app, then reconnect.',
  ],
  OAUTH_NOT_CONFIGURED: [
    'Integration not configured',
    'This integration is not configured on the server. Contact the administrator.',
  ],
  oauth_cancelled: [
    'Connection cancelled',
    'You cancelled the Google authorization. No changes were made.',
  ],
}

const PLATFORMS = [
  {
    id: 'youtube',
    label: 'YouTube',
    description: 'Upload Shorts and long-form videos directly to your channel.',
    icon: Youtube,
    iconClass: 'text-[#ff0000]',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Publish Reels to your professional Instagram account via the Meta API.',
    icon: Instagram,
    iconClass: 'text-[#e1306c]',
  },
]

function StatusBadge({ status }) {
  if (status === 'connected') {
    return (
      <Badge variant="success">
        <span className="bg-success h-1.5 w-1.5 rounded-full" aria-hidden="true" />
        Connected
      </Badge>
    )
  }
  if (status === 'expired') {
    return (
      <Badge variant="warning">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        Session expired
      </Badge>
    )
  }
  if (status === 'invalid') {
    return (
      <Badge variant="error">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        Needs reconnect
      </Badge>
    )
  }
  return <Badge variant="neutral">Not connected</Badge>
}

function AccountCard({ platform, account, configured, onConnect, onDisconnect, isConnecting }) {
  const Icon = platform.icon
  const isConnected = Boolean(account) && account.status === 'connected'
  const needsAttention = Boolean(account) && account.status !== 'connected'

  return (
    <div className="border-border bg-surface-muted/60 hover:border-primary/25 flex flex-col gap-4 rounded-2xl border p-5 transition-colors duration-200 sm:flex-row sm:items-start sm:gap-4">
      <div className="bg-surface ring-border relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm ring-1">
        {account?.avatar ? (
          <Avatar className="h-11 w-11 rounded-xl">
            <AvatarImage src={account.avatar} alt={account.displayName || platform.label} />
            <AvatarFallback>
              <Icon className={cn('h-5 w-5', platform.iconClass)} aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <Icon className={cn('h-5 w-5', platform.iconClass)} aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-foreground text-sm font-bold">{platform.label}</p>
          <StatusBadge status={account?.status} />
        </div>

        {account && (
          <div className="mt-1">
            {account.displayName && (
              <p className="text-foreground text-xs font-semibold">{account.displayName}</p>
            )}
            {account.username && (
              <p className="text-foreground-muted text-xs">
                {platform.id === 'youtube' ? account.username : `@${account.username}`}
                {account.accountType ? ` · ${account.accountType} account` : ''}
              </p>
            )}
            {account.connectedAt && (
              <p className="text-foreground-faint mt-0.5 text-[11px]">
                Connected {formatRelativeTime(account.connectedAt)}
              </p>
            )}
          </div>
        )}

        <p className="text-foreground-muted mt-1.5 text-xs leading-relaxed">
          {platform.description}
        </p>

        {!configured && (
          <p className="text-warning mt-2 flex items-start gap-1.5 text-xs">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            This integration is not configured on the server yet.
          </p>
        )}

        {account?.profileUrl && isConnected && (
          <a
            href={account.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            View profile
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>

      <div className="flex flex-shrink-0 gap-2 sm:pt-1">
        {isConnected || needsAttention ? (
          <>
            {needsAttention && (
              <Button
                size="sm"
                onClick={() => onConnect(platform.id)}
                loading={isConnecting}
                disabled={!configured}
              >
                {!isConnecting && <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
                Reconnect
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDisconnect(platform.id)}
              className="text-error hover:bg-error-light hover:text-error"
            >
              <Unlink className="h-3.5 w-3.5" aria-hidden="true" />
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={() => onConnect(platform.id)}
            loading={isConnecting}
            disabled={!configured}
          >
            {!isConnecting && <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { success, error: toastError, info } = useNotificationContext()

  const [connectingPlatform, setConnectingPlatform] = useState(null)
  const [confirmDisconnect, setConfirmDisconnect] = useState(null)

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['settings', 'connected-accounts'],
    queryFn: fetchConnectedAccounts,
  })

  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['settings', 'integrations'],
    queryFn: fetchIntegrations,
  })

  const isLoading = accountsLoading || integrationsLoading

  // Handle redirects back from OAuth (connected=… / error=…&details=…).
  useEffect(() => {
    const connected = searchParams.get('connected')
    const errorCode = searchParams.get('error')
    const details = searchParams.get('details')

    if (!connected && !errorCode) return

    if (connected) {
      const [title, body] = OAUTH_RESULT_COPY[connected]?.connected || [
        'Account connected',
        'Your account is now linked to TalishFlow.',
      ]
      success(title, body)
      queryClient.invalidateQueries({ queryKey: ['settings', 'connected-accounts'] })
    } else {
      const [title, body] = OAUTH_ERROR_COPY[errorCode] || [
        'Connection failed',
        'The connection could not be completed. Please try again.',
      ]
      toastError(title, details || body)
    }

    // Strip the params so a refresh doesn't re-fire the toast.
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams, queryClient, success, toastError])

  const handleConnect = async (platform) => {
    setConnectingPlatform(platform)
    info(
      'Redirecting…',
      `You'll be sent to ${platform === 'youtube' ? 'Google' : 'Meta'} to authorize TalishFlow.`
    )

    try {
      await authService.connectPlatform(platform)
      // Browser navigates away — no further code runs.
    } catch (err) {
      setConnectingPlatform(null)
      toastError(
        'Could not start connection',
        err.userMessage || err.message || 'Please try again.'
      )
    }
  }

  const disconnectMutation = useMutation({
    mutationFn: (platform) => settingsService.disconnectAccount(platform),
    onSuccess: (_, platform) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'connected-accounts'] })
      const label = PLATFORMS.find((p) => p.id === platform)?.label || platform
      success('Account disconnected', `Your ${label} account has been disconnected.`)
    },
    onError: (err) => {
      toastError('Disconnection failed', err.userMessage || 'Please try again.')
    },
    onSettled: () => setConfirmDisconnect(null),
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
                account={accounts?.[platform.id]}
                configured={integrations?.[platform.id]?.configured !== false}
                onConnect={handleConnect}
                onDisconnect={setConfirmDisconnect}
                isConnecting={connectingPlatform === platform.id}
              />
            ))}

        <div className="border-border-subtle bg-surface-muted/40 flex items-start gap-2.5 rounded-xl border px-4 py-3">
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

      {/* Disconnect confirmation */}
      <Dialog
        open={Boolean(confirmDisconnect)}
        onOpenChange={(open) => !open && setConfirmDisconnect(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Disconnect {PLATFORMS.find((p) => p.id === confirmDisconnect)?.label}?
            </DialogTitle>
            <DialogDescription>
              TalishFlow will revoke the authorization and delete the stored tokens.
              Scheduled publications to this account will fail until you reconnect.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDisconnect(null)}>
              Keep connected
            </Button>
            <Button
              variant="destructive"
              loading={disconnectMutation.isPending}
              onClick={() => disconnectMutation.mutate(confirmDisconnect)}
            >
              {!disconnectMutation.isPending && (
                <Unlink className="h-4 w-4" aria-hidden="true" />
              )}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
