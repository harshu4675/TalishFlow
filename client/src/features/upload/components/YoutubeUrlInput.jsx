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
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#878787]"
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
            'w-full py-3 pl-11 pr-4 rounded-xl text-sm',
            'bg-[#F8F9FA] border text-[#212121] placeholder:text-[#878787]',
            'transition-all duration-150 outline-none',
            'focus:ring-2 focus:ring-primary/30 focus:border-[#2874F0]',
            error ? 'border-[#FF6161]' : 'border-[#E0E0E0] hover:border-[#2874F0]/30',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />
      </div>

      {error && (
        <p className="text-xs text-[#EF4444] font-medium -mt-1" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
          'bg-[#2874F0] hover:bg-[#1B5FCC] text-white text-sm font-semibold',
          'transition-all duration-150 shadow-md shadow-primary/20',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Adding YouTube video...
          </>
        ) : (
          <>
            Process YouTube Video
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-xs text-[#878787] text-center leading-relaxed">
        Only publicly accessible YouTube videos can be imported.
      </p>
    </form>
  )
}