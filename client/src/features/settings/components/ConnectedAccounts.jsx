import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Youtube, Instagram, CheckCircle2, Link2, Unlink, Loader2 } from 'lucide-react'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/context/NotificationContext'
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
    color: 'text-[#EF4444]',
    bg: 'bg-[#EF4444]/10',
    connect: () => authService.initiateGoogleOAuth(),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Publish Reels to your professional Instagram account via the Meta API.',
    icon: Instagram,
    color: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10',
    connect: () => authService.initiateInstagramOAuth(),
  },
]

function AccountCard({ platform, tokenData, onDisconnect, isDisconnecting }) {
  const isConnected = !!tokenData
  const Icon = platform.icon

  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA]">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', platform.bg)}>
        <Icon className={cn('w-5 h-5', platform.color)} aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-[#212121]">{platform.label}</p>
          {isConnected && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
              Connected
            </span>
          )}
        </div>

        {isConnected && tokenData.platformUsername && (
          <p className="text-xs text-[#878787] mt-0.5">
            {tokenData.platformUsername}
          </p>
        )}

        <p className="text-xs text-[#878787] mt-1.5 leading-relaxed">
          {platform.description}
        </p>
      </div>

      <div className="flex-shrink-0">
        {isConnected ? (
          <button
            onClick={() => onDisconnect(platform.id)}
            disabled={isDisconnecting}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl',
              'text-xs font-semibold text-[#EF4444] border border-[#FF6161]/20',
              'hover:bg-[#EF4444]/10 transition-all duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30'
            )}
          >
            {isDisconnecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Unlink className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            Disconnect
          </button>
        ) : (
          <button
            onClick={platform.connect}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl',
              'text-xs font-semibold bg-[#2874F0] text-white',
              'hover:bg-[#1B5FCC] transition-all duration-150',
              'shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
            )}
          >
            <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
            Connect
          </button>
        )}
      </div>
    </div>
  )
}

function AccountCardSkeleton() {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA]">
      <div className="w-10 h-10 rounded-xl skeleton flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-24 skeleton rounded-lg" />
        <div className="h-3 w-48 skeleton rounded-lg" />
        <div className="h-3 w-36 skeleton rounded-lg" />
      </div>
      <div className="h-8 w-20 skeleton rounded-xl" />
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
    mutationFn: (platform) => apiClient.delete(`/settings/connected-accounts/${platform}`),
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
      <div className="px-6 py-5 border-b border-[#E0E0E0]">
        <h2 className="text-[15px] font-bold text-[#212121]">Connected Accounts</h2>
        <p className="text-xs text-[#878787] mt-0.5">
          Connect your social platforms to publish directly from TalishFlow.
        </p>
      </div>

      <div className="px-6 py-6 flex flex-col gap-4">
        {isLoading ? (
          PLATFORMS.map((p) => <AccountCardSkeleton key={p.id} />)
        ) : (
          PLATFORMS.map((platform) => (
            <AccountCard
              key={platform.id}
              platform={platform}
              tokenData={accounts?.[platform.id]}
              onDisconnect={(id) => disconnectMutation.mutate(id)}
              isDisconnecting={
                disconnectMutation.isPending && disconnectMutation.variables === platform.id
              }
            />
          ))
        )}

        <div className="pt-4 border-t border-[#E0E0E0]">
          <p className="text-xs text-[#878787] leading-relaxed">
            Instagram publishing requires a Professional or Creator account and uses the official
            Meta Graph API. Only publicly supported features are available.
          </p>
        </div>
      </div>
    </div>
  )
}