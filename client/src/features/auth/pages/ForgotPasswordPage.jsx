import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import ForgotPasswordForm from '../components/ForgotPasswordForm'
import authService from '../services/authService'
import { useNotificationContext } from '@/context/NotificationContext'
import { ROUTES } from '@/utils/constants'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { error } = useNotificationContext()

  const handleSubmit = async (data) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(data.email)
      setIsSuccess(true)
    } catch {
      error('Request failed', 'Unable to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Link
          to={ROUTES.LOGIN}
          className="text-foreground-muted hover:text-foreground mb-2 flex w-fit items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
        <h1 className="text-foreground text-[28px] font-extrabold tracking-tight">
          Forgot password?
        </h1>
        {!isSuccess && (
          <p className="text-foreground-muted text-sm leading-relaxed">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        )}
      </div>

      <ForgotPasswordForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isSuccess={isSuccess}
      />
    </div>
  )
}
