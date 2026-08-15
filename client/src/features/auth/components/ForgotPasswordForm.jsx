import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail } from 'lucide-react'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

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
        className="py-4 text-center"
      >
        <div className="bg-success/10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
          <Mail className="text-success h-6 w-6" />
        </div>
        <h3 className="text-foreground mb-2 text-lg font-bold">Check your email</h3>
        <p className="text-foreground-muted text-sm leading-relaxed">
          If an account exists with that email, we've sent you a link to reset your
          password. Check your inbox and spam folder.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
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
          className={cn(
            'w-full rounded-xl px-4 py-3 text-sm',
            'bg-surface-muted border transition-all duration-150',
            'text-foreground placeholder:text-foreground-muted',
            'focus:ring-primary/30 focus:border-primary focus:ring-2 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            errors.email
              ? 'border-error focus:ring-danger/30 focus:border-error'
              : 'border-border hover:border-primary/30'
          )}
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
            Sending reset link...
          </>
        ) : (
          'Send reset link'
        )}
      </motion.button>
    </form>
  )
}
