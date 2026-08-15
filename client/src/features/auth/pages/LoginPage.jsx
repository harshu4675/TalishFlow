import { Link, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import LoginForm from '../components/LoginForm'
import OAuthButtons from '../components/OAuthButtons'
import useAuth from '../hooks/useAuth'
import { useNotificationContext } from '@/context/NotificationContext'
import { ROUTES } from '@/utils/constants'
import PageTitle from '@/components/common/PageTitle'

export default function LoginPage() {
  const { loginWithFeedback, isLoading } = useAuth()
  const { error: showError } = useNotificationContext()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('error') === 'oauth_failed') {
      showError('Sign in failed', 'OAuth sign-in was unsuccessful. Please try again.')
    }
  }, [searchParams, showError])

  const handleLogin = async (data) => {
    await loginWithFeedback(data)
  }

  return (
    <div className="flex flex-col gap-8">
      <PageTitle title="Sign in" />

      <div className="flex flex-col gap-3">
        <div className="bg-primary-light inline-flex w-fit items-center gap-2 rounded-full px-3 py-1">
          <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
          <span className="text-primary text-xs font-semibold">Welcome back</span>
        </div>

        <h1
          className="text-foreground leading-tight font-extrabold tracking-tight"
          style={{ fontSize: 'clamp(28px, 3vw, 36px)' }}
        >
          Sign in to your account
        </h1>

        <p className="text-foreground-muted text-sm">
          New to TalishFlow?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="text-primary hover:text-primary-hover font-semibold transition-colors"
          >
            Create account
          </Link>
        </p>
      </div>

      <OAuthButtons isLoading={isLoading} />

      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

      <div className="text-center">
        <Link
          to={ROUTES.FORGOT_PASSWORD}
          className="text-foreground-muted hover:text-primary text-sm font-medium transition-colors"
        >
          Forgot your password?
        </Link>
      </div>
    </div>
  )
}
