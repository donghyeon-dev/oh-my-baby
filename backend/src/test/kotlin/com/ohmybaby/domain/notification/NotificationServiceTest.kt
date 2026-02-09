package com.ohmybaby.domain.notification

import com.ohmybaby.common.exception.ForbiddenException
import com.ohmybaby.common.exception.NotFoundException
import com.ohmybaby.domain.notification.dto.NotificationListResponse
import com.ohmybaby.domain.notification.dto.NotificationResponse
import com.ohmybaby.domain.media.Media
import com.ohmybaby.domain.media.MediaType
import com.ohmybaby.domain.user.User
import com.ohmybaby.domain.user.UserRepository
import com.ohmybaby.domain.user.UserRole
import io.mockk.*
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.util.*

class NotificationServiceTest {

    private lateinit var notificationService: NotificationService
    private lateinit var notificationRepository: NotificationRepository
    private lateinit var userRepository: UserRepository

    @BeforeEach
    fun setUp() {
        notificationRepository = mockk()
        userRepository = mockk()

        notificationService = NotificationService(
            notificationRepository = notificationRepository,
            userRepository = userRepository
        )
    }

    @AfterEach
    fun tearDown() {
        clearAllMocks()
    }

    // ========== GET NOTIFICATIONS TESTS ==========

    @Test
    fun `getNotifications should return paginated notifications with unread count`() {
        // Given
        val userId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.VIEWER)
        val notification1 = createTestNotification(user, NotificationType.NEW_MEDIA, isRead = false)
        val notification2 = createTestNotification(user, NotificationType.NEW_LIKE, isRead = true)
        val notifications = listOf(notification1, notification2)
        val page = PageImpl(notifications, PageRequest.of(0, 10), 2)

