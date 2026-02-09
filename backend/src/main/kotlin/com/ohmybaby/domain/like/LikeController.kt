package com.ohmybaby.domain.like

import com.ohmybaby.common.response.ApiResponse
import com.ohmybaby.domain.auth.UserPrincipal
import com.ohmybaby.domain.like.dto.LikeInfo
import com.ohmybaby.domain.like.dto.LikeResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/media")
@Tag(name = "Like", description = "Like management API")
class LikeController(
    private val likeService: LikeService
) {

    @PostMapping("/{mediaId}/like")
    @Operation(summary = "Toggle like on media", description = "Add or remove like on a media item")
    fun toggleLike(
        @PathVariable mediaId: UUID,
        @AuthenticationPrincipal userPrincipal: UserPrincipal
    ): ApiResponse<LikeResponse> {
        val response = likeService.toggleLike(userPrincipal.id, mediaId)
        return ApiResponse.success(response)
    }

    @GetMapping("/{mediaId}/likes")
    @Operation(summary = "Get likes for media", description = "Get list of users who liked a media item")
    fun getLikes(@PathVariable mediaId: UUID): ApiResponse<List<LikeInfo>> {
        val likes = likeService.getLikes(mediaId)
        return ApiResponse.success(likes)
    }
}
