import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Scissors,
  Type,
  Hash,
  FileText,
  Crop,
  Clock,
  Download,
  Share2,
} from 'lucide-react'
import { apiClient } from '@/services/api'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/utils/constants'
import PageTitle from '@/components/common/PageTitle'
import EmptyState from '@/components/common/EmptyState'
import ClipGrid from '../components/ClipGrid'
import ClipDetail from '../components/ClipDetail'
import TimelineEditor from '../components/TimelineEditor'
import ReframingPanel from '../components/ReframingPanel'
import clipService from '@/services/clipService'
import timelineService from '@/services/timelineService'
import { useNotificationContext } from '@/context/NotificationContext'

const ExportModal = lazy(() => import('../components/ExportModal'))
const PublishingModal = lazy(
  () => import('@/features/publishing/components/PublishingModal')
)

async function fetchVideo(videoId) {
  const response = await apiClient.get(`/videos/${videoId}`)
  return response.data.data.video
}

async function fetchClips(videoId) {
  const response = await apiClient.get(
    `/clips?videoId=${videoId}&sort=-detectionScore&limit=20`
  )
  return response.data.data.clips
}

const TABS = [
  { id: 'clips', label: 'Info', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'reframing', label: 'Reframe', icon: Crop },
  { id: 'captions', label: 'Captions', icon: FileText },
  { id: 'titles', label: 'Titles', icon: Type },
  { id: 'hashtags', label: 'Hashtags', icon: Hash },
]

function EditorSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0C1117]">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="skeleton h-9 w-9 rounded-xl" />
          <div className="flex flex-col gap-2">
            <div className="skeleton h-3.5 w-48" />
            <div className="skeleton h-3 w-28" />
          </div>
        </div>
        <div className="skeleton h-9 w-40 rounded-xl" />
      </div>
      <div className="flex flex-1">
        <div className="hidden w-[200px] flex-shrink-0 border-r border-white/10 p-3 sm:block">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="skeleton h-64 w-36 rounded-2xl" />
            <div className="skeleton h-4 w-56" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditorPage() {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const { success, error, info } = useNotificationContext()
  const videoRef = useRef(null)

  const [activeTab, setActiveTab] = useState('clips')
  const [selectedClip, setSelectedClip] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isPublishOpen, setIsPublishOpen] = useState(false)
  const [isTrimming, setIsTrimming] = useState(false)
  const [isSplitting, setIsSplitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { data: video, isLoading: isLoadingVideo } = useQuery({
    queryKey: ['videos', videoId],
    queryFn: () => fetchVideo(videoId),
    enabled: !!videoId,
  })

  const {
    data: clips = [],
    isLoading: isLoadingClips,
    refetch: refetchClips,
  } = useQuery({
    queryKey: ['clips', 'video', videoId],
    queryFn: () => fetchClips(videoId),
    enabled: !!videoId,
  })

  const waveformQuery = useQuery({
    queryKey: ['waveform', selectedClip?._id],
    queryFn: () => timelineService.getWaveform(selectedClip._id),
    enabled: !!selectedClip?._id && activeTab === 'timeline',
    staleTime: 1000 * 60 * 10,
  })

  useEffect(() => {
    if (clips.length) {
      setSelectedClip((current) => current || clips[0])
    }
  }, [clips])

  const handleSeek = (time) => {
    setCurrentTime(time)
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  const handleTrim = async (startTime, endTime) => {
    if (!selectedClip) return
    setIsTrimming(true)
    info('Trimming started', 'Processing your trim. You will be notified when complete.')

    try {
      await timelineService.trimClip(selectedClip._id, startTime, endTime)
      refetchClips()
    } catch (err) {
      error('Trim failed', err.userMessage || 'Could not trim the clip.')
    } finally {
      setIsTrimming(false)
    }
  }

  const handleSplit = async (splitTime) => {
    if (!selectedClip) return
    setIsSplitting(true)
    info('Split started', 'Processing your split. You will be notified when complete.')

    try {
      await timelineService.splitClip(selectedClip._id, splitTime)
      refetchClips()
    } catch (err) {
      error('Split failed', err.userMessage || 'Could not split the clip.')
    } finally {
      setIsSplitting(false)
    }
  }

  const handleExport = async (options) => {
    if (!selectedClip) return
    setIsExporting(true)

    try {
      await clipService.exportClip(selectedClip._id, options)
      setIsExportOpen(false)
      success(
        'Export started',
        'Your clip export has started. You will be notified when ready.'
      )
    } catch (err) {
      error('Export failed', err.userMessage || 'Could not export the clip.')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoadingVideo) {
    return <EditorSkeleton />
  }

  if (!video) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0C1117]">
        <EmptyState
          dark
          icon={Scissors}
          title="Video not found"
          description="This video does not exist or has been deleted."
          action={{
            label: 'Back to dashboard',
            onClick: () => navigate(ROUTES.DASHBOARD),
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#0C1117] text-white">
      <PageTitle title={video.title || 'Editor'} />

      <header className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#0C1117] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="rounded-xl p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="min-w-0">
            <h1 className="max-w-[220px] truncate text-sm font-bold text-white sm:max-w-[400px]">
              {video.title || 'Untitled Video'}
            </h1>
            <p className="mt-0.5 text-[11px] text-white/40">
              {clips.length} clip{clips.length !== 1 ? 's' : ''} generated
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="hidden items-center gap-0.5 rounded-xl bg-white/10 p-1 md:flex">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all',
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-white/50 hover:text-white'
                  )}
                  aria-pressed={activeTab === tab.id}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden xl:block">{tab.label}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setIsExportOpen(true)}
            disabled={!selectedClip}
            className={cn(
              'bg-primary hover:bg-primary-hover flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all',
              'disabled:cursor-not-allowed disabled:opacity-40'
            )}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:block">Export</span>
          </button>
          <button
            onClick={() => setIsPublishOpen(true)}
            disabled={!selectedClip}
            className={cn(
              'flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10',
              'disabled:cursor-not-allowed disabled:opacity-40'
            )}
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:block">Publish</span>
          </button>
        </div>
      </header>

      <div className="no-scrollbar mx-3 mt-3 flex flex-shrink-0 items-center gap-1 overflow-x-auto rounded-xl bg-white/10 p-1 md:hidden">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-semibold whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-white/40 hover:text-white'
              )}
              aria-pressed={activeTab === tab.id}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="no-scrollbar w-[190px] flex-shrink-0 overflow-y-auto border-r border-white/10 xl:w-[240px]">
          <ClipGrid
            clips={clips}
            isLoading={isLoadingClips}
            selectedClipId={selectedClip?._id}
            onSelect={setSelectedClip}
            processingStatus={video.processingStatus}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {selectedClip ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedClip._id}-${activeTab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="flex flex-1 flex-col"
              >
                {activeTab === 'timeline' ? (
                  <div className="flex h-full flex-col lg:flex-row">
                    <div className="flex flex-shrink-0 items-center justify-center border-b border-white/10 p-6 lg:w-[280px] lg:border-r lg:border-b-0 xl:w-[320px]">
                      <div className="relative aspect-[9/16] w-full max-w-[200px] overflow-hidden rounded-2xl border border-white/10 bg-black">
                        {selectedClip.filePath ? (
                          <video
                            ref={videoRef}
                            className="h-full w-full object-cover"
                            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                            playsInline
                          >
                            <source
                              src={`/api/v1/clips/${selectedClip._id}/stream`}
                              type="video/mp4"
                            />
                          </video>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <p className="text-xs text-white/30">Preview unavailable</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                      <TimelineEditor
                        clip={selectedClip}
                        waveformData={waveformQuery.data?.waveform || []}
                        currentTime={currentTime}
                        onSeek={handleSeek}
                        onTrim={handleTrim}
                        onSplit={handleSplit}
                        isTrimming={isTrimming}
                        isSplitting={isSplitting}
                      />
                    </div>
                  </div>
                ) : activeTab === 'reframing' ? (
                  <div className="flex h-full flex-col lg:flex-row">
                    <div className="flex flex-shrink-0 items-center justify-center border-b border-white/10 p-6 lg:w-[280px] lg:border-r lg:border-b-0 xl:w-[320px]">
                      <div className="aspect-[9/16] w-full max-w-[200px] overflow-hidden rounded-2xl border border-white/10 bg-black">
                        {selectedClip.thumbnailPath ? (
                          <img
                            src={`/api/v1/clips/${selectedClip._id}/thumbnail`}
                            alt="Clip thumbnail"
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <p className="text-xs text-white/30">No preview</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                      <ReframingPanel clip={selectedClip} />
                    </div>
                  </div>
                ) : (
                  <ClipDetail clip={selectedClip} activeTab={activeTab} video={video} />
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                dark
                compact
                icon={Scissors}
                title={
                  video.processingStatus === 'completed'
                    ? 'No clips generated'
                    : 'Processing video'
                }
                description={
                  video.processingStatus === 'completed'
                    ? 'No engaging moments were detected.'
                    : 'Clips will appear here once processing is complete.'
                }
              />
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          onExport={handleExport}
          isExporting={isExporting}
          clipTitle={selectedClip?.title}
        />
        <PublishingModal
          isOpen={isPublishOpen}
          onClose={() => setIsPublishOpen(false)}
          clip={selectedClip}
        />
      </Suspense>
    </div>
  )
}
