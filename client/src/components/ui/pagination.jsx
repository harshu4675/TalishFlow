import { forwardRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from './icon-button'

function getPageItems(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const items = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...items].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const withGaps = []
  let previous = 0
  for (const page of sorted) {
    if (page - previous > 1) withGaps.push('…')
    withGaps.push(page)
    previous = page
  }

  return withGaps
}

const Pagination = forwardRef(function Pagination(
  { page, totalPages, onPageChange, className, compact = false },
  ref
) {
  if (totalPages <= 1) return null

  const items = getPageItems(page, totalPages)

  return (
    <nav
      ref={ref}
      className={cn('flex items-center gap-1', className)}
      aria-label="Pagination"
    >
      <IconButton
        variant="outline"
        size="sm"
        label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </IconButton>

      {!compact &&
        items.map((item, index) =>
          item === '…' ? (
            <span
              key={`gap-${index}`}
              className="text-foreground-faint px-1.5 text-xs font-semibold"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
              className={cn(
                'h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition-all duration-150',
                'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
                item === page
                  ? 'bg-primary shadow-primary/25 text-white shadow-sm'
                  : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground'
              )}
            >
              {item}
            </button>
          )
        )}

      <IconButton
        variant="outline"
        size="sm"
        label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </IconButton>
    </nav>
  )
})

Pagination.displayName = 'Pagination'

export default Pagination
