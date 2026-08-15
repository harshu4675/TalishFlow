import { cn } from '@/utils/cn'

export default function PageHeader({ title, description, eyebrow, actions, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-primary mb-1 text-xs font-bold tracking-wider uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-foreground text-xl font-extrabold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="text-foreground-muted mt-1 text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
