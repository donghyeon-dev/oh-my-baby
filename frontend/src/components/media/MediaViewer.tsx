'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { cn, formatDate, formatFileSize, formatDuration } from '@/lib/utils'
import { Media, Comment } from '@/types'
import { DownloadButton } from './DownloadButton'
import { LikeButton } from './LikeButton'
import { likeService, LikeInfo } from '@/services/like'
import { commentService } from '@/services/comment'
import { useAuthStore } from '@/stores/authStore'

interface MediaViewerProps {
  media: Media[]
  initialIndex: number
  onClose: () => void
}

export function MediaViewer({ media, initialIndex, onClose }: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [showMetadata, setShowMetadata] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isFitMode, setIsFitMode] = useState(true)
  const [likes, setLikes] = useState<LikeInfo[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const currentUser = useAuthStore((s) => s.user)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const MIN_ZOOM = 0.5
  const MAX_ZOOM = 3

  const currentMedia = media.length > 0 ? media[currentIndex] : null

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Preload adjacent images
  useEffect(() => {
    if (!media.length) return

    const preloadIndices = [currentIndex - 1, currentIndex + 1].filter(
      (i) => i >= 0 && i < media.length
    )

    preloadIndices.forEach((i) => {
      const item = media[i]
      if (item.type === 'PHOTO') {
        const img = new Image()
        img.src = item.url
      }
    })
  }, [currentIndex, media])

  // Reset zoom when changing media
  useEffect(() => {
    setZoom(1)
    setIsFitMode(true)
  }, [currentIndex])

  // Animate entry
  useEffect(() => {
    setIsAnimating(true)
  }, [])

  // Fetch likes for current media
  const [likesVersion, setLikesVersion] = useState(0)

  useEffect(() => {
    if (!currentMedia) return

    const fetchLikes = async () => {
      try {
        const likesList = await likeService.getLikes(currentMedia.id)
        setLikes(likesList)
      } catch (error) {
        console.error('Failed to fetch likes:', error)
        setLikes([])
      }
    }

    fetchLikes()
  }, [currentMedia?.id, likesVersion])

  const handleLikeChange = useCallback(() => {
    setLikesVersion((v) => v + 1)
  }, [])

  // Fetch comments for current media
  const [commentsVersion, setCommentsVersion] = useState(0)

  useEffect(() => {
    if (!currentMedia) return

    const fetchComments = async () => {
      try {
        const commentsList = await commentService.getComments(currentMedia.id)
        setComments(commentsList)
      } catch (error) {
        console.error('Failed to fetch comments:', error)
        setComments([])
      }
    }

    fetchComments()
  }, [currentMedia?.id, commentsVersion])

  const handleAddComment = useCallback(async () => {
    if (!currentMedia || !newComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      await commentService.addComment(currentMedia.id, newComment.trim())
      setNewComment('')
      setCommentsVersion((v) => v + 1)
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }, [currentMedia, newComment, isSubmittingComment])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!currentMedia) return

    try {
      await commentService.deleteComment(currentMedia.id, commentId)
      setCommentsVersion((v) => v + 1)
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }, [currentMedia])

  const handleCommentKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddComment()
    }
  }, [handleAddComment])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < media.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, media.length])

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, MAX_ZOOM))
    setIsFitMode(false)
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, MIN_ZOOM))
    setIsFitMode(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!currentMedia || currentMedia.type !== 'PHOTO') return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)))
    setIsFitMode(false)
  }, [currentMedia])

  const handleImageClick = useCallback(() => {
    if (isFitMode) {
      setZoom(2)
      setIsFitMode(false)
    } else {
      setZoom(1)
      setIsFitMode(true)
    }
  }, [isFitMode])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur()
        }
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious()
          break
        case 'ArrowRight':
          handleNext()
          break
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrevious, handleNext, onClose, handleZoomIn, handleZoomOut])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Touch/swipe support
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartX.current
    const deltaY = touchEndY - touchStartY.current

    // Only handle horizontal swipes (ignore vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        handlePrevious()
      } else {
        handleNext()
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  // Handle empty media array after all hooks
  if (!media.length || !currentMedia) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300',
        isAnimating ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90" />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        aria-label="닫기"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Top controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {/* Position indicator */}
        <div className="px-3 py-1.5 rounded-full bg-black/50 text-white text-sm font-medium">
          {currentIndex + 1} / {media.length}
        </div>

        {/* Info toggle button */}
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className={cn(
            'p-2 rounded-full transition-colors',
            showMetadata ? 'bg-pink-500 text-white' : 'bg-black/50 hover:bg-black/70 text-white'
          )}
          aria-label="정보 보기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Like button */}
        <LikeButton
          mediaId={currentMedia.id}
          initialIsLiked={currentMedia.isLiked}
          initialLikeCount={currentMedia.likeCount}
          variant="icon"
          className="!bg-black/50 hover:!bg-black/70"
          onLikeChange={handleLikeChange}
        />

        {/* Download button */}
        <DownloadButton
          mediaId={currentMedia.id}
          fileName={currentMedia.originalName}
          variant="icon"
          size="md"
          className="!bg-black/50 hover:!bg-black/70"
        />
      </div>

      {/* Zoom controls (only for photos) */}
      {currentMedia.type === 'PHOTO' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-black/50">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="p-1.5 rounded-full hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="축소"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-white text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="p-1.5 rounded-full hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="확대"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          aria-label="이전"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {currentIndex < media.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          aria-label="다음"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Media content */}
      <div
        className={cn(
          'relative z-10 max-w-full max-h-full flex items-center justify-center transition-transform duration-300',
          isAnimating ? 'scale-100' : 'scale-95'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {currentMedia.type === 'PHOTO' ? (
          <img
            ref={imageRef}
            src={currentMedia.url}
            alt={currentMedia.originalName}
            className="max-w-[90vw] max-h-[90vh] object-contain cursor-zoom-in transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            onClick={handleImageClick}
            onWheel={handleWheel}
            draggable={false}
          />
        ) : (
          <video
            ref={videoRef}
            src={currentMedia.url}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            controls
            autoPlay
            playsInline
          />
        )}
      </div>

      {/* Metadata panel */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-80 bg-black/80 backdrop-blur-sm z-30 transition-transform duration-300 overflow-y-auto',
          showMetadata ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-6 pt-16">
          <h3 className="text-white font-semibold text-lg mb-4">미디어 정보</h3>

          <div className="space-y-4">
            {/* File name */}
            <div>
              <label className="text-gray-400 text-sm">파일명</label>
              <p className="text-white break-all">{currentMedia.originalName}</p>
            </div>

            {/* Type */}
            <div>
              <label className="text-gray-400 text-sm">유형</label>
              <p className="text-white">{currentMedia.type === 'PHOTO' ? '사진' : '동영상'}</p>
            </div>

            {/* Date */}
            <div>
              <label className="text-gray-400 text-sm">촬영일</label>
              <p className="text-white">
                {currentMedia.takenAt
                  ? formatDate(currentMedia.takenAt)
                  : formatDate(currentMedia.createdAt)}
              </p>
            </div>

            {/* Upload date */}
            <div>
              <label className="text-gray-400 text-sm">업로드일</label>
              <p className="text-white">{formatDate(currentMedia.createdAt)}</p>
            </div>

            {/* File size */}
            <div>
              <label className="text-gray-400 text-sm">파일 크기</label>
              <p className="text-white">{formatFileSize(currentMedia.size)}</p>
            </div>

            {/* Dimensions (for photos and videos) */}
            {currentMedia.width && currentMedia.height && (
              <div>
                <label className="text-gray-400 text-sm">해상도</label>
                <p className="text-white">
                  {currentMedia.width} x {currentMedia.height}
                </p>
              </div>
            )}

            {/* Duration (for videos) */}
            {currentMedia.type === 'VIDEO' && currentMedia.duration && (
              <div>
                <label className="text-gray-400 text-sm">재생 시간</label>
                <p className="text-white">{formatDuration(currentMedia.duration)}</p>
              </div>
            )}

            {/* Uploader */}
            <div>
              <label className="text-gray-400 text-sm">업로더</label>
              <p className="text-white">{currentMedia.uploaderName}</p>
            </div>

            {/* Likes */}
            <div>
              <label className="text-gray-400 text-sm">좋아요 {likes.length > 0 && `(${likes.length})`}</label>
              {likes.length > 0 ? (
                <div className="mt-1 space-y-1.5">
                  {likes.map((like) => (
                    <div key={like.userId} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-pink-600">
                          {like.userName.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate">{like.userName}</p>
                        <p className="text-gray-500 text-xs">{formatDate(like.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-1">아직 좋아요가 없습니다</p>
              )}
            </div>

            {/* Comments */}
            <div>
              <label className="text-gray-400 text-sm">댓글 {comments.length > 0 && `(${comments.length})`}</label>
              {comments.length > 0 ? (
                <div className="mt-1 space-y-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2 group">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600">
                          {comment.userName.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-white text-sm font-medium truncate">{comment.userName}</p>
                          <span className="text-gray-500 text-xs flex-shrink-0">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-300 text-sm break-all">{comment.content}</p>
                      </div>
                      {currentUser && String(currentUser.id) === comment.userId && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400 transition-all flex-shrink-0"
                          aria-label="댓글 삭제"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-1">아직 댓글이 없습니다</p>
              )}

              {/* Comment input */}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="댓글을 입력하세요..."
                  maxLength={500}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors flex-shrink-0"
                >
                  {isSubmittingComment ? '...' : '전송'}
                </button>
              </div>
            </div>

            {/* MIME type */}
            <div>
              <label className="text-gray-400 text-sm">MIME 타입</label>
              <p className="text-white text-sm">{currentMedia.mimeType}</p>
            </div>
          </div>

          {/* Full download button in metadata panel */}
          <div className="mt-6">
            <DownloadButton
              mediaId={currentMedia.id}
              fileName={currentMedia.originalName}
              variant="button"
              size="md"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
