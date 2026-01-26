import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DateHeader } from '../DateHeader'

// Mock utility function
jest.mock('@/lib/utils', () => ({
  formatDate: (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  },
}))

describe('DateHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render formatted date correctly', () => {
      render(<DateHeader date="2024-01-15" count={5} />)

      const formattedDate = new Date('2024-01-15').toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      expect(screen.getByText(formattedDate)).toBeInTheDocument()
    })

    it('should show media count', () => {
      render(<DateHeader date="2024-01-15" count={5} />)

      expect(screen.getByText('5 items')).toBeInTheDocument()
    })

    it('should handle singular count', () => {
      render(<DateHeader date="2024-01-15" count={1} />)

      expect(screen.getByText('1 items')).toBeInTheDocument()
    })

    it('should handle zero count', () => {
      render(<DateHeader date="2024-01-15" count={0} />)

      expect(screen.getByText('0 items')).toBeInTheDocument()
    })

    it('should handle large count', () => {
      render(<DateHeader date="2024-01-15" count={1000} />)

      expect(screen.getByText('1000 items')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should apply sticky positioning class', () => {
      const { container } = render(<DateHeader date="2024-01-15" count={5} />)

      const header = container.querySelector('.sticky')
      expect(header).toBeInTheDocument()
    })

    it('should have backdrop blur effect', () => {
      const { container } = render(<DateHeader date="2024-01-15" count={5} />)

      const header = container.querySelector('.backdrop-blur-sm')
      expect(header).toBeInTheDocument()
    })

    it('should have z-index for stacking', () => {
      const { container } = render(<DateHeader date="2024-01-15" count={5} />)

      const header = container.querySelector('.z-10')
      expect(header).toBeInTheDocument()
    })

    it('should render divider line', () => {
      const { container } = render(<DateHeader date="2024-01-15" count={5} />)

      const divider = container.querySelector('.h-px.bg-gray-200\\/50')
      expect(divider).toBeInTheDocument()
    })
  })

  describe('date formatting', () => {
    it('should format ISO date string', () => {
      render(<DateHeader date="2024-01-15" count={5} />)

      const formattedDate = new Date('2024-01-15').toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      expect(screen.getByText(formattedDate)).toBeInTheDocument()
    })

    it('should handle different date formats', () => {
      render(<DateHeader date="2024-12-31" count={10} />)

      const formattedDate = new Date('2024-12-31').toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      expect(screen.getByText(formattedDate)).toBeInTheDocument()
    })

    it('should handle leap year date', () => {
      render(<DateHeader date="2024-02-29" count={3} />)

      const formattedDate = new Date('2024-02-29').toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      expect(screen.getByText(formattedDate)).toBeInTheDocument()
    })
  })

  describe('layout', () => {
    it('should render date and count in flex container', () => {
      const { container } = render(<DateHeader date="2024-01-15" count={5} />)

      const flexContainer = container.querySelector('.flex.items-center.justify-between')
      expect(flexContainer).toBeInTheDocument()
    })

    it('should have proper spacing classes', () => {
      const { container } = render(<DateHeader date="2024-01-15" count={5} />)

      const innerFlex = container.querySelector('.flex.items-center.gap-3')
      expect(innerFlex).toBeInTheDocument()
    })

    it('should have padding for content', () => {
      const { container } = render(<DateHeader date="2024-01-15" count={5} />)

      const paddedContainer = container.querySelector('.px-2.py-3')
      expect(paddedContainer).toBeInTheDocument()
    })
  })

  describe('text styling', () => {
    it('should apply font weight to date', () => {
      const { container } = render(<DateHeader date="2024-01-15" count={5} />)

      const formattedDate = new Date('2024-01-15').toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const dateElement = screen.getByText(formattedDate)
      expect(dateElement).toHaveClass('font-medium', 'text-gray-700')
    })

    it('should apply smaller text style to count', () => {
      render(<DateHeader date="2024-01-15" count={5} />)

      const countElement = screen.getByText('5 items')
      expect(countElement).toHaveClass('text-sm', 'text-gray-500')
    })
  })
})
