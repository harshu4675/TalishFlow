import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-muted text-foreground-muted border border-border',
        primary: 'bg-primary-light text-primary',
        success: 'bg-success-light text-success-dark',
        warning: 'bg-warning-light text-warning',
        error: 'bg-error-light text-error',
        info: 'bg-info-light text-info',
        outline: 'border border-border text-foreground-muted',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
)

const Badge = forwardRef(function Badge({ className, variant, ...props }, ref) {
  return (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
})
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
export default Badge
