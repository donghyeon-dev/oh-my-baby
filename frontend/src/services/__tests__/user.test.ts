import { userService } from '../user'
import api from '../api'
import { User, ApiResponse } from '@/types'

jest.mock('../api')
const mockedApi = api as jest.Mocked<typeof api>

describe('userService', () => {
  const mockUsers: User[] = [
    {
      id: 1,
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'PARENT',
      createdAt: '2024-01-17T00:00:00Z',
      lastLoginAt: '2024-01-18T10:30:00Z',
    },
    {
      id: 2,
      email: 'viewer@example.com',
      name: 'Viewer User',
      role: 'FAMILY',
      createdAt: '2024-01-17T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllUsers', () => {
    it('should successfully fetch all users', async () => {
      const mockResponse: ApiResponse<User[]> = {
        success: true,
        data: mockUsers,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await userService.getAllUsers()

      expect(mockedApi.get).toHaveBeenCalledWith('/users')
      expect(mockedApi.get).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockUsers)
      expect(result).toHaveLength(2)
    })

    it('should return users with correct fields', async () => {
      const mockResponse: ApiResponse<User[]> = {
        success: true,
        data: mockUsers,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await userService.getAllUsers()

      expect(result[0].role).toBe('PARENT')
      expect(result[0].lastLoginAt).toBe('2024-01-18T10:30:00Z')
      expect(result[1].role).toBe('FAMILY')
      expect(result[1].lastLoginAt).toBeUndefined()
    })

    it('should throw error when fetch fails', async () => {
      const errorMessage = 'Unauthorized'
      mockedApi.get.mockRejectedValueOnce(new Error(errorMessage))

      await expect(userService.getAllUsers()).rejects.toThrow(errorMessage)
      expect(mockedApi.get).toHaveBeenCalledWith('/users')
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

      mockedApi.get.mockRejectedValueOnce(serverError)

      await expect(userService.getAllUsers()).rejects.toEqual(serverError)
    })
  })
})
