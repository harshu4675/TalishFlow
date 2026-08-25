import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/Logo'
import { ROUTES } from '@/utils/constants'

const isDev = import.meta.env.DEV

/**
 * Production-grade route error boundary (react-router `errorElement`).
 *
 * Users get a calm, actionable page; technical details only surface in
 * development builds. Render failures from components like Radix Slot no
 * longer bubble into raw "Unexpected Application Error!" screens.
 */
export default function RouteErrorBoundary() {
  const error = useRouteError()

  let title = 'Something went wrong'
  let message = "TalishFlow couldn't load this page. This is usually temporary."

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page not found'
      message = 'The page you are looking for does not exist or was moved.'
    } else if (error.status === 401 || error.status === 403) {
      title = 'Access restricted'
      message = 'You do not have permission to view this page. Try signing in again.'
    } else {
      title = `Error ${error.status}`
      message = error.statusText || message
    }
  }

  if (isDev && error) {
    console.error('[RouteError]', error)
  }

  const retry = () => {
    window.location.reload()
  }

  return (
    <div className="bg-canvas flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <Logo className="mx-auto mb-8 h-12 w-12" />

        <div className="border-warning/20 bg-warning-light mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border">
          <AlertTriangle className="text-warning h-6 w-6" aria-hidden="true" />
        </div>

        <h1 className="text-foreground mb-2 text-2xl font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="text-foreground-muted mx-auto mb-8 max-w-sm text-sm leading-relaxed">
          {message}
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={retry}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button variant="secondary" asChild>
            <Link to={ROUTES.DASHBOARD}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        {isDev && error?.stack ? (
          <details className="border-border bg-surface text-foreground-muted mt-8 max-h-48 overflow-auto rounded-xl border p-4 text-left text-[11px] break-words whitespace-pre-wrap">
            <summary className="text-foreground cursor-pointer text-xs font-bold">
              Developer details
            </summary>
            {String(error.stack || error)}
          </details>
        ) : null}
      </div>
    </div>
  )
}
