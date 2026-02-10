import api from './api'
import { ApiResponse, User } from '@/types'

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/users')
    return response.data.data!
  },
}

export default userService
