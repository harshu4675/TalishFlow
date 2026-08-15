import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

const Card = forwardRef(function Card({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('border-border bg-surface shadow-card rounded-2xl border', className)}
      {...props}
    />
  )
})
Card.displayName = 'Card'

const CardHeader = forwardRef(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'border-border-subtle flex flex-col gap-1 border-b px-5 py-4',
        className
      )}
      {...props}
    />
  )
})
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn('text-foreground text-[15px] leading-tight font-bold', className)}
      {...props}
    />
  )
})
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef(function CardDescription(
  { className, ...props },
  ref
) {
  return (
    <p ref={ref} className={cn('text-foreground-muted text-xs', className)} {...props} />
  )
})
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn('p-5', className)} {...props} />
})
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'border-border-subtle flex items-center border-t px-5 py-4',
        className
      )}
      {...props}
    />
  )
})
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
export default Card
