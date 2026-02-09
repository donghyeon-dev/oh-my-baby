import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LikeButton } from '../LikeButton'
import likeService from '@/services/like'

jest.mock('@/services/like')
const mockedLikeService = likeService as jest.Mocked<typeof likeService>

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

describe('LikeButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('icon variant', () => {
    it('should render with default state (not liked)', () => {
      render(<LikeButton mediaId="media-123" />)

      const button = screen.getByLabelText('좋아요')
      expect(button).toBeInTheDocument()
    })

    it('should render liked state', () => {
      render(<LikeButton mediaId="media-123" initialIsLiked={true} />)

      const button = screen.getByLabelText('좋아요 취소')
      expect(button).toBeInTheDocument()
    })

    it('should toggle like on click with optimistic update', async () => {
      mockedLikeService.toggleLike.mockResolvedValueOnce({
        mediaId: 'media-123',
        isLiked: true,
        likeCount: 1,
      })

      render(<LikeButton mediaId="media-123" initialIsLiked={false} initialLikeCount={0} />)

      const button = screen.getByLabelText('좋아요')
      fireEvent.click(button)

      // Optimistic: should immediately show liked state
      expect(screen.getByLabelText('좋아요 취소')).toBeInTheDocument()

      await waitFor(() => {
        expect(mockedLikeService.toggleLike).toHaveBeenCalledWith('media-123')
      })
    })

    it('should toggle unlike on click with optimistic update', async () => {
      mockedLikeService.toggleLike.mockResolvedValueOnce({
        mediaId: 'media-123',
        isLiked: false,
        likeCount: 4,
      })

      render(<LikeButton mediaId="media-123" initialIsLiked={true} initialLikeCount={5} />)

      const button = screen.getByLabelText('좋아요 취소')
      fireEvent.click(button)

      // Optimistic: should immediately show unliked state
      expect(screen.getByLabelText('좋아요')).toBeInTheDocument()

      await waitFor(() => {
        expect(mockedLikeService.toggleLike).toHaveBeenCalledWith('media-123')
      })
    })

    it('should revert on API error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockedLikeService.toggleLike.mockRejectedValueOnce(new Error('Network error'))

      render(<LikeButton mediaId="media-123" initialIsLiked={false} initialLikeCount={0} />)

      const button = screen.getByLabelText('좋아요')
      fireEvent.click(button)

      // Optimistic: immediately liked
      expect(screen.getByLabelText('좋아요 취소')).toBeInTheDocument()

      // After error: reverts to original
      await waitFor(() => {
        expect(screen.getByLabelText('좋아요')).toBeInTheDocument()
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to toggle like:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })

    it('should stop event propagation on click', async () => {
      mockedLikeService.toggleLike.mockResolvedValueOnce({
        mediaId: 'media-123',
        isLiked: true,
        likeCount: 1,
      })

      const parentClickHandler = jest.fn()
      render(
        <div onClick={parentClickHandler}>
          <LikeButton mediaId="media-123" />
        </div>
      )

      const button = screen.getByLabelText('좋아요')
      fireEvent.click(button)

      expect(parentClickHandler).not.toHaveBeenCalled()
    })
  })

  describe('button variant', () => {
    it('should render with count', () => {
      render(
        <LikeButton
          mediaId="media-123"
          variant="button"
          initialLikeCount={10}
          initialIsLiked={false}
        />
      )

      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByLabelText('좋아요')).toBeInTheDocument()
    })

    it('should show updated count after toggle', async () => {
      mockedLikeService.toggleLike.mockResolvedValueOnce({
        mediaId: 'media-123',
        isLiked: true,
        likeCount: 11,
      })

      render(
        <LikeButton
          mediaId="media-123"
          variant="button"
          initialLikeCount={10}
          initialIsLiked={false}
        />
      )

      expect(screen.getByText('10')).toBeInTheDocument()

      const button = screen.getByLabelText('좋아요')
      fireEvent.click(button)

      // Optimistic: count increases immediately
      expect(screen.getByText('11')).toBeInTheDocument()

      await waitFor(() => {
        expect(mockedLikeService.toggleLike).toHaveBeenCalledWith('media-123')
      })
    })

    it('should render liked button variant', () => {
      render(
        <LikeButton
          mediaId="media-123"
          variant="button"
          initialLikeCount={5}
          initialIsLiked={true}
        />
      )

      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByLabelText('좋아요 취소')).toBeInTheDocument()
    })
  })
})
