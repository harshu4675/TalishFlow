import { cn } from '@/utils/cn'

export function Skeleton({ className }) {
  return (
    <div
      className={cn('skeleton rounded-lg', className)}
      aria-hidden="true"
    />
  )
}

export function CardSkeleton({ className }) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-[#E0E0E0] p-5',
        className
      )}
      aria-hidden="true"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 4 }) {
  return (
    <div className="flex items-center gap-4 p-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5', i === 0 ? 'w-40' : i === columns - 1 ? 'w-16' : 'w-24')}
        />
      ))}
    </div>
  )
}

export default Skeleton