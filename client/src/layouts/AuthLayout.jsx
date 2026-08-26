import { Outlet, Link } from 'react-router-dom'
import { Scissors, TrendingUp, Upload, Radio } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { ROUTES } from '@/utils/constants'

const FEATURES = [
  {
    icon: Scissors,
    title: 'Auto clip detection',
    description: 'AI finds the best moments in every upload',
  },
  {
    icon: TrendingUp,
    title: 'Performance analytics',
    description: 'Views, engagement and watch time in one place',
  },
  {
    icon: Upload,
    title: 'Resumable uploads',
    description: 'Large files upload reliably with chunking',
  },
  {
    icon: Radio,
    title: 'One-click publishing',
    description: 'Ship to YouTube and Instagram from the editor',
  },
]

export default function AuthLayout() {
  return (
    <div className="bg-canvas flex min-h-dvh">
      <div className="relative hidden overflow-hidden lg:flex lg:w-[52%] xl:w-[55%]">
        <div className="gradient-mesh absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(720px 320px at 20% 0%, var(--tf-primary-glow), transparent 60%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-14">
          <Link to={ROUTES.DASHBOARD} className="group flex w-fit items-center gap-3">
            <Logo className="h-10 w-10 transition-transform duration-300 group-hover:scale-105" />
            <span className="text-foreground text-xl font-extrabold tracking-tight">
              TalishFlow
            </span>
          </Link>

          <div className="max-w-[480px]">
            <h1 className="text-foreground text-4xl leading-[1.1] font-black tracking-[-0.03em] text-balance">
              Turn long videos into{' '}
              <span className="gradient-text">shorts that perform</span>
            </h1>
            <p className="text-foreground-muted mt-4 max-w-md text-[15px] leading-relaxed">
              TalishFlow detects the engaging moments in your content, generates
              ready-to-publish vertical clips, and distributes them across your platforms.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="border-border bg-surface/70 flex items-start gap-3 rounded-xl border p-3.5 backdrop-blur-sm"
                  >
                    <div className="bg-primary-light text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-bold">{feature.title}</p>
                      <p className="text-foreground-muted mt-0.5 text-xs leading-snug">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-foreground-faint text-xs font-medium">
            Creator Studio · Your content stays yours — files auto-delete after 24 hours.
          </p>
        </div>
      </div>

      <div className="bg-surface flex flex-1 flex-col">
        <div className="border-border-subtle flex items-center gap-3 border-b p-5 lg:hidden">
          <Logo className="h-9 w-9" />
          <span className="text-foreground text-lg font-extrabold tracking-tight">
            TalishFlow
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[420px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
