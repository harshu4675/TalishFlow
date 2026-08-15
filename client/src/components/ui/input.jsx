import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

const Input = forwardRef(function Input({ className, hasError = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'bg-surface text-foreground h-10 w-full rounded-xl border px-3.5 text-sm transition-all duration-150',
        'placeholder:text-foreground-faint focus:ring-2 focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        hasError
          ? 'border-error focus:border-error focus:ring-error/20'
          : 'border-border hover:border-foreground-faint/60 focus:border-primary focus:ring-primary/20',
        className
      )}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export default Input
