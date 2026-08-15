import { forwardRef } from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/utils/cn'

const Progress = forwardRef(function Progress(
  { className, value, indicatorClassName, ...props },
  ref
) {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'bg-surface-strong relative h-1.5 w-full overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'bg-primary h-full w-full flex-1 rounded-full transition-transform duration-300 ease-linear',
          indicatorClassName
        )}
        style={{
          transform: `translateX(-${100 - Math.min(Math.max(value || 0, 0), 100)}%)`,
        }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = 'Progress'

export default Progress
