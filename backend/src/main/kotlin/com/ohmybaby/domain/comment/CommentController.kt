package com.ohmybaby.domain.comment

import com.ohmybaby.common.response.ApiResponse
import com.ohmybaby.domain.auth.UserPrincipal
import com.ohmybaby.domain.comment.dto.CommentResponse
import com.ohmybaby.domain.comment.dto.CreateCommentRequest
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/media")
@Tag(name = "Comment", description = "Comment management API")
class CommentController(
    private val commentService: CommentService
) {

    @PostMapping("/{mediaId}/comments")
    @Operation(summary = "Add comment to media", description = "Add a comment to a media item")
    fun createComment(
        @PathVariable mediaId: UUID,
        @Valid @RequestBody request: CreateCommentRequest,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ApiResponse<CommentResponse> {
        val response = commentService.createComment(userPrincipal.id, mediaId, request.content)
        return ApiResponse.success(response)
    }

    @GetMapping("/{mediaId}/comments")
    @Operation(summary = "Get comments for media", description = "Get list of comments for a media item")
    fun getComments(@PathVariable mediaId: UUID): ApiResponse<List<CommentResponse>> {
        val comments = commentService.getComments(mediaId)
        return ApiResponse.success(comments)
    }

    @DeleteMapping("/{mediaId}/comments/{commentId}")
    @Operation(summary = "Delete comment", description = "Delete your own comment from a media item")
    fun deleteComment(
        @PathVariable mediaId: UUID,
        @PathVariable commentId: UUID,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ApiResponse<Unit> {
        commentService.deleteComment(commentId, userPrincipal.id)
        return ApiResponse.success()
    }
}
