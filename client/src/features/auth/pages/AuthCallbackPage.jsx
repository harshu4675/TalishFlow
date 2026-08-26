import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import PageTitle from '@/components/common/PageTitle'
import { useAuthContext } from '@/contexts/AuthContext'
import { ROUTES } from '@/utils/constants'

const OAUTH_ERROR_MESSAGES = {
  oauth_cancelled: {
    title: 'Sign-in cancelled',
    body: 'You cancelled the Google authorization. Nothing was changed — you can try again whenever you are ready.',
  },
  oauth_denied: {
    title: 'Authorization declined',
    body: 'Google declined the authorization request. If this keeps happening, check that your Google account is allowed to use this app.',
  },
  oauth_invalid_state: {
    title: 'Sign-in session expired',
    body: 'The authorization session expired or was invalid. This can happen if you wait too long or open an old link. Start again from the sign-in page.',
  },
  oauth_missing_code: {
    title: 'Incomplete authorization',
    body: 'The authorization response from Google was incomplete. Please try signing in again.',
  },
  oauth_failed: {
    title: 'Sign-in failed',
    body: 'We could not complete the sign-in with Google. Please try again in a moment.',
  },
}

/**
 * Landing target for the backend OAuth redirect.
 *
 * Contract with the backend:
 *   /auth/callback?token=...&status=success   → store token (memory), load user, go to dashboard
 *   /auth/callback?error=CODE&details=...     → show a friendly, actionable error
 *
 * The token is held in memory only — never localStorage, never a cookie.
 */
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { reloadUser, isAuthenticated } = useAuthContext()
  const [phase, setPhase] = useState('processing')
  const [errorInfo, setErrorInfo] = useState(null)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const token = searchParams.get('token')
    const error = searchParams.get('error')
    const details = searchParams.get('details')

    if (error || !token) {
      const mapping = OAUTH_ERROR_MESSAGES[error] || OAUTH_ERROR_MESSAGES.oauth_failed
      setErrorInfo({
        code: error || 'oauth_failed',
        title: mapping.title,
        body: details || mapping.body,
      })
      setPhase('error')
      return
    }

    // Persist the access token in memory before pinging /me.
    window.__talishflow_access_token__ = token
    setPhase('loading-user')

    reloadUser()
      .then(() => {
        setPhase('done')
      })
      .catch(() => {
        window.__talishflow_access_token__ = null
        setErrorInfo({
          code: 'oauth_failed',
          title: 'Could not finish sign-in',
          body: 'We validated your Google account but could not load your TalishFlow profile. Check your connection and try again.',
        })
        setPhase('error')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase === 'done' && isAuthenticated) {
      const destination = searchParams.get('next') || ROUTES.DASHBOARD

      // Clean the URL (remove the token from history) then navigate.
      window.history.replaceState(null, '', ROUTES.DASHBOARD)
      navigate(destination, { replace: true })
    }
  }, [phase, isAuthenticated, navigate, searchParams])

  return (
    <div className="bg-canvas flex min-h-dvh items-center justify-center p-6">
      <PageTitle title="Signing you in" />
      <div className="w-full max-w-md">
        <div className="bg-surface shadow-card border-border rounded-3xl border p-8 text-center">
          <Logo className="mx-auto mb-6 h-12 w-12" />

          {phase === 'error' ? (
            <div role="alert" aria-live="assertive">
              <div className="border-error/20 bg-error-light mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border">
                <XCircle className="text-error h-7 w-7" aria-hidden="true" />
              </div>
              <h1 className="text-foreground mb-2 text-xl font-extrabold tracking-tight">
                {errorInfo.title}
              </h1>
              <p className="text-foreground-muted mx-auto mb-7 max-w-sm text-sm leading-relaxed">
                {errorInfo.body}
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild>
                  <Link to={ROUTES.LOGIN}>
                    Back to sign in
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link to={ROUTES.SETTINGS_ACCOUNTS}>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Connected accounts
                  </Link>
                </Button>
              </div>
            </div>
          ) : phase === 'done' ? (
            <div aria-live="polite">
              <div className="border-success/20 bg-success-light mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border">
                <CheckCircle2 className="text-success h-7 w-7" aria-hidden="true" />
              </div>
              <h1 className="text-foreground mb-2 text-xl font-extrabold tracking-tight">
                You're signed in
              </h1>
              <p className="text-foreground-muted text-sm">
                Redirecting you to your dashboard…
              </p>
            </div>
          ) : (
            <div role="status" aria-live="polite">
              <div className="tf-loader-bar mx-auto mb-6 h-1.5 w-40 overflow-hidden rounded-full">
                <span />
              </div>
              <h1 className="text-foreground mb-2 text-xl font-extrabold tracking-tight">
                {phase === 'loading-user'
                  ? 'Just a moment…'
                  : 'Completing Google sign-in…'}
              </h1>
              <p className="text-foreground-muted text-sm">
                {phase === 'loading-user'
                  ? 'Loading your workspace.'
                  : 'Securely verifying your account.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
