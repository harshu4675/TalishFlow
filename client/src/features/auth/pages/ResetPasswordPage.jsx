import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import ResetPasswordForm from '../components/ResetPasswordForm'
import authService from '@/services/authService'
import { useNotificationContext } from '@/contexts/NotificationContext'
import { ROUTES } from '@/utils/constants'
import { motion } from 'framer-motion'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [tokenError, setTokenError] = useState(false)
  const { success, error } = useNotificationContext()

  const handleSubmit = async (data) => {
    setIsLoading(true)
    try {
      await authService.resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      })
      setIsSuccess(true)
      success('Password reset!', 'Your password has been changed successfully.')
      setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 3000)
    } catch (err) {
      if (err.response?.status === 400) {
        setTokenError(true)
      } else {
        error('Reset failed', 'Unable to reset password. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenError) {
    return (
      <div className="flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-4 text-center"
        >
          <div className="bg-error/10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
            <AlertTriangle className="text-error h-6 w-6" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-bold">Link expired</h3>
          <p className="text-foreground-muted mb-6 text-sm leading-relaxed">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="bg-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all"
          >
            Request new link
          </Link>
        </motion.div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-4 text-center"
      >
        <div className="bg-success/10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
          <CheckCircle2 className="text-success h-6 w-6" />
        </div>
        <h3 className="text-foreground mb-2 text-lg font-bold">Password reset!</h3>
        <p className="text-foreground-muted text-sm">Redirecting you to sign in...</p>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-foreground text-[28px] font-extrabold tracking-tight">
          Reset your password
        </h1>
        <p className="text-foreground-muted text-sm">
          Create a strong new password for your account.
        </p>
      </div>

      <ResetPasswordForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
