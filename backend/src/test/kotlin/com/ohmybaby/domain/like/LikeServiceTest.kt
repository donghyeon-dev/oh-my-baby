package com.ohmybaby.domain.like

import com.ohmybaby.common.exception.NotFoundException
import com.ohmybaby.domain.like.dto.LikeInfo
import com.ohmybaby.domain.like.dto.LikeResponse
import com.ohmybaby.domain.media.Media
import com.ohmybaby.domain.media.MediaRepository
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
import java.time.LocalDateTime
import java.util.*

class LikeServiceTest {

    private lateinit var likeService: LikeService
    private lateinit var likeRepository: LikeRepository
    private lateinit var userRepository: UserRepository
    private lateinit var mediaRepository: MediaRepository

    @BeforeEach
    fun setUp() {
        likeRepository = mockk()
        userRepository = mockk()
        mediaRepository = mockk()

        likeService = LikeService(
            likeRepository = likeRepository,
            userRepository = userRepository,
            mediaRepository = mediaRepository
        )
    }

    @AfterEach
    fun tearDown() {
        clearAllMocks()
    }

    // ========== TOGGLE LIKE TESTS ==========

    @Test
    fun `toggleLike should add like when not liked and return isLiked=true`() {
        // Given
        val userId = UUID.randomUUID()
        val mediaId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.FAMILY)
        val media = createTestMedia(mediaId, user)
        val like = createTestLike(user, media)

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { mediaRepository.findById(mediaId) } returns Optional.of(media)
        every { likeRepository.findByUserIdAndMediaId(userId, mediaId) } returns null
        every { likeRepository.save(any<Like>()) } returns like
        every { likeRepository.countByMediaId(mediaId) } returns 1L

        // When
        val result = likeService.toggleLike(userId, mediaId)

        // Then
        assertNotNull(result)
        assertEquals(mediaId, result.mediaId)
        assertTrue(result.isLiked)
        assertEquals(1L, result.likeCount)

