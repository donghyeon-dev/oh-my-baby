package com.ohmybaby.domain.notification.dto

import com.ohmybaby.domain.notification.Notification
import com.ohmybaby.domain.notification.NotificationType
import java.time.LocalDateTime
import java.util.UUID

data class NotificationResponse(
    val id: UUID,
    val type: NotificationType,
    val title: String,
    val message: String?,
    val mediaId: UUID?,
    val isRead: Boolean,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(notification: Notification): NotificationResponse {
            return NotificationResponse(
                id = notification.getId(),
                type = notification.type,
                title = notification.title,
                message = notification.message,
                mediaId = notification.media?.getId(),
                isRead = notification.isRead,
                createdAt = notification.createdAt
            )
        }
    }
}

data class NotificationListResponse(
    val content: List<NotificationResponse>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val hasNext: Boolean,
    val unreadCount: Long
)

data class UnreadCountResponse(
    val count: Long
)
