import { motion } from 'framer-motion'
import { Upload, Link2, Youtube, Instagram, ArrowRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/utils/constants'

const ACTIONS = [
  {
    label: 'Upload Video',
    description: 'MP4, MOV, MKV up to 5GB',
    icon: Upload,
    gradient: 'from-[#2874F0] to-[#1B5FCC]',
    iconBg: 'bg-[#E7F1FE]',
    iconColor: 'text-[#2874F0]',
    action: 'upload',
  },
  {
    label: 'YouTube URL',
    description: 'Import from YouTube',
    icon: Link2,
    gradient: 'from-[#FB641B] to-[#E8560F]',
    iconBg: 'bg-[#FFF0E6]',
    iconColor: 'text-[#FB641B]',
    action: 'youtube-url',
  },
  {
    label: 'Connect YouTube',
    description: 'Publish to your channel',
    icon: Youtube,
    gradient: 'from-[#FF6161] to-[#E53935]',
    iconBg: 'bg-[#FFEBEE]',
    iconColor: 'text-[#FF6161]',
    action: 'connect-youtube',
  },
  {
    label: 'Connect Instagram',
    description: 'Post Reels automatically',
    icon: Instagram,
    gradient: 'from-[#FF9F00] to-[#F57C00]',
    iconBg: 'bg-[#FFF8E7]',
    iconColor: 'text-[#FF9F00]',
    action: 'connect-instagram',
  },
]

export default function QuickActions() {
  const navigate = useNavigate()

  const handleAction = (action) => {
    switch (action) {
      case 'upload':
      case 'youtube-url':
        window.dispatchEvent(
          new CustomEvent('talishflow:open-upload', { detail: { tab: action } })
        )
        break
      case 'connect-youtube':
      case 'connect-instagram':
        navigate(ROUTES.SETTINGS_ACCOUNTS)
        break
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {ACTIONS.map((action, index) => (
        <motion.button
          key={action.action}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleAction(action.action)}
          className="group relative overflow-hidden rounded-2xl border border-[#E0E0E0] bg-white p-5 text-left shadow-sm transition-all duration-300 hover:shadow-xl"
        >
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100',
              action.gradient
            )}
            style={{ opacity: 0 }}
          />

          <div className="relative flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110 group-hover:rotate-3',
                  action.iconBg
                )}
              >
                <action.icon className={cn('h-5 w-5', action.iconColor)} />
              </div>
              <ArrowRight className="h-4 w-4 text-[#B0B0B0] opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
            </div>

            <div>
              <p className="mb-0.5 text-sm leading-tight font-bold text-[#212121]">
                {action.label}
              </p>
              <p className="text-[11px] leading-snug text-[#878787]">
                {action.description}
              </p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
