import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/useMediaQuery'
import useProcessing from '@/features/processing/hooks/useProcessing'
import useLocalStorage from '@/hooks/useLocalStorage'

function ProcessingListener() {
  useProcessing()
  return null
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed] = useLocalStorage('talishflow_sidebar_collapsed', false)
  const isMobile = useIsMobile()
  const location = useLocation()

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [location.pathname, isMobile])

  const sidebarWidth = collapsed ? 72 : 248

  return (
    <TooltipProvider delayDuration={200}>
      <div className="bg-canvas flex min-h-dvh">
        <ProcessingListener />

        <div
          className="hidden flex-shrink-0 transition-[width] duration-200 lg:block"
          style={{ width: sidebarWidth }}
        >
          <div
            className="z-fixed fixed top-0 left-0 h-dvh"
            style={{ width: sidebarWidth }}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>

        <AnimatePresence>
          {sidebarOpen && isMobile && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="z-modal-backdrop bg-overlay fixed inset-0 backdrop-blur-sm lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="z-modal fixed top-0 left-0 h-dvh lg:hidden"
              >
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 overflow-x-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
