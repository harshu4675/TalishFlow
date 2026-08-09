import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Shield, LogOut } from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import { useNotificationContext } from '@/context/NotificationContext'
import authService from '@/features/auth/services/authService'
import { cn } from '@/utils/cn'

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function SecuritySettings() {
  const { logout } = useAuthContext()
  const { success, error } = useNotificationContext()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setIsSaving(true)
    try {
      await authService.changePassword(data)
      success('Password changed', 'Your password has been updated. Please sign in again.')
      reset()
      setTimeout(() => logout(), 2000)
    } catch (err) {
      error('Change failed', err.userMessage || 'Failed to change password.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true)
    try {
      await authService.logoutAll()
      success('Signed out', 'All devices have been signed out.')
      logout()
    } catch {
      error('Failed', 'Could not sign out all devices.')
    } finally {
      setIsLoggingOutAll(false)
    }
  }

  const inputClass = (hasError) =>
    cn(
      'w-full px-4 py-3 rounded-xl text-sm pr-11',
      'bg-[#F8F9FA] border transition-all duration-150',
      'text-[#212121] placeholder:text-[#878787]',
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-[#2874F0]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      hasError
        ? 'border-[#FF6161] focus:ring-danger/30 focus:border-[#FF6161]'
        : 'border-[#E0E0E0] hover:border-[#2874F0]/30'
    )

  return (
    <div>
      <div className="px-6 py-5 border-b border-[#E0E0E0]">
        <h2 className="text-[15px] font-bold text-[#212121]">Security</h2>
        <p className="text-xs text-[#878787] mt-0.5">
          Manage your password and active sessions.
        </p>
      </div>

      <div className="px-6 py-6 flex flex-col gap-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-[#2874F0]" aria-hidden="true" />
            <h3 className="text-sm font-bold text-[#212121]">Change Password</h3>
          </div>

          {[
            { id: 'currentPassword', label: 'Current password', show: showCurrent, setShow: setShowCurrent },
            { id: 'newPassword', label: 'New password', show: showNew, setShow: setShowNew },
            { id: 'confirmPassword', label: 'Confirm new password', show: showNew, setShow: setShowNew },
          ].map((field) => (
            <div key={field.id} className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#212121]" htmlFor={field.id}>
                {field.label}
              </label>
              <div className="relative">
                <input
                  id={field.id}
                  type={field.show ? 'text' : 'password'}
                  disabled={isSaving}
                  {...register(field.id)}
                  className={inputClass(!!errors[field.id])}
                />
                <button
                  type="button"
                  onClick={() => field.setShow(!field.show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#878787] hover:text-[#212121] transition-colors"
                  aria-label={field.show ? 'Hide password' : 'Show password'}
                >
                  {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors[field.id] && (
                <p className="text-xs text-[#EF4444] font-medium">
                  {errors[field.id].message}
                </p>
              )}
            </div>
          ))}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl',
                'bg-[#2874F0] hover:bg-[#1B5FCC] text-white text-sm font-semibold',
                'transition-all duration-150 shadow-md shadow-primary/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
              )}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {isSaving ? 'Changing...' : 'Change password'}
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-[#E0E0E0] flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#212121]">Active Sessions</h3>
            <p className="text-xs text-[#878787] mt-1 leading-relaxed">
              Sign out of all devices and sessions. You will need to sign in again on all your devices.
            </p>
          </div>
          <div>
            <button
              onClick={handleLogoutAll}
              disabled={isLoggingOutAll}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                'text-sm font-semibold text-[#EF4444] border border-[#FF6161]/20',
                'hover:bg-[#EF4444]/10 transition-all duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30'
              )}
            >
              {isLoggingOutAll ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="w-4 h-4" aria-hidden="true" />
              )}
              Sign out all devices
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}