import { useState } from 'react'
import { Link2, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { isValidYouTubeUrl } from '@/utils/formatters'

export default function YoutubeUrlInput({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedUrl = url.trim()

    if (!trimmedUrl) {
      setError('Enter a YouTube URL to continue.')
      return
    }

    if (!isValidYouTubeUrl(trimmedUrl)) {
      setError('Enter a valid YouTube video or Shorts URL.')
      return
    }

    setError('')
    await onSubmit(trimmedUrl)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <Link2
          className="text-foreground-muted absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        />

        <input
          value={url}
          onChange={(event) => {
            setUrl(event.target.value)
            if (error) setError('')
          }}
          disabled={isLoading}
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          className={cn(
            'w-full rounded-xl py-3 pr-4 pl-11 text-sm',
            'bg-surface-muted text-foreground placeholder:text-foreground-muted border',
            'transition-all duration-150 outline-none',
            'focus:ring-primary/30 focus:border-primary focus:ring-2',
            error ? 'border-error' : 'border-border hover:border-primary/30',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
      </div>

      {error && (
        <p className="text-error -mt-1 text-xs font-medium" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl py-3',
          'bg-primary hover:bg-primary-hover text-sm font-semibold text-white',
          'shadow-primary/20 shadow-md transition-all duration-150',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding YouTube video...
          </>
        ) : (
          <>
            Process YouTube Video
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="text-foreground-muted text-center text-xs leading-relaxed">
        Only publicly accessible YouTube videos can be imported.
      </p>
    </form>
  )
}
