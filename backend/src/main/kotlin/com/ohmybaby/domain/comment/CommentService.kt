package com.ohmybaby.domain.comment

import com.ohmybaby.common.exception.ForbiddenException
import com.ohmybaby.common.exception.NotFoundException
import com.ohmybaby.domain.comment.dto.CommentResponse
import com.ohmybaby.domain.media.MediaRepository
import com.ohmybaby.domain.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class CommentService(
    private val commentRepository: CommentRepository,
    private val userRepository: UserRepository,
    private val mediaRepository: MediaRepository
) {

    @Transactional
    fun createComment(userId: UUID, mediaId: UUID, content: String): CommentResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { NotFoundException("User", userId) }
        val media = mediaRepository.findById(mediaId)
            .orElseThrow { NotFoundException("Media", mediaId) }

        val comment = commentRepository.save(Comment(user = user, media = media, content = content))
        return CommentResponse.from(comment)
    }

    fun getComments(mediaId: UUID): List<CommentResponse> {
        return commentRepository.findAllByMediaIdOrderByCreatedAtDesc(mediaId)
            .map { CommentResponse.from(it) }
    }

    @Transactional
    fun deleteComment(commentId: UUID, userId: UUID) {
        val comment = commentRepository.findById(commentId)
            .orElseThrow { NotFoundException("Comment", commentId) }

        if (comment.user.getId() != userId) {
            throw ForbiddenException("You can only delete your own comments")
        }

        commentRepository.delete(comment)
    }

    fun getCommentCount(mediaId: UUID): Long {
        return commentRepository.countByMediaId(mediaId)
    }
}
