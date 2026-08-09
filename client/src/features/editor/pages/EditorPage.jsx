import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Loader2,
  Share2,
} from 'lucide-react'
import PublishingModal from '@/features/publishing/components/PublishingModal'
import { apiClient } from '@/services/api'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/utils/constants'
import PageTitle from '@/components/common/PageTitle'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import ClipGrid from '../components/ClipGrid'
import ClipDetail from '../components/ClipDetail'
import TimelineEditor from '../components/TimelineEditor'
import ReframingPanel from '../components/ReframingPanel'
import ExportModal from '../components/ExportModal'
import clipService from '@/services/clipService'
import timelineService from '@/services/timelineService'
import { useNotificationContext } from '@/context/NotificationContext'

async function fetchVideo(videoId) {
  const response = await apiClient.get(`/videos/${videoId}`)
  return response.data.data.video
}

async function fetchClips(videoId) {
  const response = await apiClient.get(`/clips?videoId=${videoId}&sort=-detectionScore&limit=20`)
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

export default function EditorPage() {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error, info } = useNotificationContext()
  const videoRef = useRef(null)

  const [activeTab, setActiveTab] = useState('clips')
  const [selectedClip, setSelectedClip] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isTrimming, setIsTrimming] = useState(false)
  const [isSplitting, setIsSplitting] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    
const [isPublishOpen, setIsPublishOpen] = useState(false)

  const { data: video, isLoading: isLoadingVideo } = useQuery({
    queryKey: ['videos', videoId],
    queryFn: () => fetchVideo(videoId),
    enabled: !!videoId,
  })

  const { data: clips = [], isLoading: isLoadingClips, refetch: refetchClips } = useQuery({
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
    if (clips.length && !selectedClip) {
      setSelectedClip(clips[0])
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
      success('Export started', 'Your clip export has started. You will be notified when ready.')
    } catch (err) {
      error('Export failed', err.userMessage || 'Could not export the clip.')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoadingVideo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0C1117]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0C1117]">
        <EmptyState
          icon={Scissors}
          title="Video not found"
          description="This video does not exist or has been deleted."
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0C1117] text-white flex flex-col overflow-hidden">
      <PageTitle title={video.title || 'Editor'} />

      <header className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 flex-shrink-0 bg-[#0C1117]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <h1 className="text-sm font-bold text-white truncate max-w-[240px] sm:max-w-[400px]">
              {video.title || 'Untitled Video'}
            </h1>
            <p className="text-[11px] text-white/40 mt-0.5">
              {clips.length} clip{clips.length !== 1 ? 's' : ''} generated
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all',
                  activeTab === tab.id
                    ? 'bg-[#2874F0] text-white'
                    : 'text-white/50 hover:text-white'
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden lg:block">{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsExportOpen(true)}
            disabled={!selectedClip}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
              'bg-[#2874F0] hover:bg-[#1B5FCC] text-white transition-all shadow-md',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:block">Export</span>
                  </button>
                  <button
  onClick={() => setIsPublishOpen(true)}
  disabled={!selectedClip}
  className={cn(
    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
    'bg-white border border-[#E0E0E0] text-[#212121] hover:bg-[#F8F9FA] transition-all',
    'disabled:opacity-40 disabled:cursor-not-allowed'
  )}
>
  <Share2 className="w-4 h-4" />
  <span className="hidden sm:block">Publish</span>
</button>
        </div>
      </header>

      <div className="sm:hidden flex items-center gap-1 bg-white/10 mx-3 mt-3 rounded-xl p-1 flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-[#2874F0] text-white'
                : 'text-white/40 hover:text-white'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[200px] xl:w-[240px] border-r border-white/10 flex-shrink-0 overflow-y-auto">
          <ClipGrid
            clips={clips}
            isLoading={isLoadingClips}
            selectedClipId={selectedClip?._id}
            onSelect={setSelectedClip}
            processingStatus={video.processingStatus}
          />
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {selectedClip ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedClip._id}-${activeTab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex flex-col"
              >
                {activeTab === 'timeline' ? (
                  <div className="flex flex-col lg:flex-row h-full">
                    <div className="lg:w-[280px] xl:w-[320px] border-b lg:border-b-0 lg:border-r border-white/10 flex-shrink-0 flex items-center justify-center p-6">
                      <div className="w-full max-w-[200px] aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/10 relative">
                        {selectedClip.filePath ? (
                          <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                            playsInline
                          >
                            <source
                              src={`/api/v1/clips/${selectedClip._id}/stream`}
                              type="video/mp4"
                            />
                          </video>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-xs text-white/30">Preview unavailable</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
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
                  <div className="flex flex-col lg:flex-row h-full">
                    <div className="lg:w-[280px] xl:w-[320px] border-b lg:border-b-0 lg:border-r border-white/10 flex-shrink-0 flex items-center justify-center p-6">
                      <div className="w-full max-w-[200px] aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/10">
                        {selectedClip.thumbnailPath ? (
                          <img
                            src={`/api/v1/clips/${selectedClip._id}/thumbnail`}
                            alt="Clip thumbnail"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-xs text-white/30">No preview</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                      <ReframingPanel clip={selectedClip} />
                    </div>
                  </div>
                ) : (
                  <ClipDetail
                    clip={selectedClip}
                    activeTab={activeTab}
                    video={video}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={Scissors}
                title={video.processingStatus === 'completed' ? 'No clips generated' : 'Processing video'}
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
    </div>
  )
}