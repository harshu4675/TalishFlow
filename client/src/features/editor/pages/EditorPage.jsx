import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Share2, Scissors } from 'lucide-react'
import { videoService } from '@/services/videoService'
import { clipService } from '@/services/clipService'
import { timelineService } from '@/services/timelineService'
import { queryKeys } from '@/utils/queryKeys'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/utils/constants'
import PageTitle from '@/components/common/PageTitle'
import EmptyState from '@/components/common/EmptyState'
import ClipRail from '../components/ClipRail'
import MediaPreview from '../components/MediaPreview'
import EditorPanel from '../components/EditorPanel'
import { useNotificationContext } from '@/contexts/NotificationContext'

const ExportDialog = lazy(() => import('../components/ExportDialog'))
const PublishDialog = lazy(() => import('@/features/publishing/components/PublishDialog'))

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

  const [activeTab, setActiveTab] = useState('info')
  const [selectedClip, setSelectedClip] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isPublishOpen, setIsPublishOpen] = useState(false)
  const [isTrimming, setIsTrimming] = useState(false)
  const [isSplitting, setIsSplitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { data: video, isLoading: isLoadingVideo } = useQuery({
    queryKey: queryKeys.videos.detail(videoId),
    queryFn: () => videoService.getVideo(videoId),
    enabled: !!videoId,
  })

  const {
    data: clips = [],
    isLoading: isLoadingClips,
    refetch: refetchClips,
  } = useQuery({
    queryKey: queryKeys.clips.byVideo(videoId),
    queryFn: () => clipService.listClips({ videoId, sort: '-detectionScore', limit: 20 }),
    enabled: !!videoId,
  })

  const waveformQuery = useQuery({
    queryKey: queryKeys.clips.waveform(selectedClip?._id),
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

  const handleVideoTimeUpdate = (time) => {
    setCurrentTime(time)
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
    <div className="flex h-dvh flex-col overflow-hidden bg-[#0C1117] text-white">
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

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="no-scrollbar hidden w-[200px] flex-shrink-0 overflow-y-auto border-r border-white/10 md:block xl:w-[220px]">
          <ClipRail
            clips={clips}
            isLoading={isLoadingClips}
            selectedClipId={selectedClip?._id}
            onSelect={setSelectedClip}
          />
        </aside>

        <div className="no-scrollbar flex flex-shrink-0 gap-2 overflow-x-auto border-b border-white/10 md:hidden">
          <ClipRail
            horizontal
            clips={clips}
            isLoading={isLoadingClips}
            selectedClipId={selectedClip?._id}
            onSelect={setSelectedClip}
          />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-h-0 flex-col overflow-y-auto">
            {selectedClip ? (
              <MediaPreview
                clip={selectedClip}
                ref={videoRef}
                currentTime={currentTime}
                onTimeUpdate={handleVideoTimeUpdate}
              />
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

          <div className="min-h-0 border-t border-white/10 xl:border-t-0 xl:border-l">
            {selectedClip ? (
              <EditorPanel
                activeTab={activeTab}
                onTabChange={setActiveTab}
                clip={selectedClip}
                video={video}
                waveformData={waveformQuery.data?.waveform || []}
                currentTime={currentTime}
                onSeek={handleSeek}
                onTrim={handleTrim}
                onSplit={handleSplit}
                isTrimming={isTrimming}
                isSplitting={isSplitting}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6">
                <p className="text-sm text-white/30">Select a clip to start editing</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <ExportDialog
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          onExport={handleExport}
          isExporting={isExporting}
          clipTitle={selectedClip?.title}
        />
        <PublishDialog
          isOpen={isPublishOpen}
          onClose={() => setIsPublishOpen(false)}
          clip={selectedClip}
        />
      </Suspense>
    </div>
  )
}
