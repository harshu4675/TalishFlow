import { motion } from 'framer-motion'
import { Sparkles, TrendingUp } from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import AnalyticsCards from '../components/AnalyticsCards'
import ProcessingQueue from '../components/ProcessingQueue'
import RecentUploads from '../components/RecentUploads'
import RecentClips from '../components/RecentClips'
import ScheduledPosts from '../components/ScheduledPosts'
import QuickActions from '../components/QuickActions'
import StorageUsage from '../components/StorageUsage'
import DashboardCharts from '../components/DashboardCharts'
import { useDashboard } from '../hooks/useDashboard'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function DashboardPage() {
  const { user } = useAuthContext()
  const { stats, isLoadingStats } = useDashboard()

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = user?.name?.split(' ')[0] || 'Creator'

  return (
    <div className="mx-auto max-w-[1440px] p-5 lg:p-7 xl:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6 lg:gap-7"
      >
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2874F0] via-[#1B5FCC] to-[#0A3A8C] p-6 shadow-xl shadow-[#2874F0]/20 lg:p-8">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                radial-gradient(at 20% 30%, rgba(251, 100, 27, 0.4) 0px, transparent 40%),
                radial-gradient(at 80% 70%, rgba(255, 159, 0, 0.3) 0px, transparent 40%)
              `,
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: `
                linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
              `,
                backgroundSize: '32px 32px',
              }}
            />

            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5 text-[#FF9F00]" fill="#FF9F00" />
                  <span className="text-xs font-bold tracking-wide text-white/90">
                    DASHBOARD OVERVIEW
                  </span>
                </div>

                <h1
                  className="leading-tight font-black text-balance text-white"
                  style={{ fontSize: 'clamp(24px, 3vw, 34px)' }}
                >
                  {greeting()}, {firstName}
                </h1>
                <p className="mt-1 max-w-md text-sm text-white/75">
                  Here's what's happening with your content today. Keep creating!
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm lg:flex">
                  <TrendingUp className="h-4 w-4 text-[#FF9F00]" />
                  <span className="text-sm font-bold text-white">
                    All systems operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <QuickActions />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AnalyticsCards stats={stats} isLoading={isLoadingStats} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <DashboardCharts />
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <RecentUploads />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StorageUsage />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div variants={itemVariants}>
            <RecentClips />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ScheduledPosts />
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <ProcessingQueue />
        </motion.div>
      </motion.div>
    </div>
  )
}
