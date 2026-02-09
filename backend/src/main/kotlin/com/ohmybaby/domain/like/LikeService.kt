package com.ohmybaby.domain.like

import com.ohmybaby.common.exception.NotFoundException
import com.ohmybaby.domain.like.dto.LikeInfo
import com.ohmybaby.domain.like.dto.LikeResponse
import com.ohmybaby.domain.media.MediaRepository
import com.ohmybaby.domain.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class LikeService(
    private val likeRepository: LikeRepository,
    private val userRepository: UserRepository,
    private val mediaRepository: MediaRepository
) {

    @Transactional
    fun toggleLike(userId: UUID, mediaId: UUID): LikeResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { NotFoundException("User", userId) }
        val media = mediaRepository.findById(mediaId)
            .orElseThrow { NotFoundException("Media", mediaId) }

        val existingLike = likeRepository.findByUserIdAndMediaId(userId, mediaId)

        val isLiked = if (existingLike != null) {
            likeRepository.deleteByUserIdAndMediaId(userId, mediaId)
            false
        } else {
            likeRepository.save(Like(user = user, media = media))
            true
        }

        val likeCount = likeRepository.countByMediaId(mediaId)

        return LikeResponse(
            mediaId = mediaId,
            isLiked = isLiked,
            likeCount = likeCount
        )
    }

    fun getLikeCount(mediaId: UUID): Long {
        return likeRepository.countByMediaId(mediaId)
    }

    fun isLikedByUser(userId: UUID, mediaId: UUID): Boolean {
        return likeRepository.existsByUserIdAndMediaId(userId, mediaId)
    }

    fun getLikes(mediaId: UUID): List<LikeInfo> {
        val media = mediaRepository.findById(mediaId)
            .orElseThrow { NotFoundException("Media", mediaId) }

        return likeRepository.findAllByMediaId(mediaId).map { like ->
            LikeInfo(
                userId = like.user.getId(),
                userName = like.user.name,
                createdAt = like.createdAt
            )
        }
    }
}
