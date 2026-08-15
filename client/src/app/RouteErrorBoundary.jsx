import { Component } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/utils/constants'

export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Route error:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="bg-canvas flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="border-error/20 bg-error-light mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border">
            <AlertTriangle className="text-error h-6 w-6" aria-hidden="true" />
          </div>

          <h1 className="text-foreground mb-2 text-2xl font-extrabold tracking-tight">
            This page hit an unexpected error
          </h1>
          <p className="text-foreground-muted mx-auto mb-8 max-w-sm text-sm leading-relaxed">
            Something went wrong while rendering this page. Reload to continue, or head
            back to your dashboard.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button onClick={() => window.location.reload()}>Reload page</Button>
            <Button variant="secondary" asChild>
              <Link to={ROUTES.DASHBOARD}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
