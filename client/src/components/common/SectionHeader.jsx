import { cn } from '@/utils/cn'

export default function SectionHeader({ title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-foreground text-[15px] leading-tight font-bold">{title}</h2>
        {description && (
          <p className="text-foreground-muted mt-0.5 text-xs">{description}</p>
        )}
      </div>
      {action && <div className="flex flex-shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}
