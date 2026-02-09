import api from '../api'
import likeService from '../like'

jest.mock('../api')
const mockedApi = api as jest.Mocked<typeof api>

describe('likeService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('toggleLike', () => {
    it('should toggle like and return response', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            mediaId: 'media-123',
            isLiked: true,
            likeCount: 5,
          },
          timestamp: '2024-01-17T10:00:00Z',
        },
      }
      mockedApi.post.mockResolvedValueOnce(mockResponse)

      const result = await likeService.toggleLike('media-123')

      expect(result).toEqual({
        mediaId: 'media-123',
        isLiked: true,
        likeCount: 5,
      })
      expect(mockedApi.post).toHaveBeenCalledWith('/media/media-123/like')
    })

    it('should toggle unlike and return response', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            mediaId: 'media-123',
            isLiked: false,
            likeCount: 4,
          },
          timestamp: '2024-01-17T10:00:00Z',
        },
      }
      mockedApi.post.mockResolvedValueOnce(mockResponse)

      const result = await likeService.toggleLike('media-123')

      expect(result).toEqual({
        mediaId: 'media-123',
        isLiked: false,
        likeCount: 4,
      })
    })

    it('should throw error on API failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Network error'))

      await expect(likeService.toggleLike('media-123')).rejects.toThrow('Network error')
    })
  })

  describe('getLikes', () => {
    it('should return list of likes', async () => {
      const mockLikes = [
        { userId: 'user-1', userName: 'Alice', createdAt: '2024-01-17T10:00:00Z' },
        { userId: 'user-2', userName: 'Bob', createdAt: '2024-01-17T09:00:00Z' },
      ]
      const mockResponse = {
        data: {
          success: true,
          data: mockLikes,
          timestamp: '2024-01-17T10:00:00Z',
        },
      }
      mockedApi.get.mockResolvedValueOnce(mockResponse)

      const result = await likeService.getLikes('media-123')

      expect(result).toEqual(mockLikes)
      expect(mockedApi.get).toHaveBeenCalledWith('/media/media-123/likes')
    })

    it('should return empty list when no likes', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
          timestamp: '2024-01-17T10:00:00Z',
        },
      }
      mockedApi.get.mockResolvedValueOnce(mockResponse)

      const result = await likeService.getLikes('media-456')

      expect(result).toEqual([])
    })

    it('should throw error on API failure', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'))

      await expect(likeService.getLikes('media-123')).rejects.toThrow('Network error')
    })
  })
})
