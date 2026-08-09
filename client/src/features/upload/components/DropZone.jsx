import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileVideo, AlertCircle } from 'lucide-react'
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

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections,
  } = useDropzone({
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
          'flex flex-col items-center justify-center text-center p-8 cursor-pointer',
          'transition-all duration-200 outline-none',
          isDragActive
            ? 'border-[#2874F0] bg-[#2874F0]/5 scale-[1.01]'
            : 'border-[#E0E0E0] bg-[#F8F9FA] hover:border-[#2874F0]/50 hover:bg-[#2874F0]/[0.03]',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200',
            isDragActive ? 'bg-[#2874F0] text-white scale-110' : 'bg-[#2874F0]/10 text-[#2874F0]'
          )}
        >
          <UploadCloud className="w-6 h-6" aria-hidden="true" />
        </div>

        <p className="text-[15px] font-bold text-[#212121]">
          {isDragActive ? 'Drop videos here' : 'Drag and drop your videos'}
        </p>

        <p className="text-sm text-[#878787] mt-1.5">
          or <span className="text-[#2874F0] font-semibold">browse your device</span>
        </p>

        <div className="flex items-center gap-2 mt-5 text-[11px] text-[#878787]">
          <span className="px-2 py-1 rounded-md bg-white border border-[#E0E0E0]">MP4</span>
          <span className="px-2 py-1 rounded-md bg-white border border-[#E0E0E0]">MOV</span>
          <span className="px-2 py-1 rounded-md bg-white border border-[#E0E0E0]">MKV</span>
          <span className="px-2 py-1 rounded-md bg-white border border-[#E0E0E0]">AVI</span>
          <span>Up to {formatFileSize(UPLOAD_CONFIG.MAX_FILE_SIZE)}</span>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#EF4444]/10 border border-[#FF6161]/20">
          <AlertCircle className="w-4 h-4 text-[#EF4444] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#EF4444]">Some files could not be added</p>
            {fileRejections.map(({ file, errors }) => (
              <p key={file.name} className="text-xs text-[#EF4444]/80 mt-1">
                {file.name}: {errors[0]?.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}