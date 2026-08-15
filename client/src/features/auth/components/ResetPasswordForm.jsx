import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function ResetPasswordForm({ onSubmit, isLoading }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })

  const fieldClass = (hasError) =>
    cn(
      'w-full px-4 py-3 rounded-xl text-sm',
      'bg-surface-muted border transition-all duration-150',
      'text-foreground placeholder:text-foreground-muted',
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      hasError
        ? 'border-error focus:ring-danger/30 focus:border-error'
        : 'border-border hover:border-primary/30'
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {/* New Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-foreground text-sm font-semibold">
          New password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Create a new strong password"
            disabled={isLoading}
            {...register('password')}
            className={cn(fieldClass(!!errors.password), 'pr-11')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-foreground-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-1 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-error text-xs font-medium"
            role="alert"
          >
            {errors.password.message}
          </motion.p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-foreground text-sm font-semibold"
        >
          Confirm new password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Confirm your new password"
            disabled={isLoading}
            {...register('confirmPassword')}
            className={cn(fieldClass(!!errors.confirmPassword), 'pr-11')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="text-foreground-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-1 transition-colors"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-error text-xs font-medium"
            role="alert"
          >
            {errors.confirmPassword.message}
          </motion.p>
        )}
      </div>

      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.01 }}
        whileTap={{ scale: isLoading ? 1 : 0.99 }}
        className={cn(
          'flex w-full items-center justify-center gap-2',
          'rounded-xl px-6 py-3',
          'bg-primary hover:bg-primary-hover',
          'text-sm font-semibold text-white',
          'shadow-md transition-all duration-200 hover:shadow-lg',
          'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-60'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Resetting password...
          </>
        ) : (
          'Reset password'
        )}
      </motion.button>
    </form>
  )
}
