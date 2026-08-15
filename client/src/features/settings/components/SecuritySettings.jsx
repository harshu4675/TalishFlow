import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Shield, LogOut, Info } from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import { useNotificationContext } from '@/context/NotificationContext'
import authService from '@/features/auth/services/authService'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

function PasswordField({ id, label, show, onToggleShow, disabled, error, register }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          disabled={disabled}
          hasError={!!error}
          className="pr-11"
          {...register(id)}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="text-foreground-faint hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-error text-xs font-medium" role="alert">
          {error.message}
        </p>
      )}
    </div>
  )
}

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

  return (
    <div>
      <div className="border-border-subtle border-b px-6 py-5">
        <h2 className="text-foreground text-[15px] font-bold">Security</h2>
        <p className="text-foreground-muted mt-0.5 text-xs">
          Manage your password and active sessions.
        </p>
      </div>

      <div className="flex flex-col gap-8 px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="bg-primary-light flex h-7 w-7 items-center justify-center rounded-lg">
              <Shield className="text-primary h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="text-foreground text-sm font-bold">Change Password</h3>
          </div>

          <PasswordField
            id="currentPassword"
            label="Current password"
            show={showCurrent}
            onToggleShow={() => setShowCurrent(!showCurrent)}
            disabled={isSaving}
            error={errors.currentPassword}
            register={register}
          />
          <PasswordField
            id="newPassword"
            label="New password"
            show={showNew}
            onToggleShow={() => setShowNew(!showNew)}
            disabled={isSaving}
            error={errors.newPassword}
            register={register}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            show={showNew}
            onToggleShow={() => setShowNew(!showNew)}
            disabled={isSaving}
            error={errors.confirmPassword}
            register={register}
          />

          <div className="flex justify-end">
            <Button type="submit" loading={isSaving}>
              {isSaving ? 'Changing...' : 'Change password'}
            </Button>
          </div>
        </form>

        <div className="border-border-subtle flex flex-col gap-4 border-t pt-6">
          <div className="flex max-w-md flex-col gap-3">
            <h3 className="text-foreground text-sm font-bold">Active Sessions</h3>
            <p className="text-foreground-muted flex items-start gap-2 text-xs leading-relaxed">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              Sign out of all devices and sessions. You will need to sign in again on all
              your devices.
            </p>
            <div>
              <Button
                variant="outline"
                size="sm"
                loading={isLoggingOutAll}
                onClick={handleLogoutAll}
                className="text-error hover:bg-error-light hover:text-error"
              >
                {!isLoggingOutAll && (
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Sign out all devices
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
