import { lazy, Suspense } from 'react'
import WelcomeBanner from '../components/WelcomeBanner'
import AnalyticsCards from '../components/AnalyticsCards'
import ProcessingQueue from '../components/ProcessingQueue'
import RecentUploads from '../components/RecentUploads'
import RecentClips from '../components/RecentClips'
import ScheduledPosts from '../components/ScheduledPosts'
import QuickActions from '../components/QuickActions'
import StorageUsage from '../components/StorageUsage'
import { useDashboard } from '../hooks/useDashboard'

const DashboardCharts = lazy(() => import('../components/DashboardCharts'))

function ChartLoader() {
  return (
    <div className="border-border bg-surface shadow-card rounded-2xl border">
      <div className="border-border-subtle border-b px-5 py-4">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton mt-2 h-3 w-44" />
      </div>
      <div className="p-5">
        <div className="skeleton h-[260px] w-full rounded-xl" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { stats, isLoadingStats } = useDashboard()

  return (
    <div className="mx-auto max-w-[1440px] p-4 sm:p-5 lg:p-7">
      <div className="flex flex-col gap-5 lg:gap-6">
        <WelcomeBanner />

        <QuickActions />

        <AnalyticsCards stats={stats} isLoading={isLoadingStats} />

        <Suspense fallback={<ChartLoader />}>
          <DashboardCharts />
        </Suspense>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentUploads />
          </div>
          <StorageUsage />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <RecentClips />
          <ScheduledPosts />
        </div>

        <ProcessingQueue />
      </div>
    </div>
  )
}
