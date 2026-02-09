// User types
export interface User {
  id: number
  email: string
  name: string
  role: 'ADMIN' | 'VIEWER'
  createdAt: string
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

// Media types
export interface Media {
  id: string
  type: 'PHOTO' | 'VIDEO'
  originalName: string
  url: string
  thumbnailUrl?: string
  size: number
  mimeType: string
  width?: number
  height?: number
  duration?: number
  takenAt?: string
  createdAt: string
  uploaderId: string
  uploaderName: string
  likeCount?: number
  isLiked?: boolean
}

export interface MediaUploadResponse {
  id: string
  type: 'PHOTO' | 'VIDEO'
  originalName: string
  url: string
  size: number
  mimeType: string
  width?: number
  height?: number
  duration?: number
  takenAt?: string
  createdAt: string
}

export interface BulkUploadResponse {
  uploaded: MediaUploadResponse[]
  failed: FailedUpload[]
}

export interface FailedUpload {
  fileName: string
  error: string
}

export interface MediaListResponse {
  content: Media[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface MediaFilters {
  type?: 'PHOTO' | 'VIDEO'
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

export interface DownloadUrlResponse {
  url: string
}

export interface UploadProgress {
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  timestamp: string
}

// Notification types
export interface Notification {
  id: string
  type: 'NEW_MEDIA' | 'NEW_LIKE' | 'SYSTEM'
  title: string
  message?: string
  mediaId?: string
  isRead: boolean
  createdAt: string
}

export interface NotificationListResponse {
  content: Notification[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  unreadCount: number
}

export interface UnreadCountResponse {
  count: number
}
