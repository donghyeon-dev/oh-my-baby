package com.ohmybaby.domain.comment

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface CommentRepository : JpaRepository<Comment, UUID> {
    fun findAllByMediaIdOrderByCreatedAtDesc(mediaId: UUID): List<Comment>
    fun countByMediaId(mediaId: UUID): Long
}
