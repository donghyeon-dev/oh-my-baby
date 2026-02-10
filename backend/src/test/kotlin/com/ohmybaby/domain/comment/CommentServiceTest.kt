package com.ohmybaby.domain.comment

import com.ohmybaby.common.exception.ForbiddenException
import com.ohmybaby.common.exception.NotFoundException
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
import java.util.*

class CommentServiceTest {

    private lateinit var commentService: CommentService
    private lateinit var commentRepository: CommentRepository
    private lateinit var userRepository: UserRepository
    private lateinit var mediaRepository: MediaRepository

    @BeforeEach
    fun setUp() {
        commentRepository = mockk()
        userRepository = mockk()
        mediaRepository = mockk()

        commentService = CommentService(
            commentRepository = commentRepository,
            userRepository = userRepository,
            mediaRepository = mediaRepository
        )
    }

    @AfterEach
    fun tearDown() {
        clearAllMocks()
    }

    // ========== CREATE COMMENT TESTS ==========

    @Test
    fun `createComment should create and return comment response`() {
        // Given
        val userId = UUID.randomUUID()
        val mediaId = UUID.randomUUID()
        val content = "Great photo!"
        val user = createTestUser(userId, UserRole.FAMILY, "Test User")
        val media = createTestMedia(mediaId, user)
        val comment = createTestComment(UUID.randomUUID(), user, media, content)

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { mediaRepository.findById(mediaId) } returns Optional.of(media)
        every { commentRepository.save(any<Comment>()) } returns comment

        // When
        val result = commentService.createComment(userId, mediaId, content)

        // Then
        assertNotNull(result)
        assertEquals(comment.getId(), result.id)
        assertEquals(userId, result.userId)
        assertEquals("Test User", result.userName)
        assertEquals(content, result.content)

        verify(exactly = 1) { userRepository.findById(userId) }
        verify(exactly = 1) { mediaRepository.findById(mediaId) }
        verify(exactly = 1) { commentRepository.save(any<Comment>()) }
    }

    @Test
    fun `createComment should throw NotFoundException when user not found`() {
        // Given
        val userId = UUID.randomUUID()
        val mediaId = UUID.randomUUID()

        every { userRepository.findById(userId) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<NotFoundException> {
            commentService.createComment(userId, mediaId, "test")
        }

        assertEquals("NOT_FOUND", exception.code)
        assertTrue(exception.message.contains("User"))

        verify(exactly = 1) { userRepository.findById(userId) }
        verify(exactly = 0) { mediaRepository.findById(any()) }
    }

    @Test
    fun `createComment should throw NotFoundException when media not found`() {
        // Given
        val userId = UUID.randomUUID()
        val mediaId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.FAMILY)

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { mediaRepository.findById(mediaId) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<NotFoundException> {
            commentService.createComment(userId, mediaId, "test")
        }

        assertEquals("NOT_FOUND", exception.code)
        assertTrue(exception.message.contains("Media"))

        verify(exactly = 1) { userRepository.findById(userId) }
        verify(exactly = 1) { mediaRepository.findById(mediaId) }
        verify(exactly = 0) { commentRepository.save(any<Comment>()) }
    }

    // ========== GET COMMENTS TESTS ==========

    @Test
    fun `getComments should return list of comment responses`() {
        // Given
        val mediaId = UUID.randomUUID()
        val user1 = createTestUser(UUID.randomUUID(), UserRole.FAMILY, "User One")
        val user2 = createTestUser(UUID.randomUUID(), UserRole.PARENT, "User Two")
        val media = createTestMedia(mediaId, user1)
        val comment1 = createTestComment(UUID.randomUUID(), user1, media, "Nice!")
        val comment2 = createTestComment(UUID.randomUUID(), user2, media, "Beautiful!")

        every { commentRepository.findAllByMediaIdOrderByCreatedAtDesc(mediaId) } returns listOf(comment1, comment2)

        // When
        val result = commentService.getComments(mediaId)

        // Then
        assertEquals(2, result.size)
        assertEquals(user1.getId(), result[0].userId)
        assertEquals("User One", result[0].userName)
        assertEquals("Nice!", result[0].content)
        assertEquals(user2.getId(), result[1].userId)
        assertEquals("User Two", result[1].userName)
        assertEquals("Beautiful!", result[1].content)

        verify(exactly = 1) { commentRepository.findAllByMediaIdOrderByCreatedAtDesc(mediaId) }
    }

    @Test
    fun `getComments should return empty list when no comments`() {
        // Given
        val mediaId = UUID.randomUUID()

        every { commentRepository.findAllByMediaIdOrderByCreatedAtDesc(mediaId) } returns emptyList()

        // When
        val result = commentService.getComments(mediaId)

        // Then
        assertEquals(0, result.size)

        verify(exactly = 1) { commentRepository.findAllByMediaIdOrderByCreatedAtDesc(mediaId) }
    }

    // ========== DELETE COMMENT TESTS ==========

    @Test
    fun `deleteComment should delete own comment`() {
        // Given
        val userId = UUID.randomUUID()
        val commentId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.FAMILY)
        val media = createTestMedia(UUID.randomUUID(), user)
        val comment = createTestComment(commentId, user, media, "My comment")

        every { commentRepository.findById(commentId) } returns Optional.of(comment)
        every { commentRepository.delete(comment) } just Runs

        // When
        commentService.deleteComment(commentId, userId)

        // Then
        verify(exactly = 1) { commentRepository.findById(commentId) }
        verify(exactly = 1) { commentRepository.delete(comment) }
    }

