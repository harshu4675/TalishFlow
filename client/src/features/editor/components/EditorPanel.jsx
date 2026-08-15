import { lazy, Suspense } from 'react'
import { FileText, Type, Hash, Crop, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'
import ClipInfo from './ClipInfo'
import CaptionEditor from './CaptionEditor'
import TitleEditor from './TitleEditor'
import HashtagEditor from './HashtagEditor'
import TimelineEditor from './TimelineEditor'
import { Skeleton } from '@/components/ui/skeleton'

const ReframingPanel = lazy(() => import('./ReframingPanel'))

const TABS = [
  { id: 'info', label: 'Info', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'reframe', label: 'Reframe', icon: Crop },
  { id: 'captions', label: 'Captions', icon: FileText },
  { id: 'titles', label: 'Titles', icon: Type },
  { id: 'hashtags', label: 'Hashtags', icon: Hash },
]

function PanelLoader() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

export default function EditorPanel({
  activeTab,
  onTabChange,
  clip,
  video,
  waveformData,
  currentTime,
  onSeek,
  onTrim,
  onSplit,
  isTrimming,
  isSplitting,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="no-scrollbar flex flex-shrink-0 items-center gap-0.5 overflow-x-auto border-b border-white/10 bg-white/5 px-2 py-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold whitespace-nowrap transition-all',
                'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:outline-none',
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-white/50 hover:bg-white/10 hover:text-white'
              )}
              aria-pressed={activeTab === tab.id}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto p-5">
        {activeTab === 'info' && <ClipInfo clip={clip} video={video} />}

        {activeTab === 'timeline' && (
          <TimelineEditor
            clip={clip}
            waveformData={waveformData}
            currentTime={currentTime}
            onSeek={onSeek}
            onTrim={onTrim}
            onSplit={onSplit}
            isTrimming={isTrimming}
            isSplitting={isSplitting}
          />
        )}

        {activeTab === 'reframe' && (
          <Suspense fallback={<PanelLoader />}>
            <ReframingPanel clip={clip} />
          </Suspense>
        )}

        {activeTab === 'captions' && <CaptionEditor clip={clip} />}
        {activeTab === 'titles' && <TitleEditor clip={clip} />}
        {activeTab === 'hashtags' && <HashtagEditor clip={clip} />}
      </div>
    </div>
  )
}
