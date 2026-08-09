import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Youtube,
  Instagram,
  Send,
  Loader2,
  Calendar,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import publishingService from '@/services/publishingService'
import { useNotificationContext } from '@/context/NotificationContext'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/formatters'

const publishSchema = z.object({
  platform: z.enum(['youtube', 'instagram']),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(5000).optional(),
  hashtags: z.string().optional(),
  scheduledAt: z.string().optional(),
  youtubeVisibility: z.enum(['public', 'unlisted', 'private']).optional(),
  youtubeCategoryId: z.string().optional(),
  youtubePlaylistId: z.string().optional(),
  instagramShareToFeed: z.boolean().optional(),
})

function PlatformSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        {
          id: 'youtube',
          label: 'YouTube',
          icon: Youtube,
          color: 'text-[#EF4444]',
          bg: 'bg-[#EF4444]/10',
          border: 'border-[#FF6161]/30',
        },
        {
          id: 'instagram',
          label: 'Instagram',
          icon: Instagram,
          color: 'text-[#F59E0B]',
          bg: 'bg-[#F59E0B]/10',
          border: 'border-[#FF9F00]/30',
        },
      ].map((platform) => (
        <button
          key={platform.id}
          type="button"
          onClick={() => onChange(platform.id)}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
            value === platform.id
              ? `${platform.border} ${platform.bg}`
              : 'border-[#E0E0E0] bg-[#F8F9FA] hover:border-[#2874F0]/30'
          )}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              value === platform.id ? platform.bg : 'bg-white'
            )}
          >
            <platform.icon
              className={cn('w-4 h-4', value === platform.id ? platform.color : 'text-[#878787]')}
            />
          </div>
          <span
            className={cn(
              'text-sm font-semibold',
              value === platform.id ? 'text-[#212121]' : 'text-[#878787]'
            )}
          >
            {platform.label}
          </span>
        </button>
      ))}
    </div>
  )
}

