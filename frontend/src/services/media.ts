import api from './api'
import {
  ApiResponse,
  Media,
  MediaListResponse,
  MediaFilters,
  MediaUploadResponse,
  BulkUploadResponse,
  DownloadUrlResponse,
} from '@/types'
import axios, { AxiosProgressEvent } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export const mediaService = {
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<MediaUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const token = useAuthStore.getState().accessToken

    const response = await axios.post<ApiResponse<MediaUploadResponse>>(
      `${API_BASE_URL}/media/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : '',
        },
        withCredentials: true,
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        },
      }
    )

    return response.data.data!
  },

  async uploadFiles(
    files: File[],
    onProgress?: (fileName: string, progress: number) => void
  ): Promise<BulkUploadResponse> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const token = useAuthStore.getState().accessToken

    const response = await axios.post<ApiResponse<BulkUploadResponse>>(
      `${API_BASE_URL}/media/upload/bulk`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : '',
        },
        withCredentials: true,
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress('bulk', progress)
          }
        },
      }
    )

    return response.data.data!
  },

  async getMediaList(filters?: MediaFilters): Promise<MediaListResponse> {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.page !== undefined) params.append('page', filters.page.toString())
    if (filters?.size !== undefined) params.append('size', filters.size.toString())

    const response = await api.get<ApiResponse<MediaListResponse>>(
      `/media?${params.toString()}`
    )
    return response.data.data!
  },

  async getMedia(id: string): Promise<Media> {
    const response = await api.get<ApiResponse<Media>>(`/media/${id}`)
    return response.data.data!
  },

  async deleteMedia(id: string): Promise<void> {
    await api.delete(`/media/${id}`)
  },

  async getDownloadUrl(id: string, expiryMinutes: number = 60): Promise<string> {
    const response = await api.get<ApiResponse<DownloadUrlResponse>>(
      `/media/${id}/download?expiryMinutes=${expiryMinutes}`
    )
    return response.data.data!.url
  },

  async getDistinctDates(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/media/dates')
    return response.data.data!
  },
}

export default mediaService
