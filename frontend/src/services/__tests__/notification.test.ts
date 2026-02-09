// Mock auth store first (before importing modules that depend on it)
jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      accessToken: 'mock-access-token',
    }),
  },
}))

// Mock the api module
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}))

import { notificationService } from '../notification'
import api from '../api'
import {
  ApiResponse,
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/types'

const mockedApi = api as jest.Mocked<typeof api>

describe('notificationService', () => {
  const mockNotification: Notification = {
    id: 'notif-123',
    type: 'NEW_MEDIA',
    title: '새로운 사진이 업로드되었습니다',
    message: 'Test User님이 사진을 업로드했습니다',
    mediaId: 'media-123',
    isRead: false,
    createdAt: '2024-01-17T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getNotifications', () => {
    it('should return notification list on success', async () => {
      const mockNotificationListResponse: NotificationListResponse = {
        content: [mockNotification],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        unreadCount: 1,
      }
      const mockResponse: ApiResponse<NotificationListResponse> = {
        success: true,
        data: mockNotificationListResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await notificationService.getNotifications()

      expect(mockedApi.get).toHaveBeenCalledWith('/notifications?page=0&size=20')
      expect(mockedApi.get).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockNotificationListResponse)
      expect(result.content.length).toBe(1)
    })

    it('should use default page and size parameters', async () => {
      const mockNotificationListResponse: NotificationListResponse = {
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        unreadCount: 0,
      }
      const mockResponse: ApiResponse<NotificationListResponse> = {
        success: true,
        data: mockNotificationListResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      await notificationService.getNotifications()

      expect(mockedApi.get).toHaveBeenCalledWith('/notifications?page=0&size=20')
    })

    it('should use custom page and size parameters', async () => {
      const mockNotificationListResponse: NotificationListResponse = {
        content: [],
        page: 2,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        unreadCount: 0,
      }
      const mockResponse: ApiResponse<NotificationListResponse> = {
        success: true,
        data: mockNotificationListResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      await notificationService.getNotifications(2, 10)

      expect(mockedApi.get).toHaveBeenCalledWith('/notifications?page=2&size=10')
    })

    it('should handle error when getNotifications fails', async () => {
      const errorMessage = 'Failed to fetch notifications'
      mockedApi.get.mockRejectedValueOnce(new Error(errorMessage))

      await expect(notificationService.getNotifications()).rejects.toThrow(errorMessage)
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count on success', async () => {
      const mockUnreadCountResponse: UnreadCountResponse = {
        count: 5,
      }
      const mockResponse: ApiResponse<UnreadCountResponse> = {
        success: true,
        data: mockUnreadCountResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await notificationService.getUnreadCount()

      expect(mockedApi.get).toHaveBeenCalledWith('/notifications/unread-count')
      expect(mockedApi.get).toHaveBeenCalledTimes(1)
      expect(result).toBe(5)
    })

    it('should return zero when no unread notifications', async () => {
      const mockUnreadCountResponse: UnreadCountResponse = {
        count: 0,
      }
      const mockResponse: ApiResponse<UnreadCountResponse> = {
        success: true,
        data: mockUnreadCountResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await notificationService.getUnreadCount()

      expect(result).toBe(0)
    })

    it('should handle error when getUnreadCount fails', async () => {
      const errorMessage = 'Failed to fetch unread count'
      mockedApi.get.mockRejectedValueOnce(new Error(errorMessage))

      await expect(notificationService.getUnreadCount()).rejects.toThrow(errorMessage)
    })
  })

  describe('markAsRead', () => {
    it('should call PUT /notifications/{id}/read', async () => {
      mockedApi.put.mockResolvedValueOnce({ data: {} })

      await notificationService.markAsRead('notif-123')

      expect(mockedApi.put).toHaveBeenCalledWith('/notifications/notif-123/read')
      expect(mockedApi.put).toHaveBeenCalledTimes(1)
    })

    it('should handle error when markAsRead fails', async () => {
      const errorMessage = 'Failed to mark as read'
      mockedApi.put.mockRejectedValueOnce(new Error(errorMessage))

      await expect(notificationService.markAsRead('notif-123')).rejects.toThrow(errorMessage)
    })

    it('should handle unauthorized error', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid access token',
            },
          },
        },
      }

      mockedApi.put.mockRejectedValueOnce(unauthorizedError)

      await expect(notificationService.markAsRead('notif-123')).rejects.toEqual(unauthorizedError)
    })
  })

  describe('markAllAsRead', () => {
    it('should call PUT /notifications/read-all', async () => {
      mockedApi.put.mockResolvedValueOnce({ data: {} })

      await notificationService.markAllAsRead()

      expect(mockedApi.put).toHaveBeenCalledWith('/notifications/read-all')
      expect(mockedApi.put).toHaveBeenCalledTimes(1)
    })

    it('should handle error when markAllAsRead fails', async () => {
      const errorMessage = 'Failed to mark all as read'
      mockedApi.put.mockRejectedValueOnce(new Error(errorMessage))

      await expect(notificationService.markAllAsRead()).rejects.toThrow(errorMessage)
    })

    it('should handle server error', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            success: false,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Internal server error',
            },
          },
        },
      }

      mockedApi.put.mockRejectedValueOnce(serverError)

      await expect(notificationService.markAllAsRead()).rejects.toEqual(serverError)
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockedApi.get.mockRejectedValueOnce(networkError)

      await expect(notificationService.getNotifications()).rejects.toThrow('Network Error')
    })

    it('should handle 404 not found errors', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Notification not found',
            },
          },
        },
      }

      mockedApi.put.mockRejectedValueOnce(notFoundError)

      await expect(notificationService.markAsRead('nonexistent-id')).rejects.toEqual(notFoundError)
    })
  })
})
