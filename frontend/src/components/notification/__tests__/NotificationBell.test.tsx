import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NotificationBell } from '../NotificationBell'
import notificationService from '@/services/notification'
import { Notification } from '@/types'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock notification service
jest.mock('@/services/notification')
const mockedNotificationService = notificationService as jest.Mocked<typeof notificationService>

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

describe('NotificationBell', () => {
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'NEW_MEDIA',
      title: '새로운 사진이 업로드되었습니다',
      message: 'Test User님이 사진을 업로드했습니다',
      mediaId: 'media-123',
      isRead: false,
      createdAt: '2024-01-17T10:00:00Z',
    },
    {
      id: '2',
      type: 'NEW_LIKE',
      title: '좋아요를 받았습니다',
      message: 'Admin님이 회원님의 사진을 좋아합니다',
      mediaId: 'media-456',
      isRead: true,
      createdAt: '2024-01-17T09:00:00Z',
    },
  ]

  // Prevent setInterval from interfering with act()
  const originalSetInterval = global.setInterval
  const originalClearInterval = global.clearInterval

  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()

    // Replace setInterval with a no-op that returns a fake timer id
    // This prevents the 30s polling from causing act() to hang
    global.setInterval = jest.fn(() => 999) as any
    global.clearInterval = jest.fn()

    // Default mock implementations
    mockedNotificationService.getUnreadCount.mockResolvedValue(0)
    mockedNotificationService.getNotifications.mockResolvedValue({
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      hasNext: false,
      unreadCount: 0,
    })
  })

  afterEach(() => {
    global.setInterval = originalSetInterval
    global.clearInterval = originalClearInterval
  })

  describe('rendering', () => {
    it('should render bell icon', async () => {
      const { container } = render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByLabelText('알림')).toBeInTheDocument()
      })

      const bellIcon = container.querySelector('svg')
      expect(bellIcon).toBeInTheDocument()
    })

    it('should show unread count badge when count > 0', async () => {
      mockedNotificationService.getUnreadCount.mockResolvedValue(5)

      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })

    it('should not show badge when unread count is 0', async () => {
      const { container } = render(<NotificationBell />)

      await waitFor(() => {
        expect(mockedNotificationService.getUnreadCount).toHaveBeenCalled()
      })

      const badge = container.querySelector('.bg-red-500')
      expect(badge).not.toBeInTheDocument()
    })

    it('should show 99+ when unread count exceeds 99', async () => {
      mockedNotificationService.getUnreadCount.mockResolvedValue(150)

      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByText('99+')).toBeInTheDocument()
      })
    })
  })

  describe('dropdown functionality', () => {
    it('should open dropdown on bell click', async () => {
      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByLabelText('알림')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByLabelText('알림'))

      await waitFor(() => {
        expect(screen.getByText('알림이 없습니다')).toBeInTheDocument()
      })
    })

    it('should close dropdown on second click', async () => {
      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByLabelText('알림')).toBeInTheDocument()
      })

      // Open
      fireEvent.click(screen.getByLabelText('알림'))

      await waitFor(() => {
        expect(screen.getByText('알림이 없습니다')).toBeInTheDocument()
      })

      // Close
      fireEvent.click(screen.getByLabelText('알림'))

      await waitFor(() => {
        expect(screen.queryByText('알림이 없습니다')).not.toBeInTheDocument()
      })
    })
  })

  describe('notifications display', () => {
    it('should display notifications in dropdown', async () => {
      mockedNotificationService.getUnreadCount.mockResolvedValue(1)
      mockedNotificationService.getNotifications.mockResolvedValue({
        content: mockNotifications,
        page: 0,
        size: 10,
        totalElements: 2,
        totalPages: 1,
        hasNext: false,
        unreadCount: 1,
      })

      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByLabelText('알림')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByLabelText('알림'))

      await waitFor(() => {
        expect(screen.getByText('새로운 사진이 업로드되었습니다')).toBeInTheDocument()
        expect(screen.getByText('좋아요를 받았습니다')).toBeInTheDocument()
      })
    })

    it('should show empty state when no notifications', async () => {
      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByLabelText('알림')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByLabelText('알림'))

      await waitFor(() => {
        expect(screen.getByText('알림이 없습니다')).toBeInTheDocument()
      })
    })

    it('should display unread indicator for unread notifications', async () => {
      mockedNotificationService.getUnreadCount.mockResolvedValue(1)
      mockedNotificationService.getNotifications.mockResolvedValue({
        content: [mockNotifications[0]],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        unreadCount: 1,
      })

      const { container } = render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByLabelText('알림')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByLabelText('알림'))

      await waitFor(() => {
        expect(screen.getByText('새로운 사진이 업로드되었습니다')).toBeInTheDocument()
      })

      const unreadDot = container.querySelector('.bg-blue-500')
      expect(unreadDot).toBeInTheDocument()
    })
  })

  describe('mark as read functionality', () => {
    it('should call markAsRead when clicking unread notification', async () => {
      mockedNotificationService.getUnreadCount.mockResolvedValue(1)
      mockedNotificationService.getNotifications.mockResolvedValue({
        content: [mockNotifications[0]],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        unreadCount: 1,
      })
      mockedNotificationService.markAsRead.mockResolvedValue()

      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByLabelText('알림')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByLabelText('알림'))

      await waitFor(() => {
        expect(screen.getByText('새로운 사진이 업로드되었습니다')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('새로운 사진이 업로드되었습니다'))

      await waitFor(() => {
        expect(mockedNotificationService.markAsRead).toHaveBeenCalledWith('1')
      })
    })

    it('should call markAllAsRead when button clicked', async () => {
      mockedNotificationService.getUnreadCount.mockResolvedValue(2)
      mockedNotificationService.getNotifications.mockResolvedValue({
        content: mockNotifications,
        page: 0,
        size: 10,
        totalElements: 2,
        totalPages: 1,
        hasNext: false,
        unreadCount: 2,
      })
      mockedNotificationService.markAllAsRead.mockResolvedValue()

      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByLabelText('알림')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByLabelText('알림'))

      await waitFor(() => {
        expect(screen.getByText('전체 읽음')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('전체 읽음'))

      await waitFor(() => {
        expect(mockedNotificationService.markAllAsRead).toHaveBeenCalledTimes(1)
      })
    })

    it('should show mark all button when unread count > 0', async () => {
      mockedNotificationService.getUnreadCount.mockResolvedValue(1)
      mockedNotificationService.getNotifications.mockResolvedValue({
        content: [mockNotifications[0]],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        unreadCount: 1,
      })

      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByLabelText('알림')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByLabelText('알림'))

      await waitFor(() => {
        expect(screen.getByText('전체 읽음')).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    it('should handle error when fetching unread count', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockedNotificationService.getUnreadCount.mockRejectedValue(new Error('Network error'))

      // Temporarily restore real setInterval so the useEffect promise chain completes
      const realSetInterval = originalSetInterval
      const realClearInterval = originalClearInterval
      global.setInterval = realSetInterval
      global.clearInterval = realClearInterval

      render(<NotificationBell />)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to fetch unread count:',
          expect.any(Error)
        )
      })

      // Re-mock to prevent interference with cleanup
      global.setInterval = jest.fn(() => 999) as any
      global.clearInterval = jest.fn()

      consoleErrorSpy.mockRestore()
    })

    it('should handle error when fetching notifications', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockedNotificationService.getNotifications.mockRejectedValue(new Error('Network error'))

      render(<NotificationBell />)

      await waitFor(() => {
        expect(screen.getByLabelText('알림')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByLabelText('알림'))

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to fetch notifications:',
          expect.any(Error)
        )
      })

      consoleErrorSpy.mockRestore()
    })
  })
})
