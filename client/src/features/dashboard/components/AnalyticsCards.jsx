import { Video, Scissors, Eye, Radio } from 'lucide-react'
import MetricCard from '@/components/common/MetricCard'

const CARDS = [
  { key: 'totalViews', label: 'Total Views', icon: Eye },
  { key: 'totalVideos', label: 'Videos Uploaded', icon: Video },
  { key: 'totalClips', label: 'Clips Generated', icon: Scissors },
  { key: 'totalPublished', label: 'Published', icon: Radio },
]

export default function AnalyticsCards({ stats, isLoading }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => (
        <MetricCard
          key={card.key}
          label={card.label}
          icon={card.icon}
          value={stats?.[card.key]}
          change={stats?.changes?.[card.key]}
          context="vs last month"
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}
