'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { mediaService } from '@/services/media'

interface DownloadButtonProps {
  mediaId: string
  fileName: string
  variant?: 'button' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function DownloadButton({
  mediaId,
  fileName,
  variant = 'button',
  size = 'md',
  className
}: DownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    try {
      setLoading(true)
      setError(null)
      const url = await mediaService.getDownloadUrl(mediaId)

      // Create anchor and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      setError('다운로드 실패')
      console.error('Download failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const sizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  }

  const buttonSizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const DownloadIcon = () => (
    <svg
      className={cn(iconSizes[size])}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  )

  const Spinner = () => (
    <svg
      className={cn('animate-spin', iconSizes[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDownload}
        disabled={loading}
        className={cn(
          'rounded-full bg-pink-500 hover:bg-pink-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center',
          sizes[size],
          className
        )}
        title={error || '다운로드'}
        aria-label="다운로드"
      >
        {loading ? <Spinner /> : <DownloadIcon />}
      </button>
    )
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={cn(
        'rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
        buttonSizes[size],
        className
      )}
      aria-label="다운로드"
    >
      {loading ? (
        <>
          <Spinner />
          <span>다운로드 중...</span>
        </>
      ) : (
        <>
          <DownloadIcon />
          <span>다운로드</span>
        </>
      )}
      {error && (
        <span className="sr-only" role="alert">
          {error}
        </span>
      )}
    </button>
  )
}
