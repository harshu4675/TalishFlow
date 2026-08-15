import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Info,
} from 'lucide-react'
import publishingService from '@/services/publishingService'
import { useNotificationContext } from '@/contexts/NotificationContext'
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
          color: 'text-error',
          bg: 'bg-error/10',
          border: 'border-error/30',
        },
        {
          id: 'instagram',
          label: 'Instagram',
          icon: Instagram,
          color: 'text-warning',
          bg: 'bg-warning/10',
          border: 'border-warning/30',
        },
      ].map((platform) => (
        <button
          key={platform.id}
          type="button"
          onClick={() => onChange(platform.id)}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3 transition-all',
            value === platform.id
              ? `${platform.border} ${platform.bg}`
              : 'border-border bg-surface-muted hover:border-primary/30'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              value === platform.id ? platform.bg : 'bg-surface'
            )}
          >
            <platform.icon
              className={cn(
                'h-4 w-4',
                value === platform.id ? platform.color : 'text-foreground-muted'
              )}
            />
          </div>
          <span
            className={cn(
              'text-sm font-semibold',
              value === platform.id ? 'text-foreground' : 'text-foreground-muted'
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
    <div className="bg-error/5 border-error/20 flex flex-col gap-4 rounded-xl border p-4">
      <p className="text-error text-xs font-bold tracking-wide uppercase">
        YouTube Options
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-foreground-muted text-xs font-semibold">
            Visibility
          </label>
          <div className="relative">
            <select
              {...register('youtubeVisibility')}
              className="bg-surface border-border text-foreground focus:ring-danger/30 w-full appearance-none rounded-xl border px-3 py-2.5 pr-8 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
            <ChevronDown className="text-foreground-muted pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-foreground-muted text-xs font-semibold">Category</label>
          <div className="relative">
            <select
              {...register('youtubeCategoryId')}
              className="bg-surface border-border text-foreground focus:ring-danger/30 w-full appearance-none rounded-xl border px-3 py-2.5 pr-8 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="">Select category</option>
              {(categories || []).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
            <ChevronDown className="text-foreground-muted pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-foreground-muted text-xs font-semibold">
          Add to Playlist
        </label>
        <div className="relative">
          <select
            {...register('youtubePlaylistId')}
            className="bg-surface border-border text-foreground focus:ring-danger/30 w-full appearance-none rounded-xl border px-3 py-2.5 pr-8 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="">No playlist</option>
            {(playlists || []).map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.title}
              </option>
            ))}
          </select>
          <ChevronDown className="text-foreground-muted pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2" />
        </div>
      </div>

      <p className="text-foreground-muted text-[11px] leading-relaxed">
        Videos shorter than 60 seconds in vertical format are automatically published as
        YouTube Shorts.
      </p>
    </div>
  )
}

