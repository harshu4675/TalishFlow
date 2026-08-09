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
import { BarChart3 } from 'lucide-react'
import { apiClient } from '@/services/api'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/formatters'

const PERIODS = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
]

async function fetchChartData(period) {
  const response = await apiClient.get(`/analytics/charts?period=${period}`)
  return response.data.data
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-float px-4 py-3">
      <p className="text-xs font-semibold text-[#878787] mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-[#878787] capitalize">{entry.name}:</span>
          <span className="text-xs font-bold text-[#212121]">
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
    queryKey: ['analytics', 'charts', period],
    queryFn: () => fetchChartData(period),
    staleTime: 1000 * 60 * 5,
  })

  const chartData = data?.views || []
  const hasData = chartData.some((d) => d.views > 0 || d.clips > 0)

  return (
    <div className="bg-white rounded-2xl border border-[#E0E0E0] p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[15px] font-bold text-[#212121]">Performance</h2>
          <p className="text-xs text-[#878787] mt-0.5">
            Views, clips, and engagement over time
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#F8F9FA] rounded-xl p-1 gap-1">
            {[
              { key: 'views', label: 'Views' },
              { key: 'clips', label: 'Clips' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveChart(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                  activeChart === tab.key
                    ? 'bg-white text-[#212121] shadow-sm'
                    : 'text-[#878787] hover:text-[#212121]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#F8F9FA] rounded-xl p-1 gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                  period === p.value
                    ? 'bg-white text-[#212121] shadow-sm'
                    : 'text-[#878787] hover:text-[#212121]'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        {isLoading ? (
          <div className="h-full w-full skeleton rounded-xl" />
        ) : !hasData ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F8F9FA] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#878787]" />
            </div>
            <p className="text-sm text-[#878787] font-medium text-center">
              No data yet. Upload your first video to see analytics.
            </p>
          </div>
        ) : activeChart === 'views' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2874F0" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2874F0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 11,
                  fill: 'var(--color-text-secondary)',
                  fontFamily: 'Manrope',
                }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(chartData.length / 5)}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: 'var(--color-text-secondary)',
                  fontFamily: 'Manrope',
                }}
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
                fill="url(#viewsGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#2874F0', strokeWidth: 0 }}
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
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 11,
                  fill: 'var(--color-text-secondary)',
                  fontFamily: 'Manrope',
                }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(chartData.length / 5)}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: 'var(--color-text-secondary)',
                  fontFamily: 'Manrope',
                }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="clips"
                name="Clips"
                fill="#2874F0"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}