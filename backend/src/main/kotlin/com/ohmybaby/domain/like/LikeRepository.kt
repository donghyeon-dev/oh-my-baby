package com.ohmybaby.domain.like

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface LikeRepository : JpaRepository<Like, UUID> {
    fun findByUserIdAndMediaId(userId: UUID, mediaId: UUID): Like?
    fun existsByUserIdAndMediaId(userId: UUID, mediaId: UUID): Boolean
    fun countByMediaId(mediaId: UUID): Long
    fun deleteByUserIdAndMediaId(userId: UUID, mediaId: UUID)
    fun findAllByMediaId(mediaId: UUID): List<Like>
}
