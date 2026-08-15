import { motion, AnimatePresence } from 'framer-motion'
import CaptionEditor from './CaptionEditor'
import TitleEditor from './TitleEditor'
import HashtagEditor from './HashtagEditor'
import ClipPreview from './ClipPreview'

export default function ClipDetail({ clip, activeTab, video }) {
  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="flex flex-shrink-0 items-center justify-center border-b border-white/10 p-6 lg:w-[320px] lg:border-r lg:border-b-0 xl:w-[360px]">
        <ClipPreview clip={clip} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {activeTab === 'clips' && <ClipInfoPanel clip={clip} />}
            {activeTab === 'captions' && <CaptionEditor clip={clip} video={video} />}
            {activeTab === 'titles' && <TitleEditor clip={clip} video={video} />}
            {activeTab === 'hashtags' && <HashtagEditor clip={clip} video={video} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function ClipInfoPanel({ clip }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-3 text-xs font-bold tracking-widest text-white/40 uppercase">
          Clip Details
        </p>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Engagement Score', value: `${clip.detectionScore || 0}%` },
            { label: 'Duration', value: `${Math.round(clip.duration || 0)}s` },
            { label: 'Resolution', value: `${clip.width}×${clip.height}` },
            { label: 'Status', value: clip.status },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-bold text-white capitalize">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {clip.detectionReasons?.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-bold tracking-widest text-white/40 uppercase">
            Why this clip was selected
          </p>
          <div className="flex flex-wrap gap-2">
            {clip.detectionReasons.map((reason) => (
              <span
                key={reason}
                className="bg-primary/20 text-primary border-primary/30 rounded-full border px-3 py-1.5 text-xs font-semibold"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