function YouTubeOptions({ register, categories, playlists }) {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-[#EF4444]/5 border border-[#FF6161]/20">
      <p className="text-xs font-bold text-[#EF4444] uppercase tracking-wide">YouTube Options</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#878787]">Visibility</label>
          <div className="relative">
            <select
              {...register('youtubeVisibility')}
              className="w-full px-3 py-2.5 pr-8 rounded-xl text-sm bg-white border border-[#E0E0E0] text-[#212121] appearance-none focus:outline-none focus:ring-2 focus:ring-danger/30"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#878787] pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#878787]">Category</label>
          <div className="relative">
            <select
              {...register('youtubeCategoryId')}
              className="w-full px-3 py-2.5 pr-8 rounded-xl text-sm bg-white border border-[#E0E0E0] text-[#212121] appearance-none focus:outline-none focus:ring-2 focus:ring-danger/30"
            >
              <option value="">Select category</option>
              {(categories || []).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#878787] pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#878787]">Add to Playlist</label>
        <div className="relative">
          <select
            {...register('youtubePlaylistId')}
            className="w-full px-3 py-2.5 pr-8 rounded-xl text-sm bg-white border border-[#E0E0E0] text-[#212121] appearance-none focus:outline-none focus:ring-2 focus:ring-danger/30"
          >
            <option value="">No playlist</option>
            {(playlists || []).map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.title}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#878787] pointer-events-none" />
        </div>
      </div>

      <p className="text-[11px] text-[#878787] leading-relaxed">
        Videos shorter than 60 seconds in vertical format are automatically published as YouTube Shorts.
      </p>
    </div>
  )
}

function InstagramOptions({ register }) {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-[#F59E0B]/5 border border-[#FF9F00]/20">
      <p className="text-xs font-bold text-[#F59E0B] uppercase tracking-wide">Instagram Options</p>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#212121]">Share to Feed</p>
          <p className="text-xs text-[#878787] mt-0.5">
            Also show the Reel in your Instagram grid
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" {...register('instagramShareToFeed')} className="sr-only" defaultChecked />
          <div className="w-10 h-6 bg-border rounded-full peer peer-checked:bg-[#2874F0] transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
        </label>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F59E0B]/10 border border-[#FF9F00]/20">
        <Info className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#878787] leading-relaxed">
          <p className="font-semibold text-[#212121] mb-1">Instagram API Requirements</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Requires a Professional (Business or Creator) account</li>
            <li>Account must be connected to a Facebook Page</li>
            <li>Reels must be publicly hosted videos (not local files)</li>
            <li>Maximum Reel duration is 90 seconds</li>
            <li>Publishing limit: 50 posts per 24 hours</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function PublishingModal({ isOpen, onClose, clip }) {
  const queryClient = useQueryClient()
  const { success, error } = useNotificationContext()
  const [platform, setPlatform] = useState('youtube')
  const [isScheduling, setIsScheduling] = useState(false)

  const ytDataQuery = useQuery({
    queryKey: ['publishing', 'youtube', 'data'],
    queryFn: publishingService.getYouTubeData,
    enabled: isOpen && platform === 'youtube',
    staleTime: 1000 * 60 * 5,
    retry: false,
  })

  const igDataQuery = useQuery({
    queryKey: ['publishing', 'instagram', 'data'],
    queryFn: publishingService.getInstagramData,
    enabled: isOpen && platform === 'instagram',
    staleTime: 1000 * 60 * 5,
    retry: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(publishSchema),
    defaultValues: {
      platform: 'youtube',
      youtubeVisibility: 'public',
      instagramShareToFeed: true,
    },
  })

  const publishMutation = useMutation({
    mutationFn: (data) => publishingService.createJob(data),
    onSuccess: (data) => {
      success(
        data.job.scheduledAt ? 'Post scheduled' : 'Publishing started',
        data.job.scheduledAt
          ? `Your clip will be published on ${formatDateTime(data.job.scheduledAt)}`
          : 'Your clip is being published. You will be notified when complete.'
      )

      queryClient.invalidateQueries({ queryKey: ['publishing', 'jobs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'scheduled'] })

      reset()
      onClose()
    },
    onError: (err) => {
      error('Publishing failed', err.userMessage || 'Could not create publishing job.')
    },
  })

  const onSubmit = (data) => {
    const hashtags = data.hashtags
      ? data.hashtags
          .split(/[\s,]+/)
          .filter((tag) => tag.startsWith('#'))
      : clip?.generatedHashtags || []

    publishMutation.mutate({
      clipId: clip._id,
      platform,
      title: data.title,
      description: data.description,
      hashtags,
      scheduledAt: data.scheduledAt || null,
      youtubeConfig: {
        visibility: data.youtubeVisibility,
        categoryId: data.youtubeCategoryId,
        playlistId: data.youtubePlaylistId,
      },
      instagramConfig: {
        shareToFeed: data.instagramShareToFeed,
      },
    })
  }

  const isPlatformConnected = platform === 'youtube'
    ? !ytDataQuery.isError
    : !igDataQuery.isError

  const inputClass = cn(
    'w-full px-4 py-3 rounded-xl text-sm',
    'bg-[#F8F9FA] border border-[#E0E0E0] text-[#212121]',
    'placeholder:text-[#878787]',
    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-[#2874F0]',
    'transition-all duration-150'
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#212121]/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[580px] max-h-[90dvh] overflow-y-auto no-scrollbar bg-white rounded-3xl border border-[#E0E0E0] shadow-float"
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-modal-title"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0E0E0] sticky top-0 bg-white z-10">
              <div>
                <h2
                  id="publish-modal-title"
                  className="text-[15px] font-extrabold text-[#212121]"
                >
                  Publish Clip
                </h2>
                {clip?.title && (
                  <p className="text-xs text-[#878787] mt-0.5 truncate max-w-[360px]">
                    {clip.title}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#878787] hover:text-[#212121] hover:bg-[#F8F9FA] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-[#878787] uppercase tracking-wide">
                  Platform
                </p>
                <PlatformSelector
                  value={platform}
                  onChange={(p) => {
                    setPlatform(p)
                    reset({ platform: p, youtubeVisibility: 'public', instagramShareToFeed: true })
                  }}
                />
              </div>

              {!isPlatformConnected && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F59E0B]/10 border border-[#FF9F00]/20">
                  <AlertCircle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                  <p className="text-sm text-[#212121]">
                    Your {platform === 'youtube' ? 'YouTube' : 'Instagram'} account is not connected.{' '}
                    <a href="/settings/accounts" className="text-[#2874F0] font-semibold hover:underline">
                      Connect it in Settings.
                    </a>
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wide">
                  Title
                </label>
                <input
                  type="text"
                  {...register('title')}
                  defaultValue={clip?.title || ''}
                  placeholder="Enter a compelling title..."
                  className={cn(inputClass, errors.title && 'border-[#FF6161]')}
                />
                {errors.title && (
                  <p className="text-xs text-[#EF4444] font-medium">{errors.title.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Add a description for your video..."
                  className={cn(inputClass, 'resize-none')}
                  defaultValue={
                    clip?.generatedCaptions?.[clip.generatedCaptions.length - 1]?.text || ''
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#878787] uppercase tracking-wide">
                  Hashtags
                </label>
                <input
                  type="text"
                  {...register('hashtags')}
                  placeholder="#shorts #viral #fyp"
                  defaultValue={clip?.generatedHashtags?.join(' ') || ''}
                  className={inputClass}
                />
                <p className="text-xs text-[#878787]">
                  Separate hashtags with spaces or commas
                </p>
              </div>

              {platform === 'youtube' && (
                <YouTubeOptions
                  register={register}
                  categories={ytDataQuery.data?.categories}
                  playlists={ytDataQuery.data?.playlists}
                />
              )}

              {platform === 'instagram' && (
                <InstagramOptions register={register} />
              )}

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="schedule-toggle"
                    checked={isScheduling}
                    onChange={(e) => setIsScheduling(e.target.checked)}
                    className="rounded border-[#E0E0E0] w-4 h-4 accent-primary"
                  />
                  <label
                    htmlFor="schedule-toggle"
                    className="flex items-center gap-2 text-sm font-semibold text-[#212121] cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-[#878787]" />
                    Schedule for later
                  </label>
                </div>

                {isScheduling && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <input
                      type="datetime-local"
                      {...register('scheduledAt')}
                      min={new Date(Date.now() + 11 * 60 * 1000)
                        .toISOString()
                        .slice(0, 16)}
                      className={cn(inputClass)}
                    />
                  </motion.div>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-[#E0E0E0]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={publishMutation.isPending}
                  className="flex-1 py-3 rounded-xl border border-[#E0E0E0] text-sm font-semibold text-[#878787] hover:text-[#212121] hover:bg-[#F8F9FA] transition-all disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={publishMutation.isPending || !isPlatformConnected}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl',
                    'bg-[#2874F0] hover:bg-[#1B5FCC] text-white text-sm font-semibold',
                    'transition-all shadow-md shadow-primary/20',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {publishMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                  ) : isScheduling ? (
                    <><Calendar className="w-4 h-4" /> Schedule</>
                  ) : (
                    <><Send className="w-4 h-4" /> Publish Now</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}