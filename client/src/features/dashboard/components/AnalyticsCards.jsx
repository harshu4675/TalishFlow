import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Video, Scissors, Eye, Radio } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/formatters'

const CARDS = [
  {
    key: 'totalViews',
    label: 'Total Views',
    icon: Eye,
    gradient: 'from-[#2874F0] to-[#1B5FCC]',
    iconBg: 'bg-[#E7F1FE]',
    iconColor: 'text-[#2874F0]',
    shadow: 'shadow-[#2874F0]/20',
  },
  {
    key: 'totalVideos',
    label: 'Videos Uploaded',
    icon: Video,
    gradient: 'from-[#FB641B] to-[#E8560F]',
    iconBg: 'bg-[#FFF0E6]',
    iconColor: 'text-[#FB641B]',
    shadow: 'shadow-[#FB641B]/20',
  },
  {
    key: 'totalClips',
    label: 'Clips Generated',
    icon: Scissors,
    gradient: 'from-[#FF9F00] to-[#F57C00]',
    iconBg: 'bg-[#FFF8E7]',
    iconColor: 'text-[#FF9F00]',
    shadow: 'shadow-[#FF9F00]/20',
  },
  {
    key: 'totalPublished',
    label: 'Published',
    icon: Radio,
    gradient: 'from-[#388E3C] to-[#2E7D32]',
    iconBg: 'bg-[#E8F5E9]',
    iconColor: 'text-[#388E3C]',
    shadow: 'shadow-[#388E3C]/20',
  },
]

function StatCard({ card, value, change, isLoading, index }) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-10 w-10 rounded-xl" />
        </div>
        <div className="skeleton mb-3 h-9 w-24" />
        <div className="skeleton h-3 w-32" />
      </div>
    )
  }

  const isPositive = change >= 0
  const formattedValue = formatNumber(value || 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className={cn(
        'group relative rounded-2xl border border-[#E0E0E0] bg-white p-5',
        'overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl',
        card.shadow
      )}
    >
      <div
        className={cn(
          'absolute top-0 right-0 left-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100',
          card.gradient
        )}
      />

      <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br opacity-5 blur-2xl transition-opacity group-hover:opacity-10">
        <div
          className={cn('h-full w-full rounded-full bg-gradient-to-br', card.gradient)}
        />
      </div>

      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-bold tracking-wider text-[#878787] uppercase">
              {card.label}
            </p>
          </div>
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
              card.iconBg
            )}
          >
            <card.icon className={cn('h-5 w-5', card.iconColor)} />
          </div>
        </div>

        <p className="mb-3 text-[32px] leading-none font-black tracking-tight text-[#212121]">
          {formattedValue}
        </p>

        {change !== undefined && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold',
                isPositive ? 'bg-[#E8F5E9] text-[#388E3C]' : 'bg-[#FFEBEE] text-[#FF6161]'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {isPositive ? '+' : ''}
              {change}%
            </div>
            <span className="text-[11px] font-medium text-[#878787]">vs last month</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function AnalyticsCards({ stats, isLoading }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CARDS.map((card, index) => (
        <StatCard
          key={card.key}
          card={card}
          value={stats?.[card.key]}
          change={stats?.changes?.[card.key]}
          isLoading={isLoading}
          index={index}
        />
      ))}
    </div>
  )
}
