import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import ResetPasswordForm from '../components/ResetPasswordForm'
import authService from '../services/authService'
import { useNotificationContext } from '@/context/NotificationContext'
import { ROUTES } from '@/utils/constants'

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
          className="text-center py-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
          </div>
          <h3 className="text-lg font-bold text-[#212121] mb-2">Link expired</h3>
          <p className="text-[#878787] text-sm leading-relaxed mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2874F0] text-white text-sm font-semibold hover:bg-[#1B5FCC] transition-all"
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
        className="text-center py-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-6 h-6 text-[#22C55E]" />
        </div>
        <h3 className="text-lg font-bold text-[#212121] mb-2">Password reset!</h3>
        <p className="text-[#878787] text-sm">
          Redirecting you to sign in...
        </p>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-extrabold text-[#212121] tracking-tight">
          Reset your password
        </h1>
        <p className="text-[#878787] text-sm">
          Create a strong new password for your account.
        </p>
      </div>

      <ResetPasswordForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}