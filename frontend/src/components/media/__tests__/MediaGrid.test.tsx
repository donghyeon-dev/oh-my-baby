import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MediaGrid } from '../MediaGrid'
import { Media, MediaListResponse } from '@/types'
import { mediaService } from '@/services/media'

// Mock media service
jest.mock('@/services/media', () => ({
  mediaService: {
    getMediaList: jest.fn(),
  },
}))

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  groupMediaByDate: (items: any[]) => {
    const grouped = new Map()
    items.forEach((item) => {
      const date = item.createdAt.split('T')[0]
      if (!grouped.has(date)) {
        grouped.set(date, [])
      }
      grouped.get(date).push(item)
    })
    return grouped
  },
}))

// Mock child components
jest.mock('../MediaCard', () => ({
  MediaCard: ({ media, onClick, selectable, selected, onSelect }: any) => (
    <div
      data-testid={`media-card-${media.id}`}
      onClick={onClick}
      className={selectable ? 'selectable' : ''}
    >
      {media.originalName}
      {selectable && (
        <button
          data-testid={`checkbox-${media.id}`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(!selected)
          }}
        >
          {selected ? 'Selected' : 'Not Selected'}
        </button>
      )}
    </div>
  ),
}))

jest.mock('../DateHeader', () => ({
  DateHeader: ({ date, count }: any) => (
    <div data-testid={`date-header-${date}`}>
      {date} - {count} items
    </div>
  ),
}))

