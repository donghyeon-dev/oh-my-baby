'use client'

import { useState } from 'react'
import { cn, formatDuration } from '@/lib/utils'
import { Media } from '@/types'

interface MediaCardProps {
  media: Media
  onClick?: () => void
  selectable?: boolean
  selected?: boolean
  onSelect?: (selected: boolean) => void
}

export function MediaCard({ media, onClick, selectable = false, selected = false, onSelect }: MediaCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleCardClick = () => {
    if (selectable) {
      onSelect?.(!selected)
    } else if (onClick) {
      onClick()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick()
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSelect) {
      onSelect(!selected)
    }
  }

  const displayUrl = media.thumbnailUrl || media.url

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 aspect-square transition-all duration-200',
        'hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2',
        selected && 'ring-2 ring-pink-500 ring-offset-2'
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      {/* Loading skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <svg
            className="w-12 h-12 text-gray-300"
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
      )}

      {/* Media thumbnail */}
      {media.type === 'PHOTO' ? (
        <img
          src={displayUrl}
          alt={media.originalName}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <video
          src={`${displayUrl}#t=0.5`}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
          onLoadedData={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* Hover overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200',
          isLoading && 'hidden'
        )}
      />

      {/* Type indicator */}
      {!isLoading && !hasError && (
        <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-full">
          {media.type === 'PHOTO' ? (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
      )}

      {/* Duration badge for videos */}
      {!isLoading && !hasError && media.type === 'VIDEO' && media.duration && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-medium text-white">
          {formatDuration(media.duration)}
        </div>
      )}

      {/* Selection checkbox */}
      {selectable && (
        <div className="absolute top-2 left-2" onClick={handleCheckboxClick}>
          <div
            className={cn(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
              selected
                ? 'bg-pink-500 border-pink-500'
                : 'bg-white/80 border-white backdrop-blur-sm hover:bg-white'
            )}
          >
            {selected && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