    @Test
    fun `deleteComment should throw ForbiddenException when deleting other user's comment`() {
        // Given
        val ownerId = UUID.randomUUID()
        val otherUserId = UUID.randomUUID()
        val commentId = UUID.randomUUID()
        val owner = createTestUser(ownerId, UserRole.FAMILY)
        val media = createTestMedia(UUID.randomUUID(), owner)
        val comment = createTestComment(commentId, owner, media, "Owner's comment")

        every { commentRepository.findById(commentId) } returns Optional.of(comment)

        // When & Then
        val exception = assertThrows<ForbiddenException> {
            commentService.deleteComment(commentId, otherUserId)
        }

        assertEquals("FORBIDDEN", exception.code)

        verify(exactly = 1) { commentRepository.findById(commentId) }
        verify(exactly = 0) { commentRepository.delete(any()) }
    }

    @Test
    fun `deleteComment should throw NotFoundException when comment not found`() {
        // Given
        val commentId = UUID.randomUUID()
        val userId = UUID.randomUUID()

        every { commentRepository.findById(commentId) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<NotFoundException> {
            commentService.deleteComment(commentId, userId)
        }

        assertEquals("NOT_FOUND", exception.code)
        assertTrue(exception.message.contains("Comment"))

        verify(exactly = 1) { commentRepository.findById(commentId) }
        verify(exactly = 0) { commentRepository.delete(any()) }
    }

    // ========== GET COMMENT COUNT TESTS ==========

    @Test
    fun `getCommentCount should return count from repository`() {
        // Given
        val mediaId = UUID.randomUUID()

        every { commentRepository.countByMediaId(mediaId) } returns 5L

        // When
        val result = commentService.getCommentCount(mediaId)

        // Then
        assertEquals(5L, result)

        verify(exactly = 1) { commentRepository.countByMediaId(mediaId) }
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

    private fun createTestComment(id: UUID, user: User, media: Media, content: String): Comment {
        return Comment(
            user = user,
            media = media,
            content = content
        ).apply {
            setIdForTest(id)
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

    private fun Comment.setIdForTest(id: UUID) {
        val field = this::class.java.superclass.getDeclaredField("id")
        field.isAccessible = true
        field.set(this, id)
    }
}
