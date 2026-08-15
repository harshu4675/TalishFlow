import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/navigation/Sidebar'
import Topbar from '@/components/navigation/Topbar'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/useMediaQuery'
import useProcessing from '@/features/processing/hooks/useProcessing'
import useLocalStorage from '@/hooks/useLocalStorage'

function ProcessingListener() {
  useProcessing()
  return null
}

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useLocalStorage('talishflow_sidebar_collapsed', false)
  const isMobile = useIsMobile()
  const location = useLocation()

  useEffect(() => {
    if (isMobile) setDrawerOpen(false)
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
            <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
          </div>
        </div>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent side="left" className="p-0" hideCloseButton>
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </DrawerContent>
        </Drawer>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setDrawerOpen(true)} />

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
