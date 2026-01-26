package com.ohmybaby.domain.media

import com.ohmybaby.common.exception.ForbiddenException
import com.ohmybaby.common.exception.InvalidRequestException
import com.ohmybaby.common.exception.NotFoundException
import com.ohmybaby.domain.media.dto.MediaFilterRequest
import com.ohmybaby.domain.user.User
import com.ohmybaby.domain.user.UserRepository
import com.ohmybaby.domain.user.UserRole
import com.ohmybaby.infra.storage.MinioStorageService
import io.mockk.*
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.web.multipart.MultipartFile
import java.util.*

class MediaServiceTest {

    private lateinit var mediaService: MediaService
    private lateinit var mediaRepository: MediaRepository
    private lateinit var userRepository: UserRepository
    private lateinit var storageService: MinioStorageService

    @BeforeEach
    fun setUp() {
        mediaRepository = mockk()
        userRepository = mockk()
        storageService = mockk()

        mediaService = MediaService(
            mediaRepository = mediaRepository,
            userRepository = userRepository,
            storageService = storageService
        )
    }

    @AfterEach
    fun tearDown() {
        clearAllMocks()
    }

    // ========== UPLOAD TESTS ==========

    @Test
    fun `uploadFile should upload file successfully for admin user`() {
        // Given
        val userId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.ADMIN)
        val file = mockMultipartFile("test.jpg", "image/jpeg", 1024)
        val storedPath = "photos/uuid.jpg"
        val presignedUrl = "http://minio/photos/uuid.jpg?signed=true"

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { storageService.uploadFile(file, "photos") } returns storedPath
        every { storageService.getPresignedUrl(storedPath) } returns presignedUrl
        every { mediaRepository.save(any<Media>()) } answers { firstArg() }

        // When
        val result = mediaService.uploadFile(file, userId)

        // Then
        assertNotNull(result)
        assertEquals("test.jpg", result.originalName)
        assertEquals(MediaType.PHOTO, result.type)
        assertEquals(presignedUrl, result.url)
        assertEquals(1024L, result.size)
        assertEquals("image/jpeg", result.mimeType)

