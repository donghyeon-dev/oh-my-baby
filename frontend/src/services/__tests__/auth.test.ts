import { authService } from '../auth'
import api from '../api'
import { AuthResponse, LoginRequest, RegisterRequest, User, ApiResponse } from '@/types'

// Mock the api module
jest.mock('../api')
const mockedApi = api as jest.Mocked<typeof api>

describe('authService', () => {
  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'VIEWER',
    createdAt: '2024-01-17T00:00:00Z',
  }

  const mockAccessToken = 'mock-access-token-123'

  const mockAuthResponse: AuthResponse = {
    accessToken: mockAccessToken,
    user: mockUser,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    const loginData: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
    }

    it('should successfully login with valid credentials', async () => {
      const mockResponse: ApiResponse<AuthResponse> = {
        success: true,
        data: mockAuthResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await authService.login(loginData)

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', loginData)
      expect(mockedApi.post).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockAuthResponse)
      expect(result.accessToken).toBe(mockAccessToken)
      expect(result.user).toEqual(mockUser)
    })

    it('should throw error when login fails', async () => {
      const errorMessage = 'Invalid credentials'
      mockedApi.post.mockRejectedValueOnce(new Error(errorMessage))

      await expect(authService.login(loginData)).rejects.toThrow(errorMessage)
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', loginData)
    })

    it('should handle API error response', async () => {
      const mockErrorResponse: ApiResponse<AuthResponse> = {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect',
        },
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.post.mockRejectedValueOnce({
        response: { data: mockErrorResponse },
      })

      await expect(authService.login(loginData)).rejects.toBeTruthy()
    })

    it('should send correct email and password', async () => {
      const mockResponse: ApiResponse<AuthResponse> = {
        success: true,
        data: mockAuthResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.post.mockResolvedValueOnce({ data: mockResponse })

      await authService.login({
        email: 'user@test.com',
        password: 'securepass',
      })

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'user@test.com',
        password: 'securepass',
      })
    })
  })

  describe('register', () => {
    const registerData: RegisterRequest = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    }

    it('should successfully register a new user', async () => {
      const mockResponse: ApiResponse<AuthResponse> = {
        success: true,
        data: mockAuthResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await authService.register(registerData)

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', registerData)
      expect(mockedApi.post).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockAuthResponse)
      expect(result.accessToken).toBe(mockAccessToken)
      expect(result.user).toEqual(mockUser)
    })

    it('should throw error when registration fails', async () => {
      const errorMessage = 'Email already exists'
      mockedApi.post.mockRejectedValueOnce(new Error(errorMessage))

      await expect(authService.register(registerData)).rejects.toThrow(errorMessage)
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', registerData)
    })

    it('should handle duplicate email error', async () => {
      const mockErrorResponse: ApiResponse<AuthResponse> = {
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'Email is already registered',
        },
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.post.mockRejectedValueOnce({
        response: { data: mockErrorResponse },
      })

      await expect(authService.register(registerData)).rejects.toBeTruthy()
    })

    it('should send all registration fields', async () => {
      const mockResponse: ApiResponse<AuthResponse> = {
        success: true,
        data: mockAuthResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.post.mockResolvedValueOnce({ data: mockResponse })

      await authService.register({
        email: 'test@test.com',
        password: 'pass123',
        name: 'Test Name',
      })

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@test.com',
        password: 'pass123',
        name: 'Test Name',
      })
    })
  })

  describe('logout', () => {
    it('should successfully logout', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: {} })

      await authService.logout()

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout')
      expect(mockedApi.post).toHaveBeenCalledTimes(1)
    })

    it('should throw error when logout fails', async () => {
      const errorMessage = 'Logout failed'
      mockedApi.post.mockRejectedValueOnce(new Error(errorMessage))

      await expect(authService.logout()).rejects.toThrow(errorMessage)
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout')
    })

    it('should call logout endpoint without payload', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: {} })

      await authService.logout()

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout')
      expect(mockedApi.post).not.toHaveBeenCalledWith('/auth/logout', expect.anything())
    })
  })

  describe('refresh', () => {
    it('should successfully refresh access token', async () => {
      const mockResponse: ApiResponse<AuthResponse> = {
        success: true,
        data: mockAuthResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await authService.refresh()

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/refresh')
      expect(mockedApi.post).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockAuthResponse)
      expect(result.accessToken).toBe(mockAccessToken)
      expect(result.user).toEqual(mockUser)
    })

    it('should throw error when refresh fails', async () => {
      const errorMessage = 'Refresh token expired'
      mockedApi.post.mockRejectedValueOnce(new Error(errorMessage))

      await expect(authService.refresh()).rejects.toThrow(errorMessage)
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/refresh')
    })

    it('should handle unauthorized refresh', async () => {
      const mockErrorResponse: ApiResponse<AuthResponse> = {
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid or expired',
        },
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.post.mockRejectedValueOnce({
        response: { status: 401, data: mockErrorResponse },
      })

      await expect(authService.refresh()).rejects.toBeTruthy()
    })

    it('should return new access token', async () => {
      const newAccessToken = 'new-access-token-456'
      const newAuthResponse: AuthResponse = {
        ...mockAuthResponse,
        accessToken: newAccessToken,
      }

      const mockResponse: ApiResponse<AuthResponse> = {
        success: true,
        data: newAuthResponse,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await authService.refresh()

      expect(result.accessToken).toBe(newAccessToken)
    })
  })

  describe('getMe', () => {
    it('should successfully get current user', async () => {
      const mockResponse: ApiResponse<User> = {
        success: true,
        data: mockUser,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await authService.getMe()

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/me')
      expect(mockedApi.get).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockUser)
      expect(result.id).toBe(1)
      expect(result.email).toBe('test@example.com')
      expect(result.name).toBe('Test User')
      expect(result.role).toBe('VIEWER')
    })

    it('should throw error when getMe fails', async () => {
      const errorMessage = 'Unauthorized'
      mockedApi.get.mockRejectedValueOnce(new Error(errorMessage))

      await expect(authService.getMe()).rejects.toThrow(errorMessage)
      expect(mockedApi.get).toHaveBeenCalledWith('/auth/me')
    })

    it('should handle unauthorized access', async () => {
      const mockErrorResponse: ApiResponse<User> = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is invalid',
        },
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockRejectedValueOnce({
        response: { status: 401, data: mockErrorResponse },
      })

      await expect(authService.getMe()).rejects.toBeTruthy()
    })

    it('should return complete user object', async () => {
      const adminUser: User = {
        id: 2,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        createdAt: '2024-01-17T00:00:00Z',
      }

      const mockResponse: ApiResponse<User> = {
        success: true,
        data: adminUser,
        timestamp: '2024-01-17T00:00:00Z',
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await authService.getMe()

      expect(result.role).toBe('ADMIN')
      expect(result.email).toBe('admin@example.com')
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockedApi.post.mockRejectedValueOnce(networkError)

      await expect(authService.login({
        email: 'test@test.com',
        password: 'pass',
      })).rejects.toThrow('Network Error')
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout')
      mockedApi.post.mockRejectedValueOnce(timeoutError)

      await expect(authService.register({
        email: 'test@test.com',
        password: 'pass',
        name: 'Test',
      })).rejects.toThrow('Timeout')
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

      await expect(authService.getMe()).rejects.toEqual(serverError)
    })
  })
})
