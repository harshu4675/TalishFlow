import { memo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
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
  TrendingUp,
  Clock,
  ExternalLink,
  Youtube,
  Instagram,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react'
import { apiClient } from '@/services/api'
import PageHeader from '@/components/common/PageHeader'
import MetricCard from '@/components/common/MetricCard'
import ChartCard from '@/components/common/ChartCard'
import EmptyState from '@/components/common/EmptyState'
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

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="border-border bg-surface shadow-popover rounded-xl border px-3.5 py-2.5">
      <p className="text-foreground-muted mb-1.5 text-xs font-semibold">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-foreground-muted text-xs capitalize">{entry.name}:</span>
          <span className="text-foreground text-xs font-bold">
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

const TopContentCard = memo(function TopContentCard({ item, index }) {
  const PLATFORM_ICONS = {
    youtube: { icon: Youtube, color: 'text-error', bg: 'bg-error-light' },
    instagram: { icon: Instagram, color: 'text-warning', bg: 'bg-warning-light' },
  }

  const platform = PLATFORM_ICONS[item.platform]
  const PlatformIcon = platform?.icon

  return (
    <div className="group hover:bg-surface-muted flex items-center gap-4 rounded-xl p-3 transition-colors">
      <span className="text-foreground-faint w-5 text-center text-sm font-black">
        {index + 1}
      </span>

      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
          platform?.bg || 'bg-surface-muted'
        )}
      >
        {PlatformIcon && (
          <PlatformIcon
            className={cn('h-4 w-4', platform?.color || 'text-foreground-muted')}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">
          {item.title || 'Untitled'}
        </p>
        <p className="text-foreground-faint mt-0.5 text-xs">
          {formatRelativeTime(item.publishedAt)}
        </p>
      </div>

      {item.platformVideoUrl && (
        <a
          href={item.platformVideoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground-faint hover:text-primary hover:bg-surface-muted rounded-lg p-1.5 opacity-0 transition-all group-hover:opacity-100"
          aria-label="View on platform"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  )
})
TopContentCard.displayName = 'TopContentCard'

const PIE_COLORS = [
  'var(--tf-primary)',
  'var(--tf-warning)',
  'var(--tf-success)',
  'var(--tf-error)',
]

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
  const hasChartData = chartData.some((d) => d.views > 0 || d.likes > 0)

  const pieData = platformData
    ? [
        { name: 'YouTube', value: platformData.youtube?.published || 0 },
        { name: 'Instagram', value: platformData.instagram?.published || 0 },
      ]
    : []

  const METRIC_CARDS = [
    { icon: Eye, label: 'Total Views', value: overview?.totals?.views },
    { icon: ThumbsUp, label: 'Total Likes', value: overview?.totals?.likes },
    { icon: MessageSquare, label: 'Comments', value: overview?.totals?.comments },
    { icon: Share2, label: 'Shares', value: overview?.totals?.shares },
    {
      icon: TrendingUp,
      label: 'Engagement Rate',
      value: overview?.totals?.engagementRate,
      context: 'likes + comments + shares',
    },
    {
      icon: Clock,
      label: 'Watch Time',
      value: overview?.totals?.watchTimeMinutes,
      context: 'minutes',
    },
  ]

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-5 lg:p-7">
      <div className="flex flex-col gap-5 lg:gap-6">
        <PageHeader
          title="Analytics"
          description="Track your content performance across all platforms."
          actions={
            <div
              role="group"
              aria-label="Date range"
              className="bg-surface-muted flex items-center gap-0.5 rounded-lg p-0.5"
            >
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                    'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
                    period === p.value
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                  )}
                  aria-pressed={period === p.value}
                >
                  {p.label}
                </button>
              ))}
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {METRIC_CARDS.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              icon={card.icon}
              value={card.value}
              context={card.context}
              isLoading={isLoadingOverview}
            />
          ))}
        </div>

        <ChartCard
          title="Views Over Time"
          description="Daily views and likes"
          isLoading={isLoadingOverview}
          loadingHeight={260}
        >
          <div className="h-[260px] w-full">
            {!hasChartData ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="bg-surface-muted flex h-12 w-12 items-center justify-center rounded-2xl">
                  <BarChart3
                    className="text-foreground-faint h-5 w-5"
                    aria-hidden="true"
                  />
                </div>
                <div className="text-center">
                  <p className="text-foreground text-sm font-bold">
                    No view data for this period
                  </p>
                  <p className="text-foreground-muted mt-0.5 text-xs">
                    Publish content to start tracking daily performance.
                  </p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--tf-primary)"
                        stopOpacity={0.18}
                      />
                      <stop offset="95%" stopColor="var(--tf-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--tf-success)"
                        stopOpacity={0.14}
                      />
                      <stop offset="95%" stopColor="var(--tf-success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--tf-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fontSize: 11,
                      fill: 'var(--tf-foreground-muted)',
                      fontFamily: 'Manrope',
                    }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(Math.floor(chartData.length / 6), 0)}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: 'var(--tf-foreground-muted)',
                      fontFamily: 'Manrope',
                    }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={formatNumber}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: 'var(--tf-border)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Views"
                    stroke="var(--tf-primary)"
                    strokeWidth={2.5}
                    fill="url(#viewsGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--tf-primary)', strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="likes"
                    name="Likes"
                    stroke="var(--tf-success)"
                    strokeWidth={2}
                    fill="url(#likesGrad)"
                    dot={false}
                    activeDot={{ r: 3, fill: 'var(--tf-success)', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-2">
            <div className="border-border bg-surface shadow-card h-full rounded-2xl border">
              <div className="border-border-subtle border-b px-5 py-4">
                <h2 className="text-foreground text-[15px] font-bold">
                  Top Performing Content
                </h2>
                <p className="text-foreground-muted mt-0.5 text-xs">
                  Your best published content
                </p>
              </div>

              <div className="p-2">
                {isLoadingTop ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <div className="skeleton h-4 w-4 rounded" />
                      <div className="skeleton h-8 w-8 rounded-lg" />
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="skeleton h-3.5 w-40 rounded" />
                        <div className="skeleton h-3 w-24 rounded" />
                      </div>
                    </div>
                  ))
                ) : topContent.length === 0 ? (
                  <EmptyState
                    compact
                    icon={BarChart3}
                    title="No published content yet"
                    description="Once you publish your first clip, your top performers will appear here."
                    action={{
                      label: 'Upload a video',
                      onClick: () =>
                        window.dispatchEvent(new CustomEvent('talishflow:open-upload')),
                    }}
                  />
                ) : (
                  topContent.map((item, index) => (
                    <TopContentCard key={item.jobId} item={item} index={index} />
                  ))
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="border-border bg-surface shadow-card h-full rounded-2xl border">
              <div className="border-border-subtle border-b px-5 py-4">
                <h2 className="text-foreground text-[15px] font-bold">
                  Platform Distribution
                </h2>
                <p className="text-foreground-muted mt-0.5 text-xs">
                  Published content by platform
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 p-5">
                {isLoadingPlatform ? (
                  <div className="skeleton h-40 w-40 rounded-full" />
                ) : pieData.every((d) => d.value === 0) ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="bg-surface-muted flex h-12 w-12 items-center justify-center rounded-2xl">
                      <PieChartIcon
                        className="text-foreground-faint h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-bold">
                        Nothing published yet
                      </p>
                      <p className="text-foreground-muted mt-0.5 text-xs">
                        Platform split appears once you publish.
                      </p>
                    </div>
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
                        stroke="var(--tf-surface)"
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatNumber(value), 'Posts']} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                          <span className="text-foreground-muted text-xs font-medium">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {platformData && (
                  <div className="flex w-full flex-col gap-3">
                    {[
                      {
                        platform: 'YouTube',
                        icon: Youtube,
                        color: 'text-error',
                        bg: 'bg-error-light',
                        value: platformData.youtube?.published || 0,
                      },
                      {
                        platform: 'Instagram',
                        icon: Instagram,
                        color: 'text-warning',
                        bg: 'bg-warning-light',
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
                              'flex h-7 w-7 items-center justify-center rounded-lg',
                              item.bg
                            )}
                          >
                            <item.icon
                              className={cn('h-3.5 w-3.5', item.color)}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="text-foreground text-sm font-semibold">
                            {item.platform}
                          </span>
                        </div>
                        <span className="text-foreground text-sm font-bold">
                          {item.value} posts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