        every { notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, any()) } returns page
        every { notificationRepository.countByUserIdAndIsReadFalse(userId) } returns 1L

        // When
        val result = notificationService.getNotifications(userId, 0, 10)

        // Then
        assertNotNull(result)
        assertEquals(2, result.content.size)
        assertEquals(0, result.page)
        assertEquals(10, result.size)
        assertEquals(2L, result.totalElements)
        assertEquals(1, result.totalPages)
        assertFalse(result.hasNext)
        assertEquals(1L, result.unreadCount)

        verify(exactly = 1) { notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, any()) }
        verify(exactly = 1) { notificationRepository.countByUserIdAndIsReadFalse(userId) }
    }

    @Test
    fun `getNotifications should return empty list when no notifications`() {
        // Given
        val userId = UUID.randomUUID()
        val page = PageImpl(emptyList<Notification>(), PageRequest.of(0, 10), 0)

        every { notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, any()) } returns page
        every { notificationRepository.countByUserIdAndIsReadFalse(userId) } returns 0L

        // When
        val result = notificationService.getNotifications(userId, 0, 10)

        // Then
        assertEquals(0, result.content.size)
        assertEquals(0L, result.unreadCount)

        verify(exactly = 1) { notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, any()) }
        verify(exactly = 1) { notificationRepository.countByUserIdAndIsReadFalse(userId) }
    }

    // ========== MARK AS READ TESTS ==========

    @Test
    fun `markAsRead should mark notification as read`() {
        // Given
        val notificationId = UUID.randomUUID()
        val userId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.VIEWER)
        val notification = createTestNotification(user, NotificationType.NEW_MEDIA, isRead = false)

        every { notificationRepository.findById(notificationId) } returns Optional.of(notification)
        every { notificationRepository.save(notification) } returns notification

        // When
        notificationService.markAsRead(notificationId, userId)

        // Then
        assertTrue(notification.isRead)

        verify(exactly = 1) { notificationRepository.findById(notificationId) }
        verify(exactly = 1) { notificationRepository.save(notification) }
    }

    @Test
    fun `markAsRead should throw NotFoundException when notification not found`() {
        // Given
        val notificationId = UUID.randomUUID()
        val userId = UUID.randomUUID()

        every { notificationRepository.findById(notificationId) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<NotFoundException> {
            notificationService.markAsRead(notificationId, userId)
        }

        assertEquals("NOT_FOUND", exception.code)
        assertTrue(exception.message.contains("Notification"))

        verify(exactly = 1) { notificationRepository.findById(notificationId) }
        verify(exactly = 0) { notificationRepository.save(any()) }
    }

    @Test
    fun `markAsRead should throw ForbiddenException when user doesn't own notification`() {
        // Given
        val notificationId = UUID.randomUUID()
        val ownerId = UUID.randomUUID()
        val otherUserId = UUID.randomUUID()
        val owner = createTestUser(ownerId, UserRole.VIEWER)
        val notification = createTestNotification(owner, NotificationType.NEW_MEDIA, isRead = false)

        every { notificationRepository.findById(notificationId) } returns Optional.of(notification)

        // When & Then
        val exception = assertThrows<ForbiddenException> {
            notificationService.markAsRead(notificationId, otherUserId)
        }

        assertEquals("FORBIDDEN", exception.code)
        assertTrue(exception.message.contains("권한"))

        verify(exactly = 1) { notificationRepository.findById(notificationId) }
        verify(exactly = 0) { notificationRepository.save(any()) }
    }

    // ========== MARK ALL AS READ TESTS ==========

    @Test
    fun `markAllAsRead should mark all user notifications as read`() {
        // Given
        val userId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.VIEWER)
        val notification1 = createTestNotification(user, NotificationType.NEW_MEDIA, isRead = false)
        val notification2 = createTestNotification(user, NotificationType.NEW_LIKE, isRead = false)
        val unreadNotifications = listOf(notification1, notification2)

        every { notificationRepository.findByUserIdAndIsReadFalse(userId) } returns unreadNotifications
        every { notificationRepository.saveAll(unreadNotifications) } returns unreadNotifications

        // When
        notificationService.markAllAsRead(userId)

        // Then
        assertTrue(notification1.isRead)
        assertTrue(notification2.isRead)

        verify(exactly = 1) { notificationRepository.findByUserIdAndIsReadFalse(userId) }
        verify(exactly = 1) { notificationRepository.saveAll(unreadNotifications) }
    }

    // ========== GET UNREAD COUNT TESTS ==========

    @Test
    fun `getUnreadCount should return count of unread notifications`() {
        // Given
        val userId = UUID.randomUUID()

        every { notificationRepository.countByUserIdAndIsReadFalse(userId) } returns 5L

        // When
        val result = notificationService.getUnreadCount(userId)

        // Then
        assertEquals(5L, result)

        verify(exactly = 1) { notificationRepository.countByUserIdAndIsReadFalse(userId) }
    }

    // ========== CREATE NOTIFICATION TESTS ==========

    @Test
    fun `createNotification should save notification`() {
        // Given
        val userId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.VIEWER)
        val notification = createTestNotification(user, NotificationType.SYSTEM, isRead = false)

        every { notificationRepository.save(any<Notification>()) } returns notification

        // When
        val result = notificationService.createNotification(
            user = user,
            type = NotificationType.SYSTEM,
            title = "System notification",
            message = "Test message",
            media = null
        )

        // Then
        assertNotNull(result)
        assertEquals(NotificationType.SYSTEM, result.type)

        verify(exactly = 1) { notificationRepository.save(any<Notification>()) }
    }

    // ========== NOTIFY NEW MEDIA TESTS ==========

    @Test
    fun `notifyNewMedia should create notifications for all users except uploader`() {
        // Given
        val uploaderId = UUID.randomUUID()
        val user1Id = UUID.randomUUID()
        val user2Id = UUID.randomUUID()
        val uploader = createTestUser(uploaderId, UserRole.ADMIN, "Uploader")
        val user1 = createTestUser(user1Id, UserRole.VIEWER, "User1")
        val user2 = createTestUser(user2Id, UserRole.VIEWER, "User2")
        val media = createTestMedia(UUID.randomUUID(), uploader)
        val allUsers = listOf(uploader, user1, user2)

        every { userRepository.findAll() } returns allUsers
        every { notificationRepository.saveAll(any<List<Notification>>()) } answers { firstArg() }

        // When
        notificationService.notifyNewMedia(media, "Uploader")

        // Then
        verify(exactly = 1) { userRepository.findAll() }
        verify(exactly = 1) {
            notificationRepository.saveAll(match<List<Notification>> { notifications ->
                notifications.size == 2 && // Only 2 notifications (not for uploader)
                notifications.all { it.type == NotificationType.NEW_MEDIA } &&
                notifications.none { it.user.getId() == uploaderId } &&
                notifications.all { it.title.contains("Uploader") }
            })
        }
    }

    @Test
    fun `notifyNewMedia should not create notification for uploader`() {
        // Given
        val uploaderId = UUID.randomUUID()
        val uploader = createTestUser(uploaderId, UserRole.ADMIN, "Uploader")
        val media = createTestMedia(UUID.randomUUID(), uploader)
        val allUsers = listOf(uploader)

        every { userRepository.findAll() } returns allUsers
        every { notificationRepository.saveAll(any<List<Notification>>()) } answers { firstArg() }

        // When
        notificationService.notifyNewMedia(media, "Uploader")

        // Then
        verify(exactly = 1) { userRepository.findAll() }
        verify(exactly = 1) {
            notificationRepository.saveAll(match<List<Notification>> { notifications ->
                notifications.isEmpty() // No notifications when only uploader exists
            })
        }
    }

    @Test
    fun `notifyNewMedia should handle single user scenario`() {
        // Given
        val uploaderId = UUID.randomUUID()
        val uploader = createTestUser(uploaderId, UserRole.ADMIN, "Uploader")
        val media = createTestMedia(UUID.randomUUID(), uploader)

        every { userRepository.findAll() } returns listOf(uploader)
        every { notificationRepository.saveAll(any<List<Notification>>()) } answers { firstArg() }

        // When
        notificationService.notifyNewMedia(media, "Uploader")

        // Then
        verify(exactly = 1) { userRepository.findAll() }
        verify(exactly = 1) {
            notificationRepository.saveAll(match<List<Notification>> { it.isEmpty() })
        }
    }

    // ========== HELPER FUNCTIONS ==========

    private fun createTestUser(id: UUID, role: UserRole, name: String = "Test User"): User {
        return User(
            email = "test@example.com",
            password = "encodedPassword",
            name = name,
            role = role
        ).apply {
            setIdForTest(id)
        }
    }

    private fun createTestMedia(id: UUID, uploader: User): Media {
        return Media(
            uploader = uploader,
            type = MediaType.PHOTO,
            originalName = "test.jpg",
            storedPath = "photos/test.jpg",
            size = 1024L,
            mimeType = "image/jpeg"
        ).apply {
            setIdForTest(id)
        }
    }

    private fun createTestNotification(
        user: User,
        type: NotificationType,
        isRead: Boolean
    ): Notification {
        return Notification(
            user = user,
            type = type,
            title = "Test notification",
            message = "Test message",
            media = null
        ).apply {
            setIdForTest(UUID.randomUUID())
            if (isRead) {
                markAsRead()
            }
        }
    }

    private fun User.setIdForTest(id: UUID) {
        val field = this::class.java.superclass.getDeclaredField("id")
        field.isAccessible = true
        field.set(this, id)
    }

    private fun Media.setIdForTest(id: UUID) {
        val field = this::class.java.superclass.getDeclaredField("id")
        field.isAccessible = true
        field.set(this, id)
    }

    private fun Notification.setIdForTest(id: UUID) {
        val field = this::class.java.superclass.getDeclaredField("id")
        field.isAccessible = true
        field.set(this, id)
    }
}
