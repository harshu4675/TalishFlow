import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

const schema = z.object({
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
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Password strength indicator
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
    if (strength < 0.5) return 'bg-[#EF4444]'
    if (strength < 0.75) return 'bg-[#F59E0B]'
    return 'bg-[#22C55E]'
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
      className="flex flex-col gap-2 mt-2"
    >
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
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
        <span className="text-xs text-[#878787] font-medium w-10">{getLabel()}</span>
      </div>

      {/* Rules */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {passwordRules.map((rule, i) => {
          const passes = rule.test(password)
          return (
            <div key={i} className="flex items-center gap-1.5">
              {passes ? (
                <Check className="w-3 h-3 text-[#22C55E] flex-shrink-0" />
              ) : (
                <X className="w-3 h-3 text-[#878787] flex-shrink-0" />
              )}
              <span
                className={cn(
                  'text-[11px]',
                  passes ? 'text-[#22C55E]' : 'text-[#878787]'
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
  const [passwordValue, setPasswordValue] = useState('')

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
      'bg-[#F8F9FA] border transition-all duration-150',
      'text-[#212121] placeholder:text-[#878787]',
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-[#2874F0]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      hasError
        ? 'border-[#FF6161] focus:ring-danger/30 focus:border-[#FF6161]'
        : 'border-[#E0E0E0] hover:border-[#2874F0]/30'
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-semibold text-[#212121]">
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
            className="text-xs text-[#EF4444] font-medium"
            role="alert"
          >
            {errors.name.message}
          </motion.p>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-[#212121]">
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
            className="text-xs text-[#EF4444] font-medium"
            role="alert"
          >
            {errors.email.message}
          </motion.p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-[#212121]">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Create a strong password"
            disabled={isLoading}
            {...register('password', {
              onChange: (e) => setPasswordValue(e.target.value),
            })}
            className={cn(fieldClass(!!errors.password), 'pr-11')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#878787] hover:text-[#212121] transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
            className="text-xs text-[#EF4444] font-medium"
            role="alert"
          >
            {errors.password.message}
          </motion.p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-semibold text-[#212121]">
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
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#878787] hover:text-[#212121] transition-colors"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-[#EF4444] font-medium"
            role="alert"
          >
            {errors.confirmPassword.message}
          </motion.p>
        )}
      </div>

      {/* Terms */}
      <p className="text-xs text-[#878787] leading-relaxed">
        By creating an account, you agree to our{' '}
        <a href="#" className="text-[#2874F0] hover:underline font-medium">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-[#2874F0] hover:underline font-medium">
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
          'w-full flex items-center justify-center gap-2',
          'py-3 px-6 rounded-xl',
          'bg-[#2874F0] hover:bg-[#1B5FCC]',
          'text-white text-sm font-semibold',
          'transition-all duration-200 shadow-md hover:shadow-lg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </motion.button>
    </form>
  )
}