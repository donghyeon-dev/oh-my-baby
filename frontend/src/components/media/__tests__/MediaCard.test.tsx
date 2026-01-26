import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MediaCard } from '../MediaCard'
import { Media } from '@/types'

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  formatDuration: (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`,
}))

describe('MediaCard', () => {
  const mockPhotoMedia: Media = {
    id: '1',
    type: 'PHOTO',
    originalName: 'test-photo.jpg',
    url: 'https://example.com/photo.jpg',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    size: 1024000,
    mimeType: 'image/jpeg',
    createdAt: '2024-01-15T10:00:00Z',
    uploaderId: '1',
    uploaderName: 'Test User',
  }

  const mockVideoMedia: Media = {
    id: '2',
    type: 'VIDEO',
    originalName: 'test-video.mp4',
    url: 'https://example.com/video.mp4',
    size: 5120000,
    mimeType: 'video/mp4',
    duration: 125,
    createdAt: '2024-01-15T11:00:00Z',
    uploaderId: '1',
    uploaderName: 'Test User',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('photo rendering', () => {
    it('should render photo thumbnail correctly', () => {
      render(<MediaCard media={mockPhotoMedia} />)

      const img = screen.getByAltText('test-photo.jpg')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg')
    })

    it('should show camera icon for PHOTO type', () => {
      render(<MediaCard media={mockPhotoMedia} />)

      // Camera icon is rendered after image loads
      const img = screen.getByAltText('test-photo.jpg')
      fireEvent.load(img)

      const cameraIcon = screen.getByRole('img', { hidden: true }).closest('div')?.querySelector('svg')
      expect(cameraIcon).toBeInTheDocument()
    })

    it('should use original url when thumbnailUrl is not available', () => {
      const mediaWithoutThumbnail = { ...mockPhotoMedia, thumbnailUrl: undefined }
      render(<MediaCard media={mediaWithoutThumbnail} />)

      const img = screen.getByAltText('test-photo.jpg')
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    })
  })

  describe('video rendering', () => {
    it('should render video element for VIDEO type', () => {
      const { container } = render(<MediaCard media={mockVideoMedia} />)

      const video = container.querySelector('video')
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute('src', 'https://example.com/video.mp4')
    })

    it('should show play icon for VIDEO type', () => {
      const { container } = render(<MediaCard media={mockVideoMedia} />)

      const video = container.querySelector('video')
      fireEvent.loadedData(video!)

      const playIcon = container.querySelector('svg')
      expect(playIcon).toBeInTheDocument()
    })

    it('should show duration badge for videos', () => {
      const { container } = render(<MediaCard media={mockVideoMedia} />)

      const video = container.querySelector('video')
      fireEvent.loadedData(video!)

      expect(screen.getByText('2:05')).toBeInTheDocument()
    })

    it('should not show duration badge when duration is not available', () => {
      const videoWithoutDuration = { ...mockVideoMedia, duration: undefined }
      const { container } = render(<MediaCard media={videoWithoutDuration} />)

      const video = container.querySelector('video')
      fireEvent.loadedData(video!)

      expect(screen.queryByText(/:/)).not.toBeInTheDocument()
    })
  })

  describe('click interactions', () => {
    it('should call onClick when card is clicked', () => {
      const mockOnClick = jest.fn()
      render(<MediaCard media={mockPhotoMedia} onClick={mockOnClick} />)

      const card = screen.getByAltText('test-photo.jpg').closest('div')
      fireEvent.click(card!)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when selectable mode is enabled', () => {
      const mockOnClick = jest.fn()
      render(<MediaCard media={mockPhotoMedia} onClick={mockOnClick} selectable={true} />)

      const card = screen.getByAltText('test-photo.jpg').closest('div')
      fireEvent.click(card!)

      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('selection functionality', () => {
    it('should show checkbox when selectable is true', () => {
      const { container } = render(<MediaCard media={mockPhotoMedia} selectable={true} />)

      const checkbox = container.querySelector('.absolute.top-2.left-2')
      expect(checkbox).toBeInTheDocument()
    })

    it('should not show checkbox when selectable is false', () => {
      const { container } = render(<MediaCard media={mockPhotoMedia} selectable={false} />)

      const checkbox = container.querySelector('.absolute.top-2.left-2')
      expect(checkbox).not.toBeInTheDocument()
    })

    it('should toggle selection on checkbox click', () => {
      const mockOnSelect = jest.fn()
      const { container } = render(
        <MediaCard
          media={mockPhotoMedia}
          selectable={true}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const checkbox = container.querySelector('.absolute.top-2.left-2')
      fireEvent.click(checkbox!)

      expect(mockOnSelect).toHaveBeenCalledWith(true)
    })

    it('should toggle off when already selected', () => {
      const mockOnSelect = jest.fn()
      const { container } = render(
        <MediaCard
          media={mockPhotoMedia}
          selectable={true}
          selected={true}
          onSelect={mockOnSelect}
        />
      )

      const checkbox = container.querySelector('.absolute.top-2.left-2')
      fireEvent.click(checkbox!)

      expect(mockOnSelect).toHaveBeenCalledWith(false)
    })

    it('should stop propagation on checkbox click', () => {
      const mockOnClick = jest.fn()
      const mockOnSelect = jest.fn()
      const { container } = render(
        <MediaCard
          media={mockPhotoMedia}
          onClick={mockOnClick}
          selectable={true}
          onSelect={mockOnSelect}
        />
      )

      const checkbox = container.querySelector('.absolute.top-2.left-2')
      fireEvent.click(checkbox!)

      expect(mockOnSelect).toHaveBeenCalled()
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should apply selected styles when selected', () => {
      const { container } = render(
        <MediaCard media={mockPhotoMedia} selectable={true} selected={true} />
      )

      const card = screen.getByAltText('test-photo.jpg').closest('div')
      expect(card?.className).toContain('ring-2')
    })

    it('should show checkmark icon when selected', () => {
      const { container } = render(
        <MediaCard media={mockPhotoMedia} selectable={true} selected={true} />
      )

      const checkmark = container.querySelector('.absolute.top-2.left-2 svg')
      expect(checkmark).toBeInTheDocument()
    })

    it('should not show checkmark icon when not selected', () => {
      const { container } = render(
        <MediaCard media={mockPhotoMedia} selectable={true} selected={false} />
      )

      const checkmark = container.querySelector('.absolute.top-2.left-2 svg')
      expect(checkmark).not.toBeInTheDocument()
    })
  })

  describe('loading and error states', () => {
    it('should show loading skeleton initially', () => {
      const { container } = render(<MediaCard media={mockPhotoMedia} />)

      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })

    it('should hide loading skeleton after image loads', () => {
      const { container } = render(<MediaCard media={mockPhotoMedia} />)

      const img = screen.getByAltText('test-photo.jpg')
      fireEvent.load(img)

      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton).not.toBeInTheDocument()
    })

    it('should show error state when image fails to load', () => {
      const { container } = render(<MediaCard media={mockPhotoMedia} />)

      const img = screen.getByAltText('test-photo.jpg')
      fireEvent.error(img)

      const errorIcon = container.querySelector('.text-gray-300')
      expect(errorIcon).toBeInTheDocument()
    })

    it('should hide loading skeleton on error', () => {
      const { container } = render(<MediaCard media={mockPhotoMedia} />)

      const img = screen.getByAltText('test-photo.jpg')
      fireEvent.error(img)

      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton).not.toBeInTheDocument()
    })
  })

  describe('hover effects', () => {
    it('should have hover overlay element', () => {
      const { container } = render(<MediaCard media={mockPhotoMedia} />)

      const img = screen.getByAltText('test-photo.jpg')
      fireEvent.load(img)

      const overlay = container.querySelector('.group-hover\\:bg-black\\/20')
      expect(overlay).toBeInTheDocument()
    })

    it('should hide overlay when loading', () => {
      const { container } = render(<MediaCard media={mockPhotoMedia} />)

      const overlay = container.querySelector('.hidden')
      expect(overlay).toBeInTheDocument()
    })
  })
})
