import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const iconButtonVariants = cva(
  'inline-flex flex-shrink-0 items-center justify-center rounded-xl text-foreground-muted transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        ghost: 'hover:bg-surface-muted hover:text-foreground',
        outline: 'border border-border hover:bg-surface-muted hover:text-foreground',
        surface: 'bg-surface-muted hover:bg-surface-strong hover:text-foreground',
        primary: 'bg-primary text-white hover:bg-primary-hover',
        destructive: 'text-error hover:bg-error-light',
      },
      size: {
        sm: 'h-8 w-8',
        md: 'h-9 w-9',
        lg: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  }
)

const IconButton = forwardRef(function IconButton(
  { className, variant, size, label, loading = false, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(iconButtonVariants({ variant, size }), className)}
      aria-label={label}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        children
      )}
    </button>
  )
})

IconButton.displayName = 'IconButton'

export { IconButton, iconButtonVariants }
export default IconButton
