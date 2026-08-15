import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { BarChart3, Upload } from 'lucide-react'
import { analyticsService } from '@/services/analyticsService'
import { queryKeys } from '@/utils/queryKeys'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/formatters'
import ChartCard from '@/components/common/ChartCard'
import { Button } from '@/components/ui/button'

const PERIODS = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
]

const CHART_TABS = [
  { key: 'views', label: 'Views' },
  { key: 'clips', label: 'Clips' },
]

function SegmentedControl({ options, value, onChange, ariaLabel }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="bg-surface-muted flex items-center gap-0.5 rounded-lg p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value || option.key}
          onClick={() => onChange(option.value || option.key)}
          className={cn(
            'rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-150',
            'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
            value === option.value || value === option.key
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-foreground-muted hover:text-foreground'
          )}
          aria-pressed={value === option.value || value === option.key}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
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

export default function DashboardCharts() {
  const [period, setPeriod] = useState('30d')
  const [activeChart, setActiveChart] = useState('views')

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.charts(period),
    queryFn: () => analyticsService.getCharts(period),
    staleTime: 1000 * 60 * 5,
  })

  const chartData = data?.views || []
  const hasData = chartData.some((d) => d.views > 0 || d.clips > 0)

  const openUpload = () => {
    window.dispatchEvent(new CustomEvent('talishflow:open-upload'))
  }

  return (
    <ChartCard
      title="Performance"
      description="Views and clips over time"
      isLoading={isLoading}
      loadingHeight={260}
      actions={
        <>
          <SegmentedControl
            ariaLabel="Chart metric"
            options={CHART_TABS}
            value={activeChart}
            onChange={setActiveChart}
          />
          <SegmentedControl
            ariaLabel="Date range"
            options={PERIODS}
            value={period}
            onChange={setPeriod}
          />
        </>
      }
    >
      <div className="h-[260px] w-full">
        {!hasData ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="bg-surface-muted flex h-12 w-12 items-center justify-center rounded-2xl">
              <BarChart3 className="text-foreground-faint h-5 w-5" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-foreground text-sm font-bold">No performance data yet</p>
              <p className="text-foreground-muted mt-0.5 text-xs">
                Upload your first video to see views and clip metrics.
              </p>
            </div>
            <Button size="sm" onClick={openUpload}>
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              Upload a video
            </Button>
          </div>
        ) : activeChart === 'views' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--tf-primary)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--tf-primary)" stopOpacity={0} />
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
                content={<CustomTooltip />}
                cursor={{ stroke: 'var(--tf-border)' }}
              />
              <Area
                type="monotone"
                dataKey="views"
                name="Views"
                stroke="var(--tf-primary)"
                strokeWidth={2.5}
                fill="url(#viewsGradient)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--tf-primary)', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
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
                content={<CustomTooltip />}
                cursor={{ fill: 'var(--tf-surface-muted)' }}
              />
              <Bar
                dataKey="clips"
                name="Clips"
                fill="var(--tf-primary)"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  )
}
