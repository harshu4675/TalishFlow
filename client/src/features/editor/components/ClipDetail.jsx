import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CaptionEditor from './CaptionEditor'
import TitleEditor from './TitleEditor'
import HashtagEditor from './HashtagEditor'
import ClipPreview from './ClipPreview'

export default function ClipDetail({ clip, activeTab, video }) {
  return (
    <div className="flex flex-col lg:flex-row h-full">
      <div className="lg:w-[320px] xl:w-[360px] border-b lg:border-b-0 lg:border-r border-white/10 flex-shrink-0 flex items-center justify-center p-6">
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
        <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">
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
              className="bg-white/5 rounded-xl p-3 border border-white/10"
            >
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">
                {item.label}
              </p>
              <p className="text-sm font-bold text-white mt-1 capitalize">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {clip.detectionReasons?.length > 0 && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">
            Why this clip was selected
          </p>
          <div className="flex flex-wrap gap-2">
            {clip.detectionReasons.map((reason) => (
              <span
                key={reason}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2874F0]/20 text-[#2874F0] border border-[#2874F0]/30"
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