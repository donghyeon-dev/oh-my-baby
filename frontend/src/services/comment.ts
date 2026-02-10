import api from './api'
import { ApiResponse, Comment } from '@/types'

export const commentService = {
  async addComment(mediaId: string, content: string): Promise<Comment> {
    const response = await api.post<ApiResponse<Comment>>(
      `/media/${mediaId}/comments`,
      { content }
    )
    return response.data.data!
  },

  async getComments(mediaId: string): Promise<Comment[]> {
    const response = await api.get<ApiResponse<Comment[]>>(
      `/media/${mediaId}/comments`
    )
    return response.data.data!
  },

  async deleteComment(mediaId: string, commentId: string): Promise<void> {
    await api.delete(`/media/${mediaId}/comments/${commentId}`)
  },
}

export default commentService
