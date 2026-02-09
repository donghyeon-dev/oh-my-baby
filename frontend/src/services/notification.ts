import api from './api'
import { ApiResponse, NotificationListResponse, UnreadCountResponse } from '@/types'

export const notificationService = {
  async getNotifications(page: number = 0, size: number = 20): Promise<NotificationListResponse> {
    const response = await api.get<ApiResponse<NotificationListResponse>>(
      `/notifications?page=${page}&size=${size}`
    )
    return response.data.data!
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<ApiResponse<UnreadCountResponse>>(
      '/notifications/unread-count'
    )
    return response.data.data!.count
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.put(`/notifications/${notificationId}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all')
  },
}

export default notificationService
