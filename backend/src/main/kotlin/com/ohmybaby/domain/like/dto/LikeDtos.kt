package com.ohmybaby.domain.like.dto

import java.time.LocalDateTime
import java.util.UUID

data class LikeResponse(
    val mediaId: UUID,
    val isLiked: Boolean,
    val likeCount: Long
)

data class LikeInfo(
    val userId: UUID,
    val userName: String,
    val createdAt: LocalDateTime
)
