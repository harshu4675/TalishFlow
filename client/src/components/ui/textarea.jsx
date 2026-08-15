import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

const Textarea = forwardRef(function Textarea(
  { className, hasError = false, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'bg-surface text-foreground w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-150',
        'placeholder:text-foreground-faint focus:ring-2 focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:ring-2 focus-visible:outline-none',
        hasError
          ? 'border-error focus:border-error focus:ring-error/20'
          : 'border-border hover:border-foreground-faint/60 focus:border-primary focus:ring-primary/20',
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export default Textarea