describe('MediaGrid', () => {
  const mockMedia: Media[] = [
    {
      id: '1',
      type: 'PHOTO',
      originalName: 'photo1.jpg',
      url: 'https://example.com/photo1.jpg',
      size: 1024000,
      mimeType: 'image/jpeg',
      createdAt: '2024-01-15T10:00:00Z',
      uploaderId: '1',
      uploaderName: 'User 1',
    },
    {
      id: '2',
      type: 'VIDEO',
      originalName: 'video1.mp4',
      url: 'https://example.com/video1.mp4',
      size: 5120000,
      mimeType: 'video/mp4',
      createdAt: '2024-01-15T11:00:00Z',
      uploaderId: '1',
      uploaderName: 'User 1',
    },
    {
      id: '3',
      type: 'PHOTO',
      originalName: 'photo2.jpg',
      url: 'https://example.com/photo2.jpg',
      size: 2048000,
      mimeType: 'image/jpeg',
      createdAt: '2024-01-14T10:00:00Z',
      uploaderId: '2',
      uploaderName: 'User 2',
    },
  ]

  const mockResponse: MediaListResponse = {
    content: mockMedia,
    page: 0,
    size: 24,
    totalElements: 3,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(mediaService.getMediaList as jest.Mock).mockResolvedValue(mockResponse)
  })

  describe('initial rendering', () => {
    it('should render loading skeleton initially', () => {
      const { container } = render(<MediaGrid />)

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should render media cards after fetch', async () => {
      render(<MediaGrid />)

      await waitFor(() => {
        expect(screen.getByText('photo1.jpg')).toBeInTheDocument()
        expect(screen.getByText('video1.mp4')).toBeInTheDocument()
        expect(screen.getByText('photo2.jpg')).toBeInTheDocument()
      })
    })

    it('should call mediaService.getMediaList on mount', async () => {
      render(<MediaGrid />)

      await waitFor(() => {
        expect(mediaService.getMediaList).toHaveBeenCalledWith({
          page: 0,
          size: 24,
        })
      })
    })
  })

  describe('date grouping', () => {
    it('should group media by date', async () => {
      render(<MediaGrid />)

      await waitFor(() => {
        expect(screen.getByTestId('date-header-2024-01-15')).toBeInTheDocument()
        expect(screen.getByTestId('date-header-2024-01-14')).toBeInTheDocument()
      })
    })

    it('should show correct count for each date group', async () => {
      render(<MediaGrid />)

      await waitFor(() => {
        expect(screen.getByText('2024-01-15 - 2 items')).toBeInTheDocument()
        expect(screen.getByText('2024-01-14 - 1 items')).toBeInTheDocument()
      })
    })

    it('should sort dates in descending order', async () => {
      render(<MediaGrid />)

      await waitFor(() => {
        const headers = screen.getAllByTestId(/date-header/)
        expect(headers[0]).toHaveAttribute('data-testid', 'date-header-2024-01-15')
        expect(headers[1]).toHaveAttribute('data-testid', 'date-header-2024-01-14')
      })
    })
  })

  describe('media click', () => {
    it('should call onMediaClick when card clicked', async () => {
      const mockOnMediaClick = jest.fn()
      render(<MediaGrid onMediaClick={mockOnMediaClick} />)

      await waitFor(() => {
        const card = screen.getByTestId('media-card-1')
        fireEvent.click(card)
      })

      expect(mockOnMediaClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1' }),
        0,
        mockMedia
      )
    })

    it('should pass correct index to onMediaClick', async () => {
      const mockOnMediaClick = jest.fn()
      render(<MediaGrid onMediaClick={mockOnMediaClick} />)

      await waitFor(() => {
        const card = screen.getByTestId('media-card-2')
        fireEvent.click(card)
      })

      expect(mockOnMediaClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: '2' }),
        1,
        mockMedia
      )
    })

    it('should pass all media to onMediaClick', async () => {
      const mockOnMediaClick = jest.fn()
      render(<MediaGrid onMediaClick={mockOnMediaClick} />)

      await waitFor(() => {
        const card = screen.getByTestId('media-card-1')
        fireEvent.click(card)
      })

      expect(mockOnMediaClick).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        mockMedia
      )
    })
  })

  describe('selection functionality', () => {
    it('should pass selection props to cards when selectable', async () => {
      render(<MediaGrid selectable={true} selectedIds={new Set(['1'])} />)

      await waitFor(() => {
        const card = screen.getByTestId('media-card-1')
        expect(card).toHaveClass('selectable')
      })
    })

    it('should call onSelectionChange when checkbox clicked', async () => {
      const mockOnSelectionChange = jest.fn()
      render(
        <MediaGrid
          selectable={true}
          selectedIds={new Set()}
          onSelectionChange={mockOnSelectionChange}
        />
      )

      await waitFor(() => {
        const checkbox = screen.getByTestId('checkbox-1')
        fireEvent.click(checkbox)
      })

      expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set(['1']))
    })

    it('should add id to selection when checked', async () => {
      const mockOnSelectionChange = jest.fn()
      render(
        <MediaGrid
          selectable={true}
          selectedIds={new Set(['2'])}
          onSelectionChange={mockOnSelectionChange}
        />
      )

      await waitFor(() => {
        const checkbox = screen.getByTestId('checkbox-1')
        fireEvent.click(checkbox)
      })

      expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set(['2', '1']))
    })

    it('should remove id from selection when unchecked', async () => {
      const mockOnSelectionChange = jest.fn()
      render(
        <MediaGrid
          selectable={true}
          selectedIds={new Set(['1', '2'])}
          onSelectionChange={mockOnSelectionChange}
        />
      )

      await waitFor(() => {
        const checkbox = screen.getByTestId('checkbox-1')
        fireEvent.click(checkbox)
      })

      expect(mockOnSelectionChange).toHaveBeenCalledWith(new Set(['2']))
    })
  })

  describe('empty state', () => {
    it('should show empty state when no media', async () => {
      ;(mediaService.getMediaList as jest.Mock).mockResolvedValue({
        ...mockResponse,
        content: [],
        totalElements: 0,
      })

      render(<MediaGrid />)

      await waitFor(() => {
        expect(screen.getByText('No media found')).toBeInTheDocument()
        expect(screen.getByText('Upload some photos or videos to get started')).toBeInTheDocument()
      })
    })

    it('should render empty state icon', async () => {
      ;(mediaService.getMediaList as jest.Mock).mockResolvedValue({
        ...mockResponse,
        content: [],
        totalElements: 0,
      })

      const { container } = render(<MediaGrid />)

      await waitFor(() => {
        const icon = container.querySelector('.text-gray-300')
        expect(icon).toBeInTheDocument()
      })
    })
  })

  describe('error state', () => {
    it('should show error message on fetch failure', async () => {
      ;(mediaService.getMediaList as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<MediaGrid />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load media. Please try again.')).toBeInTheDocument()
      })
    })

    it('should show retry button on error', async () => {
      ;(mediaService.getMediaList as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<MediaGrid />)

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should retry on retry button click', async () => {
      ;(mediaService.getMediaList as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
      ;(mediaService.getMediaList as jest.Mock).mockResolvedValueOnce(mockResponse)

      render(<MediaGrid />)

      await waitFor(() => {
        const retryButton = screen.getByText('Retry')
        fireEvent.click(retryButton)
      })

      await waitFor(() => {
        expect(screen.getByText('photo1.jpg')).toBeInTheDocument()
      })
    })
  })

  describe('filters', () => {
    it('should pass filters to mediaService', async () => {
      const filters = { type: 'PHOTO' as const, startDate: '2024-01-01' }
      render(<MediaGrid filters={filters} />)

      await waitFor(() => {
        expect(mediaService.getMediaList).toHaveBeenCalledWith({
          ...filters,
          page: 0,
          size: 24,
        })
      })
    })

    it('should reset and refetch when filters change', async () => {
      const { rerender } = render(<MediaGrid filters={{ type: 'PHOTO' }} />)

      await waitFor(() => {
        expect(mediaService.getMediaList).toHaveBeenCalledWith({
          type: 'PHOTO',
          page: 0,
          size: 24,
        })
      })

      rerender(<MediaGrid filters={{ type: 'VIDEO' }} />)

      await waitFor(() => {
        expect(mediaService.getMediaList).toHaveBeenCalledWith({
          type: 'VIDEO',
          page: 0,
          size: 24,
        })
      })
    })
  })

  describe('infinite scroll', () => {
    it('should show loading indicator when loading more', async () => {
      ;(mediaService.getMediaList as jest.Mock).mockResolvedValueOnce({
        ...mockResponse,
        hasNext: true,
      })

      render(<MediaGrid />)

      await waitFor(() => {
        expect(screen.getByText('photo1.jpg')).toBeInTheDocument()
      })

      // Mock the IntersectionObserver to trigger loading more
      const loadMoreTrigger = document.querySelector('[class*="h-px"]')
      expect(loadMoreTrigger).toBeInTheDocument()
    })

    it('should not load more when already loading', async () => {
      render(<MediaGrid />)

      await waitFor(() => {
        expect(mediaService.getMediaList).toHaveBeenCalledTimes(1)
      })
    })

    it('should not load more when hasNext is false', async () => {
      ;(mediaService.getMediaList as jest.Mock).mockResolvedValue({
        ...mockResponse,
        hasNext: false,
      })

      render(<MediaGrid />)

      await waitFor(() => {
        expect(screen.getByText('photo1.jpg')).toBeInTheDocument()
      })

      // Should not try to load more
      expect(mediaService.getMediaList).toHaveBeenCalledTimes(1)
    })
  })
})
