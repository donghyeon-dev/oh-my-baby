import api from './api'
import { ApiResponse } from '@/types'

export interface LikeResponse {
  mediaId: string
  isLiked: boolean
  likeCount: number
}

export interface LikeInfo {
  userId: string
  userName: string
  createdAt: string
}

export const likeService = {
  async toggleLike(mediaId: string): Promise<LikeResponse> {
    const response = await api.post<ApiResponse<LikeResponse>>(
      `/media/${mediaId}/like`
    )
    return response.data.data!
  },

  async getLikes(mediaId: string): Promise<LikeInfo[]> {
    const response = await api.get<ApiResponse<LikeInfo[]>>(
      `/media/${mediaId}/likes`
    )
    return response.data.data!
  },
}

export default likeService
