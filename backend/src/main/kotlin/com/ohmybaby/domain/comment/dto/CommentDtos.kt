package com.ohmybaby.domain.comment.dto

import com.ohmybaby.domain.comment.Comment
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDateTime
import java.util.UUID

data class CreateCommentRequest(
    @field:NotBlank(message = "Content must not be blank")
    @field:Size(max = 500, message = "Content must not exceed 500 characters")
    val content: String
)

data class CommentResponse(
    val id: UUID,
    val userId: UUID,
    val userName: String,
    val content: String,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(comment: Comment): CommentResponse {
            return CommentResponse(
                id = comment.getId(),
                userId = comment.user.getId(),
                userName = comment.user.name,
                content = comment.content,
                createdAt = comment.createdAt
            )
        }
    }
}
