// User types
export interface User {
  id: number
  email: string
  name: string
  role: 'ADMIN' | 'VIEWER'
  createdAt: string
  updatedAt: string
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
  id: number
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
  likeCount: number
  isLiked: boolean
  uploader: {
    id: number
    name: string
  }
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
  id: number
  type: string
  title: string
  message?: string
  mediaId?: number
  isRead: boolean
  createdAt: string
}
