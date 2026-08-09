import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginForm({ onSubmit, isLoading }) {
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold text-[#212121]">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#878787]" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isLoading}
            {...register('email')}
            className={cn(
              'w-full rounded-xl py-3.5 pr-4 pl-11 text-sm',
              'border-2 bg-white transition-all duration-200',
              'text-[#212121] placeholder:text-[#B0B0B0]',
              'focus:border-[#2874F0] focus:ring-4 focus:ring-[#2874F0]/10 focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              errors.email
                ? 'border-[#FF6161] focus:border-[#FF6161] focus:ring-[#FF6161]/10'
                : 'border-[#E0E0E0] hover:border-[#B0B0B0]'
            )}
          />
        </div>
        {errors.email && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 text-xs font-medium text-[#FF6161]"
            role="alert"
          >
            {errors.email.message}
          </motion.p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-semibold text-[#212121]">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#878787]" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={isLoading}
            {...register('password')}
            className={cn(
              'w-full rounded-xl py-3.5 pr-12 pl-11 text-sm',
              'border-2 bg-white transition-all duration-200',
              'text-[#212121] placeholder:text-[#B0B0B0]',
              'focus:border-[#2874F0] focus:ring-4 focus:ring-[#2874F0]/10 focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              errors.password
                ? 'border-[#FF6161] focus:border-[#FF6161] focus:ring-[#FF6161]/10'
                : 'border-[#E0E0E0] hover:border-[#B0B0B0]'
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute top-1/2 right-4 -translate-y-1/2 p-1 text-[#878787] transition-colors hover:text-[#212121]"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-medium text-[#FF6161]"
            role="alert"
          >
            {errors.password.message}
          </motion.p>
        )}
      </div>

      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.01 }}
        whileTap={{ scale: isLoading ? 1 : 0.99 }}
        className={cn(
          'group relative flex w-full items-center justify-center gap-2',
          'mt-2 rounded-xl px-6 py-3.5',
          'bg-gradient-to-r from-[#2874F0] to-[#1B5FCC]',
          'text-sm font-bold text-white',
          'shadow-lg shadow-[#2874F0]/25 hover:shadow-xl hover:shadow-[#2874F0]/40',
          'overflow-hidden transition-all duration-300',
          'focus-visible:ring-4 focus-visible:ring-[#2874F0]/30 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none'
        )}
      >
        <span className="relative z-10 flex items-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in to Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </span>
      </motion.button>
    </form>
  )
}
