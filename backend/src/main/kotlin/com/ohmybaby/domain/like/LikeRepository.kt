package com.ohmybaby.domain.like

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface LikeRepository : JpaRepository<Like, Long> {
    fun findByUserIdAndMediaId(userId: Long, mediaId: Long): Like?
    fun existsByUserIdAndMediaId(userId: Long, mediaId: Long): Boolean
    fun countByMediaId(mediaId: Long): Long
    fun deleteByUserIdAndMediaId(userId: Long, mediaId: Long)
    fun findAllByMediaId(mediaId: Long): List<Like>
}
