import { cn } from '@/utils/cn'

function Skeleton({ className, ...props }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" {...props} />
}

export { Skeleton }
export default Skeleton
