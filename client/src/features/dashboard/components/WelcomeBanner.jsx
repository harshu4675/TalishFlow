import { useMemo } from 'react'
import { Upload, Link2, ArrowRight, Zap, CheckCircle2 } from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import StatusIndicator from '@/components/common/StatusIndicator'
import { Button } from '@/components/ui/button'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function WelcomeBanner() {
  const { user } = useAuthContext()
  const firstName = user?.name?.split(' ')[0] || 'Creator'

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    []
  )

  const openUpload = (tab = 'upload') => {
    window.dispatchEvent(new CustomEvent('talishflow:open-upload', { detail: { tab } }))
  }

  return (
    <section className="gradient-mesh border-border bg-surface shadow-card relative overflow-hidden rounded-2xl border">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(600px 220px at 12% 0%, var(--tf-primary-glow), transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block"
        style={{
          backgroundImage:
            'radial-gradient(420px 200px at 85% 110%, var(--tf-accent-light), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span className="border-border bg-surface/80 text-foreground-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold">
              <Zap
                className="text-accent h-3 w-3"
                fill="currentColor"
                aria-hidden="true"
              />
              Creator Studio
            </span>
            <StatusIndicator
              tone="success"
              label="All systems operational"
              pulse={false}
            />
          </div>

          <h1 className="text-foreground text-2xl font-extrabold tracking-tight text-balance sm:text-[28px]">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-foreground-muted mt-1.5 max-w-md text-sm leading-relaxed">
            {dateLabel}. Your content is ready when you are — upload a video or check how
            your latest shorts are performing.
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row xl:items-center">
          <Button onClick={() => openUpload('upload')} size="lg">
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload video
          </Button>
          <Button variant="secondary" size="lg" onClick={() => openUpload('youtube-url')}>
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Import from YouTube
          </Button>
        </div>
      </div>

      <div className="border-border-subtle bg-surface/50 relative flex flex-wrap items-center gap-x-6 gap-y-2 border-t px-6 py-3 sm:px-7">
        <span className="text-foreground-muted inline-flex items-center gap-1.5 text-[11px] font-semibold">
          <CheckCircle2 className="text-success h-3.5 w-3.5" aria-hidden="true" />
          Files auto-delete after 24h
        </span>
        <span className="text-foreground-muted inline-flex items-center gap-1.5 text-[11px] font-semibold">
          <ArrowRight className="text-primary h-3.5 w-3.5" aria-hidden="true" />
          AI detects the best moments in every upload
        </span>
      </div>
    </section>
  )
}
