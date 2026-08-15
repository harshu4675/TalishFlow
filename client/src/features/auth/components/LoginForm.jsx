import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

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
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail
            className="text-foreground-faint absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isLoading}
            hasError={!!errors.email}
            className="h-11 pl-10"
            {...register('email')}
          />
        </div>
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock
            className="text-foreground-faint absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={isLoading}
            hasError={!!errors.password}
            className="h-11 pr-11 pl-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="text-foreground-faint hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2 rounded-lg p-1 transition-colors"
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

      <Button
        type="submit"
        size="lg"
        loading={isLoading}
        className={cn('group mt-2 w-full')}
      >
        {isLoading ? (
          'Signing in...'
        ) : (
          <>
            Sign in to Dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  )
}
