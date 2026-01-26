import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MediaViewer } from '../MediaViewer'
import { Media } from '@/types'

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  formatDate: (dateString: string) => new Date(dateString).toLocaleDateString('ko-KR'),
  formatFileSize: (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`,
  formatDuration: (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`,
}))

// Mock DownloadButton component
jest.mock('../DownloadButton', () => ({
  DownloadButton: ({ mediaId, fileName }: any) => (
    <button data-testid={`download-${mediaId}`}>Download {fileName}</button>
  ),
}))

describe('MediaViewer', () => {
  const mockPhotoMedia: Media = {
    id: '1',
    type: 'PHOTO',
    originalName: 'photo1.jpg',
    url: 'https://example.com/photo1.jpg',
    size: 1024000,
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
    createdAt: '2024-01-15T10:00:00Z',
    uploaderId: '1',
    uploaderName: 'Test User',
  }

  const mockVideoMedia: Media = {
    id: '2',
    type: 'VIDEO',
    originalName: 'video1.mp4',
    url: 'https://example.com/video1.mp4',
    size: 5120000,
    mimeType: 'video/mp4',
    duration: 125,
    width: 1920,
    height: 1080,
    createdAt: '2024-01-15T11:00:00Z',
    uploaderId: '1',
    uploaderName: 'Test User',
  }

  const mockMediaList = [mockPhotoMedia, mockVideoMedia]

  beforeEach(() => {
    jest.clearAllMocks()
    document.body.style.overflow = 'auto'
  })

  afterEach(() => {
    document.body.style.overflow = 'auto'
  })

  describe('basic rendering', () => {
    it('should render current media', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      expect(screen.getByAltText('photo1.jpg')).toBeInTheDocument()
    })

    it('should render nothing when media array is empty', () => {
      const { container } = render(<MediaViewer media={[]} initialIndex={0} onClose={jest.fn()} />)

      expect(container.firstChild).toBeNull()
    })

    it('should show position indicator', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      expect(screen.getByText('1 / 2')).toBeInTheDocument()
    })

    it('should lock body scroll when open', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should restore body scroll on unmount', () => {
      const { unmount } = render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      unmount()
      expect(document.body.style.overflow).toBe('auto')
    })
  })

  describe('close functionality', () => {
    it('should call onClose when X button is clicked', () => {
      const mockOnClose = jest.fn()
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={mockOnClose} />)

      const closeButton = screen.getByLabelText('닫기')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop is clicked', () => {
      const mockOnClose = jest.fn()
      const { container } = render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={mockOnClose} />)

      const backdrop = container.firstChild as HTMLElement
      fireEvent.click(backdrop)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when clicking on content', () => {
      const mockOnClose = jest.fn()
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={mockOnClose} />)

      const image = screen.getByAltText('photo1.jpg')
      fireEvent.click(image)

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should call onClose on Escape key', () => {
      const mockOnClose = jest.fn()
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={mockOnClose} />)

      fireEvent.keyDown(window, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('navigation', () => {
    it('should navigate to next media on arrow click', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      const nextButton = screen.getByLabelText('다음')
      fireEvent.click(nextButton)

      expect(screen.getByText('2 / 2')).toBeInTheDocument()
    })

    it('should navigate to previous media on arrow click', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={1} onClose={jest.fn()} />)

      const prevButton = screen.getByLabelText('이전')
      fireEvent.click(prevButton)

      expect(screen.getByText('1 / 2')).toBeInTheDocument()
    })

    it('should not show previous button on first item', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      expect(screen.queryByLabelText('이전')).not.toBeInTheDocument()
    })

    it('should not show next button on last item', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={1} onClose={jest.fn()} />)

      expect(screen.queryByLabelText('다음')).not.toBeInTheDocument()
    })

    it('should navigate on ArrowRight key', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      fireEvent.keyDown(window, { key: 'ArrowRight' })

      expect(screen.getByText('2 / 2')).toBeInTheDocument()
    })

    it('should navigate on ArrowLeft key', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={1} onClose={jest.fn()} />)

      fireEvent.keyDown(window, { key: 'ArrowLeft' })

      expect(screen.getByText('1 / 2')).toBeInTheDocument()
    })

    it('should not navigate past last item', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={1} onClose={jest.fn()} />)

      fireEvent.keyDown(window, { key: 'ArrowRight' })

      expect(screen.getByText('2 / 2')).toBeInTheDocument()
    })

    it('should not navigate before first item', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      fireEvent.keyDown(window, { key: 'ArrowLeft' })

      expect(screen.getByText('1 / 2')).toBeInTheDocument()
    })
  })

  describe('zoom controls for photos', () => {
    it('should show zoom controls for photos', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      expect(screen.getByLabelText('축소')).toBeInTheDocument()
      expect(screen.getByLabelText('확대')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('should not show zoom controls for videos', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={1} onClose={jest.fn()} />)

      expect(screen.queryByLabelText('축소')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('확대')).not.toBeInTheDocument()
    })

    it('should zoom in on zoom in button click', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      const zoomInButton = screen.getByLabelText('확대')
      fireEvent.click(zoomInButton)

      expect(screen.getByText('125%')).toBeInTheDocument()
    })

    it('should zoom out on zoom out button click', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      const zoomInButton = screen.getByLabelText('확대')
      fireEvent.click(zoomInButton)

      const zoomOutButton = screen.getByLabelText('축소')
      fireEvent.click(zoomOutButton)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('should disable zoom in at max zoom', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      const zoomInButton = screen.getByLabelText('확대')
      // Zoom to max (300%)
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomInButton)
      }

      expect(zoomInButton).toBeDisabled()
      expect(screen.getByText('300%')).toBeInTheDocument()
    })

    it('should disable zoom out at min zoom', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      const zoomOutButton = screen.getByLabelText('축소')
      // Zoom to min (50%)
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomOutButton)
      }

      expect(zoomOutButton).toBeDisabled()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
  })

  describe('video player', () => {
    it('should show video player for videos', () => {
      const { container } = render(<MediaViewer media={mockMediaList} initialIndex={1} onClose={jest.fn()} />)

      const video = container.querySelector('video')
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute('src', 'https://example.com/video1.mp4')
    })

    it('should have controls enabled for videos', () => {
      const { container } = render(<MediaViewer media={mockMediaList} initialIndex={1} onClose={jest.fn()} />)

      const video = container.querySelector('video')
      expect(video).toHaveAttribute('controls')
    })

    it('should autoplay videos', () => {
      const { container } = render(<MediaViewer media={mockMediaList} initialIndex={1} onClose={jest.fn()} />)

      const video = container.querySelector('video')
      expect(video).toHaveAttribute('autoPlay')
    })
  })

  describe('download button', () => {
    it('should show download button', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      expect(screen.getAllByTestId('download-1')).toHaveLength(2)
    })

    it('should show correct download button for current media', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={1} onClose={jest.fn()} />)

      expect(screen.getAllByTestId('download-2')).toHaveLength(2)
    })
  })

  describe('metadata panel', () => {
    it('should toggle metadata panel on info button click', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      const infoButton = screen.getByLabelText('정보 보기')
      fireEvent.click(infoButton)

      expect(screen.getByText('미디어 정보')).toBeInTheDocument()
    })

    it('should show file information', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      const infoButton = screen.getByLabelText('정보 보기')
      fireEvent.click(infoButton)

      expect(screen.getByText('photo1.jpg')).toBeInTheDocument()
      expect(screen.getByText('사진')).toBeInTheDocument()
    })

    it('should show video type for videos', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={1} onClose={jest.fn()} />)

      const infoButton = screen.getByLabelText('정보 보기')
      fireEvent.click(infoButton)

      expect(screen.getByText('동영상')).toBeInTheDocument()
    })

    it('should show duration for videos', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={1} onClose={jest.fn()} />)

      const infoButton = screen.getByLabelText('정보 보기')
      fireEvent.click(infoButton)

      expect(screen.getByText('2:05')).toBeInTheDocument()
    })

    it('should show dimensions', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      const infoButton = screen.getByLabelText('정보 보기')
      fireEvent.click(infoButton)

      expect(screen.getByText('1920 x 1080')).toBeInTheDocument()
    })
  })

  describe('keyboard shortcuts', () => {
    it('should zoom in on + key', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      fireEvent.keyDown(window, { key: '+' })

      expect(screen.getByText('125%')).toBeInTheDocument()
    })

    it('should zoom in on = key', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      fireEvent.keyDown(window, { key: '=' })

      expect(screen.getByText('125%')).toBeInTheDocument()
    })

    it('should zoom out on - key', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      fireEvent.keyDown(window, { key: '-' })

      expect(screen.getByText('75%')).toBeInTheDocument()
    })
  })

  describe('zoom reset on media change', () => {
    it('should reset zoom when navigating to next media', () => {
      render(<MediaViewer media={mockMediaList} initialIndex={0} onClose={jest.fn()} />)

      // Zoom in first photo
      const zoomInButton = screen.getByLabelText('확대')
      fireEvent.click(zoomInButton)
      expect(screen.getByText('125%')).toBeInTheDocument()

      // Navigate to video (no zoom controls)
      fireEvent.keyDown(window, { key: 'ArrowRight' })

      // Navigate back to photo
      fireEvent.keyDown(window, { key: 'ArrowLeft' })

      // Zoom should be reset
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })
})
