package com.ohmybaby.domain.comment

import com.ohmybaby.common.entity.PrimaryKeyEntity
import com.ohmybaby.domain.media.Media
import com.ohmybaby.domain.user.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "comments")
class Comment(
    user: User,
    media: Media,
    content: String
) : PrimaryKeyEntity() {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User = user
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id", nullable = false)
    var media: Media = media
        protected set

    @Column(name = "content", nullable = false, length = 500)
    var content: String = content
        protected set

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()

    override fun toString(): String {
        return "Comment(id=${getId()}, userId=${user.getId()}, mediaId=${media.getId()})"
    }
}
