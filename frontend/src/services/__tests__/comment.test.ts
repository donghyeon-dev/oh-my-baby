import api from '../api'
import commentService from '../comment'

jest.mock('../api')
const mockedApi = api as jest.Mocked<typeof api>

describe('commentService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('addComment', () => {
    it('should add comment and return response', async () => {
      const mockComment = {
        id: 'comment-1',
        userId: 'user-1',
        userName: 'Test User',
        content: 'Great photo!',
        createdAt: '2024-01-17T10:00:00Z',
      }
      const mockResponse = {
        data: {
          success: true,
          data: mockComment,
          timestamp: '2024-01-17T10:00:00Z',
        },
      }
      mockedApi.post.mockResolvedValueOnce(mockResponse)

      const result = await commentService.addComment('media-123', 'Great photo!')

      expect(result).toEqual(mockComment)
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/media/media-123/comments',
        { content: 'Great photo!' }
      )
    })

    it('should throw error on API failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        commentService.addComment('media-123', 'test')
      ).rejects.toThrow('Network error')
    })
  })

  describe('getComments', () => {
    it('should return list of comments', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          userId: 'user-1',
          userName: 'Alice',
          content: 'Nice!',
          createdAt: '2024-01-17T10:00:00Z',
        },
        {
          id: 'comment-2',
          userId: 'user-2',
          userName: 'Bob',
          content: 'Beautiful!',
          createdAt: '2024-01-17T09:00:00Z',
        },
      ]
      const mockResponse = {
        data: {
          success: true,
          data: mockComments,
          timestamp: '2024-01-17T10:00:00Z',
        },
      }
      mockedApi.get.mockResolvedValueOnce(mockResponse)

      const result = await commentService.getComments('media-123')

      expect(result).toEqual(mockComments)
      expect(mockedApi.get).toHaveBeenCalledWith('/media/media-123/comments')
    })

    it('should return empty list when no comments', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
          timestamp: '2024-01-17T10:00:00Z',
        },
      }
      mockedApi.get.mockResolvedValueOnce(mockResponse)

      const result = await commentService.getComments('media-456')

      expect(result).toEqual([])
    })

    it('should throw error on API failure', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        commentService.getComments('media-123')
      ).rejects.toThrow('Network error')
    })
  })

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      mockedApi.delete.mockResolvedValueOnce({ data: { success: true } })

      await commentService.deleteComment('media-123', 'comment-1')

      expect(mockedApi.delete).toHaveBeenCalledWith(
        '/media/media-123/comments/comment-1'
      )
    })

    it('should throw error on API failure', async () => {
      mockedApi.delete.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        commentService.deleteComment('media-123', 'comment-1')
      ).rejects.toThrow('Network error')
    })
  })
})
