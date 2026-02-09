package com.ohmybaby.domain.notification

import com.ohmybaby.common.exception.ForbiddenException
import com.ohmybaby.common.exception.NotFoundException
import com.ohmybaby.domain.media.Media
import com.ohmybaby.domain.notification.dto.NotificationListResponse
import com.ohmybaby.domain.notification.dto.NotificationResponse
import com.ohmybaby.domain.user.User
import com.ohmybaby.domain.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional
class NotificationService(
    private val notificationRepository: NotificationRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional(readOnly = true)
    fun getNotifications(userId: UUID, page: Int, size: Int): NotificationListResponse {
        val pageable = PageRequest.of(page, size)
        val notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
        val unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId)

        val content = notificationPage.content.map { NotificationResponse.from(it) }

        return NotificationListResponse(
            content = content,
            page = notificationPage.number,
            size = notificationPage.size,
            totalElements = notificationPage.totalElements,
            totalPages = notificationPage.totalPages,
            hasNext = notificationPage.hasNext(),
            unreadCount = unreadCount
        )
    }

    fun markAsRead(notificationId: UUID, userId: UUID) {
        val notification = notificationRepository.findById(notificationId)
            .orElseThrow { NotFoundException("Notification", notificationId) }

        // Verify ownership
        if (notification.user.getId() != userId) {
            throw ForbiddenException("알림에 대한 권한이 없습니다")
        }

        notification.markAsRead()
        notificationRepository.save(notification)

        logger.info("Notification marked as read: id=$notificationId by user=$userId")
    }

    fun markAllAsRead(userId: UUID) {
        val unreadNotifications = notificationRepository.findByUserIdAndIsReadFalse(userId)
        unreadNotifications.forEach { it.markAsRead() }
        notificationRepository.saveAll(unreadNotifications)

        logger.info("All notifications marked as read for user=$userId, count=${unreadNotifications.size}")
    }

    @Transactional(readOnly = true)
    fun getUnreadCount(userId: UUID): Long {
        return notificationRepository.countByUserIdAndIsReadFalse(userId)
    }

    fun createNotification(
        user: User,
        type: NotificationType,
        title: String,
        message: String? = null,
        media: Media? = null
    ): Notification {
        val notification = Notification(
            user = user,
            type = type,
            title = title,
            message = message,
            media = media
        )

        val saved = notificationRepository.save(notification)
        logger.info("Notification created: id=${saved.getId()}, type=$type, userId=${user.getId()}")

        return saved
    }

    fun notifyNewMedia(media: Media, uploaderName: String) {
        val uploaderId = media.uploader.getId()
        val allUsers = userRepository.findAll()

        // Create notifications for all users except the uploader
        val notifications = allUsers
            .filter { it.getId() != uploaderId }
            .map { user ->
                Notification(
                    user = user,
                    type = NotificationType.NEW_MEDIA,
                    title = "${uploaderName}님이 새 사진/동영상을 업로드했습니다",
                    message = null,
                    media = media
                )
            }

        notificationRepository.saveAll(notifications)
        logger.info("New media notifications created: mediaId=${media.getId()}, count=${notifications.size}")
    }
}