function InstagramOptions({ register }) {
  return (
    <div className="bg-warning/5 border-warning/20 flex flex-col gap-4 rounded-xl border p-4">
      <p className="text-warning text-xs font-bold tracking-wide uppercase">
        Instagram Options
      </p>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground text-sm font-semibold">Share to Feed</p>
          <p className="text-foreground-muted mt-0.5 text-xs">
            Also show the Reel in your Instagram grid
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            {...register('instagramShareToFeed')}
            className="sr-only"
            defaultChecked
          />
          <div className="bg-border peer peer-checked:bg-primary after:bg-surface h-6 w-10 rounded-full transition-all after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:transition-all after:content-[''] peer-checked:after:translate-x-4" />
        </label>
      </div>

      <div className="bg-warning/10 border-warning/20 flex items-start gap-2.5 rounded-xl border p-3">
        <Info className="text-warning mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="text-foreground-muted text-xs leading-relaxed">
          <p className="text-foreground mb-1 font-semibold">Instagram API Requirements</p>
          <ul className="list-inside list-disc space-y-1">
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

export default function PublishDialog({ isOpen, onClose, clip }) {
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
      ? data.hashtags.split(/[\s,]+/).filter((tag) => tag.startsWith('#'))
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

  const isPlatformConnected =
    platform === 'youtube' ? !ytDataQuery.isError : !igDataQuery.isError

  const inputClass = cn(
    'w-full px-4 py-3 rounded-xl text-sm',
    'bg-surface-muted border border-border text-foreground',
    'placeholder:text-foreground-muted',
    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
    'transition-all duration-150'
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="z-modal fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-foreground/40 absolute inset-0 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="no-scrollbar bg-surface border-border shadow-float relative z-10 max-h-[90dvh] w-full max-w-[580px] overflow-y-auto rounded-3xl border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-modal-title"
          >
            <div className="border-border bg-surface sticky top-0 z-10 flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2
                  id="publish-modal-title"
                  className="text-foreground text-[15px] font-extrabold"
                >
                  Publish Clip
                </h2>
                {clip?.title && (
                  <p className="text-foreground-muted mt-0.5 max-w-[360px] truncate text-xs">
                    {clip.title}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-foreground-muted hover:text-foreground hover:bg-surface-muted rounded-xl p-2 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-6">
              <div className="flex flex-col gap-2">
                <p className="text-foreground-muted text-xs font-bold tracking-wide uppercase">
                  Platform
                </p>
                <PlatformSelector
                  value={platform}
                  onChange={(p) => {
                    setPlatform(p)
                    reset({
                      platform: p,
                      youtubeVisibility: 'public',
                      instagramShareToFeed: true,
                    })
                  }}
                />
              </div>

              {!isPlatformConnected && (
                <div className="bg-warning/10 border-warning/20 flex items-center gap-3 rounded-xl border p-4">
                  <AlertCircle className="text-warning h-4 w-4 flex-shrink-0" />
                  <p className="text-foreground text-sm">
                    Your {platform === 'youtube' ? 'YouTube' : 'Instagram'} account is not
                    connected.{' '}
                    <a
                      href="/settings/accounts"
                      className="text-primary font-semibold hover:underline"
                    >
                      Connect it in Settings.
                    </a>
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-foreground-muted text-xs font-bold tracking-wide uppercase">
                  Title
                </label>
                <input
                  type="text"
                  {...register('title')}
                  defaultValue={clip?.title || ''}
                  placeholder="Enter a compelling title..."
                  className={cn(inputClass, errors.title && 'border-error')}
                />
                {errors.title && (
                  <p className="text-error text-xs font-medium">{errors.title.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-foreground-muted text-xs font-bold tracking-wide uppercase">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Add a description for your video..."
                  className={cn(inputClass, 'resize-none')}
                  defaultValue={
                    clip?.generatedCaptions?.[clip.generatedCaptions.length - 1]?.text ||
                    ''
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-foreground-muted text-xs font-bold tracking-wide uppercase">
                  Hashtags
                </label>
                <input
                  type="text"
                  {...register('hashtags')}
                  placeholder="#shorts #viral #fyp"
                  defaultValue={clip?.generatedHashtags?.join(' ') || ''}
                  className={inputClass}
                />
                <p className="text-foreground-muted text-xs">
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

              {platform === 'instagram' && <InstagramOptions register={register} />}

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="schedule-toggle"
                    checked={isScheduling}
                    onChange={(e) => setIsScheduling(e.target.checked)}
                    className="border-border accent-primary h-4 w-4 rounded"
                  />
                  <label
                    htmlFor="schedule-toggle"
                    className="text-foreground flex cursor-pointer items-center gap-2 text-sm font-semibold"
                  >
                    <Calendar className="text-foreground-muted h-4 w-4" />
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

              <div className="border-border flex gap-3 border-t pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={publishMutation.isPending}
                  className="border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted flex-1 rounded-xl border py-3 text-sm font-semibold transition-all disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={publishMutation.isPending || !isPlatformConnected}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl py-3',
                    'bg-primary hover:bg-primary-hover text-sm font-semibold text-white',
                    'shadow-primary/20 shadow-md transition-all',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  {publishMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
                    </>
                  ) : isScheduling ? (
                    <>
                      <Calendar className="h-4 w-4" /> Schedule
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Publish Now
                    </>
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
