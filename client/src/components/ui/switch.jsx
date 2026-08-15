import { forwardRef } from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/utils/cn'

const Switch = forwardRef(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
        'focus-visible:ring-primary/40 focus-visible:ring-offset-surface focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-surface-strong',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="bg-surface pointer-events-none block h-4 w-4 rounded-full shadow-sm transition-transform duration-200 data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[3px]" />
    </SwitchPrimitive.Root>
  )
})
Switch.displayName = 'Switch'

export default Switch
