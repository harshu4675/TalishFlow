import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatFileSize } from '@/utils/formatters'
import { UPLOAD_CONFIG } from '@/utils/constants'

export default function DropZone({ onFilesSelected, disabled = false }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length) {
        onFilesSelected(acceptedFiles)
      }
    },
    [onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    disabled,
    multiple: true,
    maxSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    accept: UPLOAD_CONFIG.ACCEPTED_TYPES,
  })

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={cn(
          'relative min-h-[240px] rounded-2xl border-2 border-dashed',
          'flex cursor-pointer flex-col items-center justify-center p-8 text-center',
          'transition-all duration-200 outline-none',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border bg-surface-muted hover:border-primary/50 hover:bg-primary/[0.03]',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200',
            isDragActive
              ? 'bg-primary scale-110 text-white'
              : 'bg-primary/10 text-primary'
          )}
        >
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </div>

        <p className="text-foreground text-[15px] font-bold">
          {isDragActive ? 'Drop videos here' : 'Drag and drop your videos'}
        </p>

        <p className="text-foreground-muted mt-1.5 text-sm">
          or <span className="text-primary font-semibold">browse your device</span>
        </p>

        <div className="text-foreground-muted mt-5 flex items-center gap-2 text-[11px]">
          <span className="bg-surface border-border rounded-md border px-2 py-1">
            MP4
          </span>
          <span className="bg-surface border-border rounded-md border px-2 py-1">
            MOV
          </span>
          <span className="bg-surface border-border rounded-md border px-2 py-1">
            MKV
          </span>
          <span className="bg-surface border-border rounded-md border px-2 py-1">
            AVI
          </span>
          <span>Up to {formatFileSize(UPLOAD_CONFIG.MAX_FILE_SIZE)}</span>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="bg-error/10 border-error/20 flex items-start gap-2.5 rounded-xl border p-3">
          <AlertCircle className="text-error mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="text-error text-xs font-bold">Some files could not be added</p>
            {fileRejections.map(({ file, errors }) => (
              <p key={file.name} className="text-error/80 mt-1 text-xs">
                {file.name}: {errors[0]?.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
