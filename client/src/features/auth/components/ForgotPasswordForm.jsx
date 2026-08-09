import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function ForgotPasswordForm({ onSubmit, isLoading, isSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-5">
          <Mail className="w-6 h-6 text-[#22C55E]" />
        </div>
        <h3 className="text-lg font-bold text-[#212121] mb-2">Check your email</h3>
        <p className="text-[#878787] text-sm leading-relaxed">
          If an account exists with that email, we've sent you a link to reset your
          password. Check your inbox and spam folder.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
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
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm',
            'bg-[#F8F9FA] border transition-all duration-150',
            'text-[#212121] placeholder:text-[#878787]',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-[#2874F0]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            errors.email
              ? 'border-[#FF6161] focus:ring-danger/30 focus:border-[#FF6161]'
              : 'border-[#E0E0E0] hover:border-[#2874F0]/30'
          )}
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
          'disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          'Send reset link'
        )}
      </motion.button>
    </form>
  )
}