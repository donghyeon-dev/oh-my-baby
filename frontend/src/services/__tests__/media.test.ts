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

// Mock axios for file upload (uses axios directly for progress tracking)
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  },
}))

import { mediaService } from '../media'
import api from '../api'
import {
  ApiResponse,
  Media,
  MediaListResponse,
  MediaUploadResponse,
  BulkUploadResponse,
  DownloadUrlResponse,
} from '@/types'
import axios from 'axios'

const mockedApi = api as jest.Mocked<typeof api>
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('mediaService', () => {
  const mockMedia: Media = {
    id: 'uuid-123',
    type: 'PHOTO',
    originalName: 'test.jpg',
    url: 'http://minio/photos/test.jpg?signed=true',
    size: 1024,
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
    createdAt: '2024-01-17T00:00:00Z',
    uploaderId: 'user-uuid-123',
    uploaderName: 'Test User',
  }

  const mockUploadResponse: MediaUploadResponse = {
    id: 'uuid-123',
    type: 'PHOTO',
    originalName: 'test.jpg',
    url: 'http://minio/photos/test.jpg?signed=true',
    size: 1024,
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
    createdAt: '2024-01-17T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('uploadFile', () => {
    it('should successfully upload a file', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResponse: ApiResponse<MediaUploadResponse> = {
        success: true,
        data: mockUploadResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await mediaService.uploadFile(mockFile)

      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockUploadResponse)
      expect(result.originalName).toBe('test.jpg')
    })

    it('should call onProgress callback during upload', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResponse: ApiResponse<MediaUploadResponse> = {
        success: true,
        data: mockUploadResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let capturedOnProgress: any

      mockedAxios.post.mockImplementation((url, data, config) => {
        if (config?.onUploadProgress) {
          capturedOnProgress = config.onUploadProgress
        }
        return Promise.resolve({ data: mockResponse })
      })

      const onProgress = jest.fn()
      await mediaService.uploadFile(mockFile, onProgress)

      // Simulate progress
      if (capturedOnProgress) {
        capturedOnProgress({ loaded: 50, total: 100, bytes: 50, lengthComputable: true })
      }

      expect(onProgress).toHaveBeenCalledWith(50)
    })

    it('should throw error when upload fails', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const errorMessage = 'Upload failed'

      mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage))

      await expect(mediaService.uploadFile(mockFile)).rejects.toThrow(errorMessage)
    })

    it('should send correct headers for multipart form data', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockResponse: ApiResponse<MediaUploadResponse> = {
        success: true,
        data: mockUploadResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse })

      await mediaService.uploadFile(mockFile)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
            Authorization: 'Bearer mock-access-token',
          }),
        })
      )
    })
  })

  describe('uploadFiles', () => {
    it('should successfully upload multiple files', async () => {
      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]
      const mockBulkResponse: BulkUploadResponse = {
        uploaded: [mockUploadResponse],
        failed: [],
      }
      const mockResponse: ApiResponse<BulkUploadResponse> = {
        success: true,
        data: mockBulkResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await mediaService.uploadFiles(mockFiles)

      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockBulkResponse)
      expect(result.uploaded.length).toBe(1)
      expect(result.failed.length).toBe(0)
    })

    it('should handle mixed success and failure', async () => {
      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.exe', { type: 'application/x-executable' }),
      ]
      const mockBulkResponse: BulkUploadResponse = {
        uploaded: [mockUploadResponse],
        failed: [{ fileName: 'test2.exe', error: 'Unsupported file type' }],
      }
      const mockResponse: ApiResponse<BulkUploadResponse> = {
        success: true,
        data: mockBulkResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await mediaService.uploadFiles(mockFiles)

      expect(result.uploaded.length).toBe(1)
      expect(result.failed.length).toBe(1)
      expect(result.failed[0].fileName).toBe('test2.exe')
    })
  })

  describe('getMediaList', () => {
    it('should successfully get media list', async () => {
      const mockMediaListResponse: MediaListResponse = {
        content: [mockMedia],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      }
      const mockResponse: ApiResponse<MediaListResponse> = {
        success: true,
        data: mockMediaListResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await mediaService.getMediaList()

      expect(mockedApi.get).toHaveBeenCalledWith('/media?')
      expect(mockedApi.get).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockMediaListResponse)
      expect(result.content.length).toBe(1)
    })

    it('should send filters as query parameters', async () => {
      const mockMediaListResponse: MediaListResponse = {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      }
      const mockResponse: ApiResponse<MediaListResponse> = {
        success: true,
        data: mockMediaListResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      await mediaService.getMediaList({
        type: 'PHOTO',
        page: 0,
        size: 10,
      })

      expect(mockedApi.get).toHaveBeenCalledWith('/media?type=PHOTO&page=0&size=10')
    })

    it('should handle date filters', async () => {
      const mockMediaListResponse: MediaListResponse = {
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      }
      const mockResponse: ApiResponse<MediaListResponse> = {
        success: true,
        data: mockMediaListResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      await mediaService.getMediaList({
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      })

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2024-01-01T00%3A00%3A00Z')
      )
    })

    it('should throw error when getMediaList fails', async () => {
      const errorMessage = 'Failed to fetch media'
      mockedApi.get.mockRejectedValueOnce(new Error(errorMessage))

      await expect(mediaService.getMediaList()).rejects.toThrow(errorMessage)
    })
  })

  describe('getMedia', () => {
    it('should successfully get a single media', async () => {
      const mockResponse: ApiResponse<Media> = {
        success: true,
        data: mockMedia,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await mediaService.getMedia('uuid-123')

      expect(mockedApi.get).toHaveBeenCalledWith('/media/uuid-123')
      expect(mockedApi.get).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockMedia)
      expect(result.id).toBe('uuid-123')
    })

    it('should throw error when media not found', async () => {
      const errorMessage = 'Media not found'
      mockedApi.get.mockRejectedValueOnce(new Error(errorMessage))

      await expect(mediaService.getMedia('nonexistent-id')).rejects.toThrow(errorMessage)
    })
  })

  describe('deleteMedia', () => {
    it('should successfully delete a media', async () => {
      mockedApi.delete.mockResolvedValueOnce({ data: {} })

      await mediaService.deleteMedia('uuid-123')

      expect(mockedApi.delete).toHaveBeenCalledWith('/media/uuid-123')
      expect(mockedApi.delete).toHaveBeenCalledTimes(1)
    })

    it('should throw error when delete fails', async () => {
      const errorMessage = 'Delete failed'
      mockedApi.delete.mockRejectedValueOnce(new Error(errorMessage))

      await expect(mediaService.deleteMedia('uuid-123')).rejects.toThrow(errorMessage)
    })

    it('should throw error when not authorized', async () => {
      const mockErrorResponse = {
        response: {
          status: 403,
          data: {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Not authorized to delete this media',
            },
          },
        },
      }

      mockedApi.delete.mockRejectedValueOnce(mockErrorResponse)

      await expect(mediaService.deleteMedia('uuid-123')).rejects.toEqual(mockErrorResponse)
    })
  })

  describe('getDownloadUrl', () => {
    it('should successfully get download URL', async () => {
      const mockDownloadResponse: DownloadUrlResponse = {
        url: 'http://minio/photos/test.jpg?signed=true&expires=3600',
      }
      const mockResponse: ApiResponse<DownloadUrlResponse> = {
        success: true,
        data: mockDownloadResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await mediaService.getDownloadUrl('uuid-123')

      expect(mockedApi.get).toHaveBeenCalledWith('/media/uuid-123/download?expiryMinutes=60')
      expect(result).toBe(mockDownloadResponse.url)
    })

    it('should use custom expiry minutes', async () => {
      const mockDownloadResponse: DownloadUrlResponse = {
        url: 'http://minio/photos/test.jpg?signed=true&expires=7200',
      }
      const mockResponse: ApiResponse<DownloadUrlResponse> = {
        success: true,
        data: mockDownloadResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      await mediaService.getDownloadUrl('uuid-123', 120)

      expect(mockedApi.get).toHaveBeenCalledWith('/media/uuid-123/download?expiryMinutes=120')
    })

    it('should throw error when getting download URL fails', async () => {
      const errorMessage = 'Failed to get download URL'
      mockedApi.get.mockRejectedValueOnce(new Error(errorMessage))

      await expect(mediaService.getDownloadUrl('uuid-123')).rejects.toThrow(errorMessage)
    })
  })

  describe('getDistinctDates', () => {
    it('should successfully get distinct dates', async () => {
      const mockDates = ['2024-01-17', '2024-01-16', '2024-01-15']
      const mockResponse: ApiResponse<string[]> = {
        success: true,
        data: mockDates,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await mediaService.getDistinctDates()

      expect(mockedApi.get).toHaveBeenCalledWith('/media/dates')
      expect(mockedApi.get).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockDates)
      expect(result.length).toBe(3)
    })

    it('should return empty array when no media exists', async () => {
      const mockResponse: ApiResponse<string[]> = {
        success: true,
        data: [],
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await mediaService.getDistinctDates()

      expect(result).toEqual([])
      expect(result.length).toBe(0)
    })

    it('should throw error when getDistinctDates fails', async () => {
      const errorMessage = 'Failed to fetch dates'
      mockedApi.get.mockRejectedValueOnce(new Error(errorMessage))

      await expect(mediaService.getDistinctDates()).rejects.toThrow(errorMessage)
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockedApi.get.mockRejectedValueOnce(networkError)

      await expect(mediaService.getMediaList()).rejects.toThrow('Network Error')
    })

    it('should handle server errors (500)', async () => {
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

      mockedApi.get.mockRejectedValueOnce(serverError)

      await expect(mediaService.getMedia('uuid-123')).rejects.toEqual(serverError)
    })

    it('should handle unauthorized errors', async () => {
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

      mockedApi.get.mockRejectedValueOnce(unauthorizedError)

      await expect(mediaService.getMediaList()).rejects.toEqual(unauthorizedError)
    })
  })
})
