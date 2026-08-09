import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  Eye,
  ThumbsUp,
  MessageSquare,
  Share2,
  Youtube,
  Instagram,
  TrendingUp,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { apiClient } from '@/services/api'
import PageTitle from '@/components/common/PageTitle'
import { cn } from '@/utils/cn'
import { formatNumber, formatRelativeTime } from '@/utils/formatters'

const PERIODS = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
]

async function fetchAnalyticsOverview(period) {
  const response = await apiClient.get(`/analytics/overview?period=${period}`)
  return response.data.data
}

async function fetchTopContent() {
  const response = await apiClient.get('/analytics/top-content?limit=8')
  return response.data.data.content
}

async function fetchPlatformBreakdown(period) {
  const response = await apiClient.get(`/analytics/platforms?period=${period}`)
  return response.data.data
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-float px-4 py-3">
      <p className="text-xs font-semibold text-[#878787] mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-[#878787] capitalize">{entry.name}:</span>
          <span className="text-xs font-bold text-[#212121]">
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, change, color, bg, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E0E0E0] p-5">
        <div className="flex flex-col gap-3">
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-8 w-24 rounded" />
          <div className="skeleton h-3 w-32 rounded" />
        </div>
      </div>
    )
  }

  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#E0E0E0] p-5 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-semibold text-[#878787]">{label}</p>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
      </div>

      <p className="text-[28px] font-extrabold text-[#212121] tracking-tight leading-none mb-2">
        {formatNumber(value || 0)}
      </p>

      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          <TrendingUp
            className={cn('w-3.5 h-3.5', isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]')}
          />
          <span
            className={cn(
              'text-xs font-semibold',
              isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'
            )}
          >
            {isPositive ? '+' : ''}{change}%
          </span>
          <span className="text-xs text-[#878787]">vs last period</span>
        </div>
      )}
    </motion.div>
  )
}