        verify(exactly = 1) { userRepository.findById(userId) }
        verify(exactly = 1) { storageService.uploadFile(file, "photos") }
        verify(exactly = 1) { mediaRepository.save(any<Media>()) }
    }

    @Test
    fun `uploadFile should throw ForbiddenException for viewer user`() {
        // Given
        val userId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.VIEWER)
        val file = mockMultipartFile("test.jpg", "image/jpeg", 1024)

        every { userRepository.findById(userId) } returns Optional.of(user)

        // When & Then
        val exception = assertThrows<ForbiddenException> {
            mediaService.uploadFile(file, userId)
        }

        assertEquals("FORBIDDEN", exception.code)
        assertTrue(exception.message.contains("업로드 권한"))

        verify(exactly = 1) { userRepository.findById(userId) }
        verify(exactly = 0) { storageService.uploadFile(any(), any()) }
    }

    @Test
    fun `uploadFile should throw NotFoundException when user not found`() {
        // Given
        val userId = UUID.randomUUID()
        val file = mockMultipartFile("test.jpg", "image/jpeg", 1024)

        every { userRepository.findById(userId) } returns Optional.empty()

        // When & Then
        assertThrows<NotFoundException> {
            mediaService.uploadFile(file, userId)
        }

        verify(exactly = 1) { userRepository.findById(userId) }
        verify(exactly = 0) { storageService.uploadFile(any(), any()) }
    }

    @Test
    fun `uploadFile should throw InvalidRequestException for empty file`() {
        // Given
        val userId = UUID.randomUUID()
        val file = mockMultipartFile("test.jpg", "image/jpeg", 0)

        every { file.isEmpty } returns true

        // When & Then
        val exception = assertThrows<InvalidRequestException> {
            mediaService.uploadFile(file, userId)
        }

        assertEquals("INVALID_REQUEST", exception.code)
        assertTrue(exception.message.contains("비어있습니다"))

        verify(exactly = 0) { userRepository.findById(any()) }
    }

    @Test
    fun `uploadFile should throw InvalidRequestException for unsupported file type`() {
        // Given
        val userId = UUID.randomUUID()
        val file = mockMultipartFile("test.exe", "application/x-executable", 1024)

        // When & Then
        val exception = assertThrows<InvalidRequestException> {
            mediaService.uploadFile(file, userId)
        }

        assertEquals("INVALID_REQUEST", exception.code)
        assertTrue(exception.message.contains("지원하지 않는 파일 형식"))

        verify(exactly = 0) { userRepository.findById(any()) }
    }

    @Test
    fun `uploadFile should throw InvalidRequestException for file exceeding size limit`() {
        // Given
        val userId = UUID.randomUUID()
        val file = mockMultipartFile("large.jpg", "image/jpeg", 150L * 1024 * 1024) // 150MB

        // When & Then
        val exception = assertThrows<InvalidRequestException> {
            mediaService.uploadFile(file, userId)
        }

        assertEquals("INVALID_REQUEST", exception.code)
        assertTrue(exception.message.contains("100MB"))

        verify(exactly = 0) { userRepository.findById(any()) }
    }

    @Test
    fun `uploadFile should upload video file to videos folder`() {
        // Given
        val userId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.ADMIN)
        val file = mockMultipartFile("test.mp4", "video/mp4", 5 * 1024 * 1024)
        val storedPath = "videos/uuid.mp4"
        val presignedUrl = "http://minio/videos/uuid.mp4?signed=true"

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { storageService.uploadFile(file, "videos") } returns storedPath
        every { storageService.getPresignedUrl(storedPath) } returns presignedUrl
        every { mediaRepository.save(any<Media>()) } answers { firstArg() }

        // When
        val result = mediaService.uploadFile(file, userId)

        // Then
        assertEquals(MediaType.VIDEO, result.type)
        verify(exactly = 1) { storageService.uploadFile(file, "videos") }
    }

    // ========== BULK UPLOAD TESTS ==========

    @Test
    fun `uploadFiles should handle mixed success and failure`() {
        // Given
        val userId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.ADMIN)
        val file1 = mockMultipartFile("test1.jpg", "image/jpeg", 1024)
        val file2 = mockMultipartFile("test2.exe", "application/x-executable", 1024) // Invalid
        val files = listOf(file1, file2)

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { storageService.uploadFile(file1, "photos") } returns "photos/uuid1.jpg"
        every { storageService.getPresignedUrl(any()) } returns "http://minio/signed"
        every { mediaRepository.save(any<Media>()) } answers { firstArg() }

        // When
        val result = mediaService.uploadFiles(files, userId)

        // Then
        assertEquals(1, result.uploaded.size)
        assertEquals(1, result.failed.size)
        assertEquals("test1.jpg", result.uploaded[0].originalName)
        assertEquals("test2.exe", result.failed[0].fileName)
    }

    // ========== GET MEDIA TESTS ==========

    @Test
    fun `getMedia should return media response`() {
        // Given
        val mediaId = UUID.randomUUID()
        val userId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.ADMIN)
        val media = createTestMedia(mediaId, user)
        val presignedUrl = "http://minio/photos/test.jpg?signed=true"

        every { mediaRepository.findById(mediaId) } returns Optional.of(media)
        every { storageService.getPresignedUrl(media.storedPath) } returns presignedUrl

        // When
        val result = mediaService.getMedia(mediaId)

        // Then
        assertNotNull(result)
        assertEquals(mediaId, result.id)
        assertEquals(presignedUrl, result.url)
        assertEquals("test.jpg", result.originalName)

        verify(exactly = 1) { mediaRepository.findById(mediaId) }
    }

    @Test
    fun `getMedia should throw NotFoundException when media not found`() {
        // Given
        val mediaId = UUID.randomUUID()

        every { mediaRepository.findById(mediaId) } returns Optional.empty()

        // When & Then
        assertThrows<NotFoundException> {
            mediaService.getMedia(mediaId)
        }

        verify(exactly = 1) { mediaRepository.findById(mediaId) }
    }

    // ========== GET MEDIA LIST TESTS ==========

    @Test
    fun `getMediaList should return paginated results`() {
        // Given
        val userId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.ADMIN)
        val media1 = createTestMedia(UUID.randomUUID(), user)
        val media2 = createTestMedia(UUID.randomUUID(), user, "test2.jpg")
        val mediaList = listOf(media1, media2)
        val page = PageImpl(mediaList, PageRequest.of(0, 20), 2)

        val filter = MediaFilterRequest(page = 0, size = 20)

        every { mediaRepository.findAllWithFilters(null, null, null, any()) } returns page
        every { storageService.getPresignedUrl(any()) } returns "http://minio/signed"

        // When
        val result = mediaService.getMediaList(filter)

        // Then
        assertEquals(2, result.content.size)
        assertEquals(0, result.page)
        assertEquals(20, result.size)
        assertEquals(2, result.totalElements)
        assertEquals(1, result.totalPages)
        assertFalse(result.hasNext)
        assertFalse(result.hasPrevious)

        verify(exactly = 1) { mediaRepository.findAllWithFilters(null, null, null, any()) }
    }

    @Test
    fun `getMediaList should filter by type`() {
        // Given
        val filter = MediaFilterRequest(type = MediaType.PHOTO, page = 0, size = 20)
        val page = PageImpl(emptyList<Media>(), PageRequest.of(0, 20), 0)

        every { mediaRepository.findAllWithFilters(MediaType.PHOTO, null, null, any()) } returns page

        // When
        val result = mediaService.getMediaList(filter)

        // Then
        assertEquals(0, result.content.size)

        verify(exactly = 1) { mediaRepository.findAllWithFilters(MediaType.PHOTO, null, null, any()) }
    }

    // ========== DELETE MEDIA TESTS ==========

    @Test
    fun `deleteMedia should delete media when called by uploader`() {
        // Given
        val mediaId = UUID.randomUUID()
        val userId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.VIEWER)
        val media = createTestMedia(mediaId, user)

        every { mediaRepository.findById(mediaId) } returns Optional.of(media)
        every { userRepository.findById(userId) } returns Optional.of(user)
        every { storageService.deleteFile(media.storedPath) } just Runs
        every { mediaRepository.delete(media) } just Runs

        // When
        mediaService.deleteMedia(mediaId, userId)

        // Then
        verify(exactly = 1) { storageService.deleteFile(media.storedPath) }
        verify(exactly = 1) { mediaRepository.delete(media) }
    }

    @Test
    fun `deleteMedia should delete media when called by admin`() {
        // Given
        val mediaId = UUID.randomUUID()
        val uploaderId = UUID.randomUUID()
        val adminId = UUID.randomUUID()
        val uploader = createTestUser(uploaderId, UserRole.VIEWER)
        val admin = createTestUser(adminId, UserRole.ADMIN)
        val media = createTestMedia(mediaId, uploader)

        every { mediaRepository.findById(mediaId) } returns Optional.of(media)
        every { userRepository.findById(adminId) } returns Optional.of(admin)
        every { storageService.deleteFile(media.storedPath) } just Runs
        every { mediaRepository.delete(media) } just Runs

        // When
        mediaService.deleteMedia(mediaId, adminId)

        // Then
        verify(exactly = 1) { storageService.deleteFile(media.storedPath) }
        verify(exactly = 1) { mediaRepository.delete(media) }
    }

    @Test
    fun `deleteMedia should throw ForbiddenException when called by non-uploader viewer`() {
        // Given
        val mediaId = UUID.randomUUID()
        val uploaderId = UUID.randomUUID()
        val viewerId = UUID.randomUUID()
        val uploader = createTestUser(uploaderId, UserRole.ADMIN)
        val viewer = createTestUser(viewerId, UserRole.VIEWER)
        val media = createTestMedia(mediaId, uploader)

        every { mediaRepository.findById(mediaId) } returns Optional.of(media)
        every { userRepository.findById(viewerId) } returns Optional.of(viewer)

        // When & Then
        val exception = assertThrows<ForbiddenException> {
            mediaService.deleteMedia(mediaId, viewerId)
        }

        assertEquals("FORBIDDEN", exception.code)
        assertTrue(exception.message.contains("삭제 권한"))

        verify(exactly = 0) { storageService.deleteFile(any()) }
        verify(exactly = 0) { mediaRepository.delete(any()) }
    }

    @Test
    fun `deleteMedia should throw NotFoundException when media not found`() {
        // Given
        val mediaId = UUID.randomUUID()
        val userId = UUID.randomUUID()

        every { mediaRepository.findById(mediaId) } returns Optional.empty()

        // When & Then
        assertThrows<NotFoundException> {
            mediaService.deleteMedia(mediaId, userId)
        }

        verify(exactly = 0) { userRepository.findById(any()) }
    }

    // ========== DOWNLOAD URL TESTS ==========

    @Test
    fun `getDownloadUrl should return presigned url`() {
        // Given
        val mediaId = UUID.randomUUID()
        val userId = UUID.randomUUID()
        val user = createTestUser(userId, UserRole.ADMIN)
        val media = createTestMedia(mediaId, user)
        val presignedUrl = "http://minio/photos/test.jpg?signed=true&expires=3600"

        every { mediaRepository.findById(mediaId) } returns Optional.of(media)
        every { storageService.getPresignedUrl(media.storedPath, 120) } returns presignedUrl

        // When
        val result = mediaService.getDownloadUrl(mediaId, 120)

        // Then
        assertEquals(presignedUrl, result)

        verify(exactly = 1) { storageService.getPresignedUrl(media.storedPath, 120) }
    }

    // ========== HELPER FUNCTIONS ==========

    private fun createTestUser(id: UUID, role: UserRole): User {
        return User(
            email = "test@example.com",
            password = "encodedPassword",
            name = "Test User",
            role = role
        ).apply {
            setIdForTest(id)
        }
    }

    private fun createTestMedia(id: UUID, uploader: User, originalName: String = "test.jpg"): Media {
        return Media(
            uploader = uploader,
            type = MediaType.PHOTO,
            originalName = originalName,
            storedPath = "photos/$originalName",
            size = 1024L,
            mimeType = "image/jpeg"
        ).apply {
            setIdForTest(id)
        }
    }

    private fun mockMultipartFile(
        filename: String,
        contentType: String,
        size: Long
    ): MultipartFile {
        val file = mockk<MultipartFile>()
        every { file.originalFilename } returns filename
        every { file.contentType } returns contentType
        every { file.size } returns size
        every { file.isEmpty } returns (size == 0L)
        every { file.inputStream } returns byteArrayOf().inputStream()
        return file
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
}
