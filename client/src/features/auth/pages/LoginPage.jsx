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
    const oauthError = searchParams.get('error')
    if (oauthError === 'oauth_failed') {
      showError('Sign in failed', 'OAuth sign-in was unsuccessful. Please try again.')
    }
  }, [])

  const handleLogin = async (data) => {
    await loginWithFeedback(data)
  }

  return (
    <div className="flex flex-col gap-8">
      <PageTitle title="Sign in" />

      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#E7F1FE] px-3 py-1">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2874F0]" />
          <span className="text-xs font-semibold text-[#2874F0]">Welcome back</span>
        </div>

        <h1
          className="leading-tight font-extrabold tracking-tight text-[#212121]"
          style={{ fontSize: 'clamp(28px, 3vw, 36px)' }}
        >
          Sign in to your account
        </h1>

        <p className="text-sm text-[#878787]">
          New to TalishFlow?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="font-semibold text-[#2874F0] transition-colors hover:text-[#1B5FCC]"
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
          className="text-sm font-medium text-[#878787] transition-colors hover:text-[#2874F0]"
        >
          Forgot your password?
        </Link>
      </div>
    </div>
  )
}