        verify(exactly = 1) { userRepository.findById(userId) }
        verify(exactly = 1) { mediaRepository.findById(mediaId) }
        verify(exactly = 1) { likeRepository.findByUserIdAndMediaId(userId, mediaId) }
        verify(exactly = 1) { likeRepository.save(any<Like>()) }
        verify(exactly = 1) { likeRepository.countByMediaId(mediaId) }
    }

    @Test
    fun `toggleLike should remove like when already liked and return isLiked=false`() {
        // Given
        val userId = UUID.randomUUID()
        val mediaId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.FAMILY)
        val media = createTestMedia(mediaId, user)
        val existingLike = createTestLike(user, media)

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { mediaRepository.findById(mediaId) } returns Optional.of(media)
        every { likeRepository.findByUserIdAndMediaId(userId, mediaId) } returns existingLike
        every { likeRepository.deleteByUserIdAndMediaId(userId, mediaId) } just Runs
        every { likeRepository.countByMediaId(mediaId) } returns 0L

        // When
        val result = likeService.toggleLike(userId, mediaId)

        // Then
        assertNotNull(result)
        assertEquals(mediaId, result.mediaId)
        assertFalse(result.isLiked)
        assertEquals(0L, result.likeCount)

        verify(exactly = 1) { userRepository.findById(userId) }
        verify(exactly = 1) { mediaRepository.findById(mediaId) }
        verify(exactly = 1) { likeRepository.findByUserIdAndMediaId(userId, mediaId) }
        verify(exactly = 1) { likeRepository.deleteByUserIdAndMediaId(userId, mediaId) }
        verify(exactly = 1) { likeRepository.countByMediaId(mediaId) }
        verify(exactly = 0) { likeRepository.save(any<Like>()) }
    }

    @Test
    fun `toggleLike should throw NotFoundException when user not found`() {
        // Given
        val userId = UUID.randomUUID()
        val mediaId = UUID.randomUUID()

        every { userRepository.findById(userId) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<NotFoundException> {
            likeService.toggleLike(userId, mediaId)
        }

        assertEquals("NOT_FOUND", exception.code)
        assertTrue(exception.message.contains("User"))

        verify(exactly = 1) { userRepository.findById(userId) }
        verify(exactly = 0) { mediaRepository.findById(any()) }
        verify(exactly = 0) { likeRepository.findByUserIdAndMediaId(any(), any()) }
    }

    @Test
    fun `toggleLike should throw NotFoundException when media not found`() {
        // Given
        val userId = UUID.randomUUID()
        val mediaId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.FAMILY)

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { mediaRepository.findById(mediaId) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<NotFoundException> {
            likeService.toggleLike(userId, mediaId)
        }

        assertEquals("NOT_FOUND", exception.code)
        assertTrue(exception.message.contains("Media"))

        verify(exactly = 1) { userRepository.findById(userId) }
        verify(exactly = 1) { mediaRepository.findById(mediaId) }
        verify(exactly = 0) { likeRepository.findByUserIdAndMediaId(any(), any()) }
    }

    @Test
    fun `toggleLike should return correct likeCount`() {
        // Given
        val userId = UUID.randomUUID()
        val mediaId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.FAMILY)
        val media = createTestMedia(mediaId, user)
        val like = createTestLike(user, media)

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { mediaRepository.findById(mediaId) } returns Optional.of(media)
        every { likeRepository.findByUserIdAndMediaId(userId, mediaId) } returns null
        every { likeRepository.save(any<Like>()) } returns like
        every { likeRepository.countByMediaId(mediaId) } returns 5L

        // When
        val result = likeService.toggleLike(userId, mediaId)

        // Then
        assertEquals(5L, result.likeCount)

        verify(exactly = 1) { likeRepository.countByMediaId(mediaId) }
    }

    // ========== GET LIKE COUNT TESTS ==========

    @Test
    fun `getLikeCount should return count from repository`() {
        // Given
        val mediaId = UUID.randomUUID()

        every { likeRepository.countByMediaId(mediaId) } returns 10L

        // When
        val result = likeService.getLikeCount(mediaId)

        // Then
        assertEquals(10L, result)

        verify(exactly = 1) { likeRepository.countByMediaId(mediaId) }
    }

    // ========== IS LIKED BY USER TESTS ==========

    @Test
    fun `isLikedByUser should return true when liked`() {
        // Given
        val userId = UUID.randomUUID()
        val mediaId = UUID.randomUUID()

        every { likeRepository.existsByUserIdAndMediaId(userId, mediaId) } returns true

        // When
        val result = likeService.isLikedByUser(userId, mediaId)

        // Then
        assertTrue(result)

        verify(exactly = 1) { likeRepository.existsByUserIdAndMediaId(userId, mediaId) }
    }

    @Test
    fun `isLikedByUser should return false when not liked`() {
        // Given
        val userId = UUID.randomUUID()
        val mediaId = UUID.randomUUID()

        every { likeRepository.existsByUserIdAndMediaId(userId, mediaId) } returns false

        // When
        val result = likeService.isLikedByUser(userId, mediaId)

        // Then
        assertFalse(result)

        verify(exactly = 1) { likeRepository.existsByUserIdAndMediaId(userId, mediaId) }
    }

    // ========== GET LIKES TESTS ==========

    @Test
    fun `getLikes should return list of LikeInfo`() {
        // Given
        val mediaId = UUID.randomUUID()
        val user1 = createTestUser(UUID.randomUUID(), UserRole.FAMILY, "User One")
        val user2 = createTestUser(UUID.randomUUID(), UserRole.PARENT, "User Two")
        val media = createTestMedia(mediaId, user1)
        val like1 = createTestLike(user1, media)
        val like2 = createTestLike(user2, media)
        val likes = listOf(like1, like2)

        every { mediaRepository.findById(mediaId) } returns Optional.of(media)
        every { likeRepository.findAllByMediaId(mediaId) } returns likes

        // When
        val result = likeService.getLikes(mediaId)

        // Then
        assertEquals(2, result.size)
        assertEquals(user1.getId(), result[0].userId)
        assertEquals("User One", result[0].userName)
        assertEquals(user2.getId(), result[1].userId)
        assertEquals("User Two", result[1].userName)

        verify(exactly = 1) { mediaRepository.findById(mediaId) }
        verify(exactly = 1) { likeRepository.findAllByMediaId(mediaId) }
    }

    @Test
    fun `getLikes should throw NotFoundException when media not found`() {
        // Given
        val mediaId = UUID.randomUUID()

        every { mediaRepository.findById(mediaId) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<NotFoundException> {
            likeService.getLikes(mediaId)
        }

        assertEquals("NOT_FOUND", exception.code)
        assertTrue(exception.message.contains("Media"))

        verify(exactly = 1) { mediaRepository.findById(mediaId) }
        verify(exactly = 0) { likeRepository.findAllByMediaId(any()) }
    }

    @Test
    fun `getLikes should return empty list when no likes`() {
        // Given
        val mediaId = UUID.randomUUID()
        val user = createTestUser(UUID.randomUUID(), UserRole.PARENT)
        val media = createTestMedia(mediaId, user)

        every { mediaRepository.findById(mediaId) } returns Optional.of(media)
        every { likeRepository.findAllByMediaId(mediaId) } returns emptyList()

        // When
        val result = likeService.getLikes(mediaId)

        // Then
        assertEquals(0, result.size)

        verify(exactly = 1) { mediaRepository.findById(mediaId) }
        verify(exactly = 1) { likeRepository.findAllByMediaId(mediaId) }
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

    private fun createTestLike(user: User, media: Media): Like {
        return Like(
            user = user,
            media = media
        ).apply {
            setIdForTest(UUID.randomUUID())
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

    private fun Like.setIdForTest(id: UUID) {
        val field = this::class.java.superclass.getDeclaredField("id")
        field.isAccessible = true
        field.set(this, id)
    }
}
