import { Link } from 'react-router-dom'
import { Compass, ArrowLeft, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/utils/constants'
import PageTitle from '@/components/common/PageTitle'

export default function NotFoundPage() {
  return (
    <div className="bg-canvas flex min-h-[100dvh] items-center justify-center p-6">
      <PageTitle title="Page not found" />
      <div className="w-full max-w-md text-center">
        <div className="gradient-primary shadow-primary/25 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
          <Zap className="h-8 w-8 text-white" fill="white" aria-hidden="true" />
        </div>

        <p className="text-primary mb-2 text-sm font-bold tracking-wider uppercase">
          404
        </p>
        <h1 className="text-foreground mb-2 text-3xl font-extrabold tracking-tight">
          This page doesn't exist
        </h1>
        <p className="text-foreground-muted mx-auto mb-8 max-w-sm text-sm leading-relaxed">
          The page you're looking for may have been moved or removed. Let's get you back
          on track.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link to={ROUTES.DASHBOARD}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to dashboard
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to={ROUTES.LOGIN}>
              <Compass className="h-4 w-4" aria-hidden="true" />
              Go to sign in
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
