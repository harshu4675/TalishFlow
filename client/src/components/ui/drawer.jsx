import { forwardRef } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

const Drawer = DialogPrimitive.Root
const DrawerTrigger = DialogPrimitive.Trigger
const DrawerClose = DialogPrimitive.Close

const DrawerContent = forwardRef(function DrawerContent(
  { className, children, side = 'left', hideCloseButton = false, ...props },
  ref
) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="z-modal-backdrop bg-overlay fixed inset-0 backdrop-blur-sm" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'z-modal bg-surface shadow-float fixed inset-y-0 flex w-[min(320px,85vw)] flex-col focus:outline-none',
          side === 'left' && 'left-0',
          side === 'right' && 'right-0',
          className
        )}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close
            className="text-foreground-muted hover:bg-surface-muted hover:text-foreground focus-visible:ring-primary/40 absolute top-4 right-4 rounded-lg p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})
DrawerContent.displayName = 'DrawerContent'

export { Drawer, DrawerTrigger, DrawerClose, DrawerContent }
export default DrawerContent
