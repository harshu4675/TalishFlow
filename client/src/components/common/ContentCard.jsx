import { useState } from 'react'
import { Check, Copy, Sparkles, PenLine, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { copyToClipboard } from '@/utils/helpers'

export default function ContentCard({
  label,
  meta,
  badge,
  children,
  copyable = false,
  onCopy,
  className,
  maxHeight,
}) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(onCopy || children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'border-primary/20 from-primary-light/40 to-surface hover:border-primary/35 overflow-hidden rounded-2xl border bg-gradient-to-br transition-all duration-200',
        className
      )}
    >
      <div className="border-primary/10 bg-surface/60 flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {badge === 'generated' && (
            <span className="bg-primary-light text-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          )}
          <p className="text-primary truncate text-xs font-bold tracking-wide uppercase">
            {label}
          </p>
          {meta && (
            <span className="text-foreground-faint flex-shrink-0 text-[11px]">
              {meta}
            </span>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {copyable && (
            <button
              type="button"
              onClick={handleCopy}
              className="text-foreground-muted hover:bg-surface hover:text-foreground flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors"
              aria-label={`Copy ${label.toLowerCase()}`}
            >
              {copied ? (
                <Check className="text-success h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          {badge === 'edited' && (
            <span className="bg-accent-light text-accent inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold">
              <PenLine className="h-3 w-3" aria-hidden="true" />
              Edited
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <div
          className={cn(
            'text-foreground px-4 py-3.5 text-sm leading-relaxed',
            maxHeight && !expanded && 'overflow-hidden',
            maxHeight && !expanded && `max-h-${maxHeight}`
          )}
          style={maxHeight && !expanded ? { maxHeight: maxHeight * 4 } : undefined}
        >
          {children}
        </div>
        {maxHeight && !expanded && (
          <div className="from-surface/95 absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t to-transparent pt-6 pb-1">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-primary hover:bg-primary-light flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors"
            >
              Expand
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
