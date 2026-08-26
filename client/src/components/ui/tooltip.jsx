import { forwardRef } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/utils/cn'

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = forwardRef(function TooltipContent(
  { className, sideOffset = 6, ...props },
  ref
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-tooltip border-border bg-surface text-foreground shadow-popover animate-scale-in rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
})
TooltipContent.displayName = 'TooltipContent'

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent }
export default TooltipContent
