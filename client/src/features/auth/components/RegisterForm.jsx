import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

const schema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name cannot exceed 60 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const passwordRules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
]

function PasswordStrengthIndicator({ password }) {
  if (!password) return null

  const passed = passwordRules.filter((r) => r.test(password)).length
  const strength = passed / passwordRules.length

  const getColor = () => {
    if (strength < 0.5) return 'bg-error'
    if (strength < 0.75) return 'bg-warning'
    return 'bg-success'
  }

  const getLabel = () => {
    if (strength < 0.5) return 'Weak'
    if (strength < 0.75) return 'Fair'
    if (strength < 1) return 'Good'
    return 'Strong'
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-2 flex flex-col gap-2"
    >
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-300',
                i <= Math.ceil(strength * 4) ? getColor() : 'bg-border'
              )}
            />
          ))}
        </div>
        <span className="text-foreground-muted w-10 text-xs font-medium">
          {getLabel()}
        </span>
      </div>

      {/* Rules */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {passwordRules.map((rule, i) => {
          const passes = rule.test(password)
          return (
            <div key={i} className="flex items-center gap-1.5">
              {passes ? (
                <Check className="text-success h-3 w-3 flex-shrink-0" />
              ) : (
                <X className="text-foreground-muted h-3 w-3 flex-shrink-0" />
              )}
              <span
                className={cn(
                  'text-[11px]',
                  passes ? 'text-success' : 'text-foreground-muted'
                )}
              >
                {rule.label}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function RegisterForm({ onSubmit, isLoading }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })

  const watchPassword = watch('password', '')

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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-foreground text-sm font-semibold">
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          disabled={isLoading}
          {...register('name')}
          className={fieldClass(!!errors.name)}
        />
        {errors.name && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-error text-xs font-medium"
            role="alert"
          >
            {errors.name.message}
          </motion.p>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-foreground text-sm font-semibold">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isLoading}
          {...register('email')}
          className={fieldClass(!!errors.email)}
        />
        {errors.email && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-error text-xs font-medium"
            role="alert"
          >
            {errors.email.message}
          </motion.p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-foreground text-sm font-semibold">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Create a strong password"
            disabled={isLoading}
            {...register('password')}
            className={cn(fieldClass(!!errors.password), 'pr-11')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="text-foreground-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-1 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Password Strength */}
        <AnimatePresence>
          {watchPassword && <PasswordStrengthIndicator password={watchPassword} />}
        </AnimatePresence>

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
          Confirm password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Confirm your password"
            disabled={isLoading}
            {...register('confirmPassword')}
            className={cn(fieldClass(!!errors.confirmPassword), 'pr-11')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            disabled={isLoading}
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

      {/* Terms */}
      <p className="text-foreground-muted text-xs leading-relaxed">
        By creating an account, you agree to our{' '}
        <a href="#" className="text-primary font-medium hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-primary font-medium hover:underline">
          Privacy Policy
        </a>
        .
      </p>

      {/* Submit */}
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
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </motion.button>
    </form>
  )
}
