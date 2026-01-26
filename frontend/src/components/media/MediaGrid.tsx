'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { cn, groupMediaByDate } from '@/lib/utils'
import { Media, MediaFilters } from '@/types'
import { mediaService } from '@/services/media'
import { MediaCard } from './MediaCard'
import { DateHeader } from './DateHeader'

interface MediaGridProps {
  filters?: MediaFilters
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (selectedIds: Set<string>) => void
  onMediaClick?: (media: Media, index: number, allMedia: Media[]) => void
}

const PAGE_SIZE = 24

export function MediaGrid({
  filters,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onMediaClick
}: MediaGridProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isFetchingRef = useRef(false)

  // Fetch media function
  const fetchMedia = useCallback(async (pageNum: number, isInitial: boolean) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      if (isInitial) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      const response = await mediaService.getMediaList({
        ...filters,
        page: pageNum,
        size: PAGE_SIZE
      })

      if (isInitial) {
        setMedia(response.content)
      } else {
        setMedia((prev) => [...prev, ...response.content])
      }

      setHasMore(response.hasNext)
      setPage(pageNum)
    } catch (err) {
      console.error('Failed to fetch media:', err)
      setError('Failed to load media. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
      isFetchingRef.current = false
    }
  }, [filters])

  // Reset and fetch when filters change
  useEffect(() => {
    setMedia([])
    setPage(0)
    setHasMore(true)
    isFetchingRef.current = false
    fetchMedia(0, true)
  }, [filters, fetchMedia])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchMedia(page + 1, false)
        }
      },
      {
        rootMargin: '200px',
        threshold: 0
      }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, loading, loadingMore, page, fetchMedia])

  // Handle media selection
  const handleSelect = useCallback((mediaId: string, selected: boolean) => {
    const newSelectedIds = new Set(selectedIds)
    if (selected) {
      newSelectedIds.add(mediaId)
    } else {
      newSelectedIds.delete(mediaId)
    }
    onSelectionChange?.(newSelectedIds)
  }, [selectedIds, onSelectionChange])

  // Handle media click
  const handleMediaClick = useCallback((mediaItem: Media) => {
    const index = media.findIndex((m) => m.id === mediaItem.id)
    onMediaClick?.(mediaItem, index, media)
  }, [media, onMediaClick])

  // Group media by date (memoized to prevent recomputation on every render)
  const groupedMedia = useMemo(() => groupMediaByDate(media), [media])
  const sortedDates = useMemo(
    () => Array.from(groupedMedia.keys()).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime()
    }),
    [groupedMedia]
  )

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square rounded-lg bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-gray-500 text-center mb-4">{error}</p>
        <button
          onClick={() => fetchMedia(0, true)}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  // Empty state
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
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
        <p className="text-gray-500 text-center">No media found</p>
        <p className="text-gray-400 text-sm text-center mt-1">
          Upload some photos or videos to get started
        </p>
      </div>
    )
  }

  // Render media grid with date grouping
  return (
    <div className="space-y-1">
      {sortedDates.map((date) => {
        const dateMedia = groupedMedia.get(date)!
        return (
          <div key={date}>
            <DateHeader date={date} count={dateMedia.length} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 pt-2 pb-4">
              {dateMedia.map((item) => (
                <MediaCard
                  key={item.id}
                  media={item}
                  selectable={selectable}
                  selected={selectedIds.has(item.id)}
                  onSelect={(selected) => handleSelect(item.id, selected)}
                  onClick={() => handleMediaClick(item)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-px" />

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-gray-500">
            <svg
              className="w-5 h-5 animate-spin"
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
            <span>Loading more...</span>
          </div>
        </div>
      )}
    </div>
  )
}
