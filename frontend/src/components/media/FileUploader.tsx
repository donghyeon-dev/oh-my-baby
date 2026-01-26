'use client'

import { useCallback, useState } from 'react'
import { cn, formatFileSize } from '@/lib/utils'
import { UploadProgress } from '@/types'

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  maxFiles?: number
  maxFileSize?: number
  accept?: string
}

const ACCEPTED_TYPES = 'image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/x-msvideo,video/webm,video/3gpp'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export function FileUploader({
  onFilesSelected,
  disabled = false,
  maxFiles = 20,
  maxFileSize = MAX_FILE_SIZE,
  accept = ACCEPTED_TYPES,
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFiles = useCallback(
    (files: File[]): File[] => {
      setError(null)
      const validFiles: File[] = []
      const errors: string[] = []

      if (files.length > maxFiles) {
        errors.push(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다`)
        files = files.slice(0, maxFiles)
      }

      for (const file of files) {
        if (file.size > maxFileSize) {
          errors.push(`${file.name}: 파일 크기가 ${formatFileSize(maxFileSize)}를 초과합니다`)
          continue
        }

        const acceptedTypes = accept.split(',')
        if (!acceptedTypes.some((type) => file.type === type || file.type.startsWith(type.replace('*', '')))) {
          errors.push(`${file.name}: 지원하지 않는 파일 형식입니다`)
          continue
        }

        validFiles.push(file)
      }

      if (errors.length > 0) {
        setError(errors.join('\n'))
      }

      return validFiles
    },
    [maxFiles, maxFileSize, accept]
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      const validFiles = validateFiles(files)
      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
      }
    },
    [disabled, onFilesSelected, validateFiles]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return

      const files = Array.from(e.target.files || [])
      const validFiles = validateFiles(files)
      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
      }

      // Reset input
      e.target.value = ''
    },
    [disabled, onFilesSelected, validateFiles]
  )

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer',
          isDragActive
            ? 'border-pink-400 bg-pink-50'
            : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center',
              isDragActive ? 'bg-pink-100' : 'bg-gray-100'
            )}
          >
            <svg
              className={cn('w-8 h-8', isDragActive ? 'text-pink-500' : 'text-gray-400')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? '파일을 놓아주세요' : '파일을 드래그하거나 클릭하여 선택'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              사진 또는 동영상 (최대 {maxFiles}개, 각 {formatFileSize(maxFileSize)})
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
        </div>
      )}
    </div>
  )
}

interface UploadProgressListProps {
  uploads: UploadProgress[]
  onRemove?: (fileName: string) => void
}

export function UploadProgressList({ uploads, onRemove }: UploadProgressListProps) {
  if (uploads.length === 0) return null

  return (
    <div className="space-y-3">
      {uploads.map((upload) => (
        <div
          key={upload.fileName}
          className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg"
        >
          <div className="flex-shrink-0">
            {upload.status === 'success' ? (
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : upload.status === 'error' ? (
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{upload.fileName}</p>
            {upload.status === 'error' && upload.error && (
              <p className="text-xs text-red-500 truncate">{upload.error}</p>
            )}
            {(upload.status === 'uploading' || upload.status === 'pending') && (
              <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex-shrink-0 text-sm text-gray-500">
            {upload.status === 'uploading' && `${upload.progress}%`}
            {upload.status === 'success' && '완료'}
            {upload.status === 'pending' && '대기 중'}
          </div>

          {onRemove && upload.status !== 'uploading' && (
            <button
              onClick={() => onRemove(upload.fileName)}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
