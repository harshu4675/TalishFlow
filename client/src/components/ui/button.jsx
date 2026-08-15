import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary-hover',
        secondary:
          'border border-border bg-surface text-foreground shadow-sm hover:bg-surface-muted',
        ghost: 'text-foreground-muted hover:bg-surface-muted hover:text-foreground',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-surface-muted',
        destructive: 'bg-error text-white shadow-sm hover:bg-error/85',
        success: 'bg-success text-white shadow-sm hover:bg-success-dark',
        accent: 'bg-accent text-white shadow-sm hover:bg-accent-hover',
      },
      size: {
        sm: 'h-8 rounded-lg px-3 text-xs',
        md: 'h-10 rounded-xl px-4 text-sm',
        lg: 'h-11 rounded-xl px-5 text-sm',
        icon: 'h-9 w-9 rounded-xl p-0',
        'icon-sm': 'h-8 w-8 rounded-lg p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

const Button = forwardRef(function Button(
  {
    className,
    variant,
    size,
    loading = false,
    children,
    disabled,
    asChild = false,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </Comp>
  )
})

Button.displayName = 'Button'

export { Button, buttonVariants }
export default Button