function TopContentCard({ item, index }) {
  const PLATFORM_ICONS = {
    youtube: { icon: Youtube, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10' },
    instagram: { icon: Instagram, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
  }

  const platform = PLATFORM_ICONS[item.platform]
  const PlatformIcon = platform?.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#F8F9FA] transition-all group"
    >
      <span className="text-sm font-black text-[#878787] w-5 text-center">
        {index + 1}
      </span>

      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#F8F9FA]">
        {PlatformIcon && (
          <PlatformIcon className={cn('w-4 h-4', platform?.color)} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#212121] truncate">
          {item.title || 'Untitled'}
        </p>
        <p className="text-xs text-[#878787] mt-0.5">
          {formatRelativeTime(item.publishedAt)}
        </p>
      </div>

      {item.platformVideoUrl && (
        <a
          href={item.platformVideoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-[#878787] hover:text-[#2874F0] hover:bg-[#2874F0]/10"
          aria-label="View on platform"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </motion.div>
  )
}

const PIE_COLORS = ['#2874F0', '#EF4444', '#F59E0B', '#22C55E']

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: () => fetchAnalyticsOverview(period),
    staleTime: 1000 * 60 * 5,
  })

  const { data: topContent = [], isLoading: isLoadingTop } = useQuery({
    queryKey: ['analytics', 'top-content'],
    queryFn: fetchTopContent,
    staleTime: 1000 * 60 * 5,
  })

  const { data: platformData, isLoading: isLoadingPlatform } = useQuery({
    queryKey: ['analytics', 'platforms', period],
    queryFn: () => fetchPlatformBreakdown(period),
    staleTime: 1000 * 60 * 5,
  })

  const chartData = overview?.chartData || []

  const pieData = platformData
    ? [
        { name: 'YouTube', value: platformData.youtube?.published || 0 },
        { name: 'Instagram', value: platformData.instagram?.published || 0 },
      ]
    : []

  const METRIC_CARDS = [
    {
      icon: Eye,
      label: 'Total Views',
      value: overview?.totals?.views,
      change: undefined,
      color: 'text-[#2874F0]',
      bg: 'bg-[#2874F0]/10',
    },
    {
      icon: ThumbsUp,
      label: 'Total Likes',
      value: overview?.totals?.likes,
      change: undefined,
      color: 'text-[#22C55E]',
      bg: 'bg-[#22C55E]/10',
    },
    {
      icon: MessageSquare,
      label: 'Comments',
      value: overview?.totals?.comments,
      change: undefined,
      color: 'text-[#F59E0B]',
      bg: 'bg-[#F59E0B]/10',
    },
    {
      icon: Share2,
      label: 'Shares',
      value: overview?.totals?.shares,
      change: undefined,
      color: 'text-[#FB641B]',
      bg: 'bg-[#FB641B]/10',
    },
    {
      icon: TrendingUp,
      label: 'Engagement Rate',
      value: overview?.totals?.engagementRate,
      change: undefined,
      color: 'text-[#EF4444]',
      bg: 'bg-[#EF4444]/10',
      isPercent: true,
    },
    {
      icon: Clock,
      label: 'Watch Time (min)',
      value: overview?.totals?.watchTimeMinutes,
      change: undefined,
      color: 'text-[#878787]',
      bg: 'bg-[#F8F9FA]',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  }

  return (
    <div className="p-5 lg:p-7 max-w-[1400px] mx-auto">
      <PageTitle title="Analytics" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-[26px] font-extrabold text-[#212121] tracking-tight">
              Analytics
            </h1>
            <p className="text-[#878787] text-sm mt-1">
              Track your content performance across all platforms.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#F8F9FA] rounded-xl p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                  period === p.value
                    ? 'bg-white text-[#212121] shadow-sm'
                    : 'text-[#878787] hover:text-[#212121]'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {METRIC_CARDS.map((card) => (
              <MetricCard
                key={card.label}
                {...card}
                isLoading={isLoadingOverview}
              />
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="bg-white rounded-2xl border border-[#E0E0E0] p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[15px] font-bold text-[#212121]">Views Over Time</h2>
                <p className="text-xs text-[#878787] mt-0.5">Daily view counts</p>
              </div>
            </div>

            <div className="h-[240px]">
              {isLoadingOverview ? (
                <div className="h-full skeleton rounded-xl" />
              ) : chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-[#878787]">
                    No view data available for this period.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2874F0" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2874F0" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'var(--color-text-secondary)', fontFamily: 'Manrope' }}
                      tickLine={false}
                      axisLine={false}
                      interval={Math.floor(chartData.length / 6)}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-text-secondary)', fontFamily: 'Manrope' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatNumber}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke="#2874F0"
                      strokeWidth={2.5}
                      fill="url(#viewsGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#2874F0', strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="likes"
                      name="Likes"
                      stroke="#22C55E"
                      strokeWidth={2}
                      fill="url(#likesGrad)"
                      dot={false}
                      activeDot={{ r: 3, fill: '#22C55E', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#E0E0E0]">
              <div className="px-5 py-4 border-b border-[#E0E0E0]">
                <h2 className="text-[15px] font-bold text-[#212121]">
                  Top Performing Content
                </h2>
                <p className="text-xs text-[#878787] mt-0.5">
                  Your best published content
                </p>
              </div>

              <div className="p-2">
                {isLoadingTop ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <div className="skeleton h-4 w-4 rounded" />
                      <div className="skeleton h-8 w-8 rounded-lg" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="skeleton h-3.5 w-40 rounded" />
                        <div className="skeleton h-3 w-24 rounded" />
                      </div>
                    </div>
                  ))
                ) : topContent.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-[#878787]">
                      No published content yet.
                    </p>
                  </div>
                ) : (
                  topContent.map((item, index) => (
                    <TopContentCard key={item.jobId} item={item} index={index} />
                  ))
                )}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-white rounded-2xl border border-[#E0E0E0] h-full">
              <div className="px-5 py-4 border-b border-[#E0E0E0]">
                <h2 className="text-[15px] font-bold text-[#212121]">
                  Platform Distribution
                </h2>
                <p className="text-xs text-[#878787] mt-0.5">
                  Published content by platform
                </p>
              </div>

              <div className="p-5 flex flex-col items-center gap-4">
                {isLoadingPlatform ? (
                  <div className="w-40 h-40 rounded-full skeleton" />
                ) : pieData.every((d) => d.value === 0) ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-[#878787]">
                      No published content yet.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [formatNumber(value), 'Posts']}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                          <span className="text-xs text-[#878787] font-medium">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {platformData && (
                  <div className="w-full flex flex-col gap-3">
                    {[
                      {
                        platform: 'YouTube',
                        icon: Youtube,
                        color: 'text-[#EF4444]',
                        bg: 'bg-[#EF4444]/10',
                        value: platformData.youtube?.published || 0,
                      },
                      {
                        platform: 'Instagram',
                        icon: Instagram,
                        color: 'text-[#F59E0B]',
                        bg: 'bg-[#F59E0B]/10',
                        value: platformData.instagram?.published || 0,
                      },
                    ].map((item) => (
                      <div
                        key={item.platform}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center',
                              item.bg
                            )}
                          >
                            <item.icon className={cn('w-3.5 h-3.5', item.color)} />
                          </div>
                          <span className="text-sm font-semibold text-[#212121]">
                            {item.platform}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-[#212121]">
                          {item.value} posts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}