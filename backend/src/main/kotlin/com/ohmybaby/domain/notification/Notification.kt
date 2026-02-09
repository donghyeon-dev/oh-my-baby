package com.ohmybaby.domain.notification

import com.ohmybaby.common.entity.PrimaryKeyEntity
import com.ohmybaby.domain.media.Media
import com.ohmybaby.domain.user.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "notifications")
class Notification(
    user: User,
    type: NotificationType,
    title: String,
    message: String? = null,
    media: Media? = null
) : PrimaryKeyEntity() {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User = user
        protected set

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    var type: NotificationType = type
        protected set

    @Column(name = "title", nullable = false)
    var title: String = title
        protected set

    @Column(name = "message")
    var message: String? = message
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id")
    var media: Media? = media
        protected set

    @Column(name = "is_read", nullable = false)
    var isRead: Boolean = false
        protected set

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()

    fun markAsRead() {
        this.isRead = true
    }

    override fun toString(): String {
        return "Notification(id=${getId()}, type=$type, title='$title', isRead=$isRead)"
    }
}

enum class NotificationType {
    NEW_MEDIA,      // 새 미디어 업로드
    NEW_LIKE,       // 좋아요 받음
    SYSTEM          // 시스템 알림
}
