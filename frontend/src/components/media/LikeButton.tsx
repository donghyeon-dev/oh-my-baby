'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import likeService from '@/services/like'

interface LikeButtonProps {
  mediaId: string
  initialLikeCount?: number
  initialIsLiked?: boolean
  variant?: 'icon' | 'button'
  className?: string
}

export function LikeButton({
  mediaId,
  initialLikeCount = 0,
  initialIsLiked = false,
  variant = 'icon',
  className,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()

    // Optimistic update
    const prevIsLiked = isLiked
    const prevLikeCount = likeCount
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
    setIsAnimating(true)

    try {
      const response = await likeService.toggleLike(mediaId)
      setIsLiked(response.isLiked)
      setLikeCount(response.likeCount)
    } catch (error) {
      // Revert on error
      setIsLiked(prevIsLiked)
      setLikeCount(prevLikeCount)
      console.error('Failed to toggle like:', error)
    } finally {
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggleLike}
        className={cn(
          'p-1.5 rounded-full transition-all duration-200',
          isLiked
            ? 'text-red-500 hover:text-red-600'
            : 'text-gray-400 hover:text-red-500',
          className
        )}
        aria-label={isLiked ? '좋아요 취소' : '좋아요'}
      >
        <Heart
          className={cn(
            'w-5 h-5 transition-transform duration-200',
            isAnimating && 'scale-125',
          )}
          fill={isLiked ? 'currentColor' : 'none'}
        />
      </button>
    )
  }

  return (
    <button
      onClick={handleToggleLike}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
        isLiked
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        className
      )}
      aria-label={isLiked ? '좋아요 취소' : '좋아요'}
    >
      <Heart
        className={cn(
          'w-4 h-4 transition-transform duration-200',
          isAnimating && 'scale-125',
        )}
        fill={isLiked ? 'currentColor' : 'none'}
      />
      <span>{likeCount}</span>
    </button>
  )
}
