package com.ohmybaby.domain.media

import com.drew.imaging.ImageMetadataReader
import com.drew.metadata.exif.ExifSubIFDDirectory
import com.ohmybaby.common.exception.FileUploadException
import com.ohmybaby.common.exception.ForbiddenException
import com.ohmybaby.common.exception.InvalidRequestException
import com.ohmybaby.common.exception.NotFoundException
import com.ohmybaby.domain.media.dto.*
import com.ohmybaby.domain.user.User
import com.ohmybaby.domain.user.UserRepository
import com.ohmybaby.domain.user.UserRole
import com.ohmybaby.infra.storage.MinioStorageService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.awt.image.BufferedImage
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.*
import javax.imageio.ImageIO

@Service
@Transactional
class MediaService(
    private val mediaRepository: MediaRepository,
    private val userRepository: UserRepository,
    private val storageService: MinioStorageService,
    private val likeRepository: com.ohmybaby.domain.like.LikeRepository,
    private val notificationService: com.ohmybaby.domain.notification.NotificationService
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    companion object {
        private val ALLOWED_IMAGE_TYPES = setOf(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"
        )
        private val ALLOWED_VIDEO_TYPES = setOf(
            "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/3gpp"
        )
        private const val MAX_VIDEO_DURATION_SECONDS = 60
        private const val MAX_FILE_SIZE_BYTES = 100L * 1024 * 1024 // 100MB
    }

    fun uploadFile(file: MultipartFile, uploaderId: UUID): MediaUploadResponse {
        validateFile(file)

        val uploader = userRepository.findById(uploaderId)
            .orElseThrow { NotFoundException("User", uploaderId) }

        validateUploaderRole(uploader)

        val mediaType = determineMediaType(file.contentType ?: "")
        val folder = if (mediaType == MediaType.PHOTO) "photos" else "videos"

        // Upload to MinIO
        val storedPath = storageService.uploadFile(file, folder)

        // Extract metadata
        val metadata = extractMetadata(file, mediaType)

        // Create media entity
        val media = Media(
            uploader = uploader,
            type = mediaType,
            originalName = file.originalFilename ?: "unknown",
            storedPath = storedPath,
            size = file.size,
            mimeType = file.contentType ?: "application/octet-stream",
            width = metadata.width,
            height = metadata.height,
            duration = metadata.duration,
            takenAt = metadata.takenAt
        )

        val savedMedia = mediaRepository.save(media)
        val url = storageService.getPresignedUrl(storedPath)

        logger.info("Media uploaded successfully: id=${savedMedia.getId()}, type=$mediaType, size=${file.size}")

        // Create notifications for all other users
        notificationService.notifyNewMedia(savedMedia, uploader.name)

        return MediaUploadResponse.from(savedMedia, url)
    }

    fun uploadFiles(files: List<MultipartFile>, uploaderId: UUID): BulkUploadResponse {
        val uploaded = mutableListOf<MediaUploadResponse>()
        val failed = mutableListOf<FailedUpload>()

        for (file in files) {
            try {
                val response = uploadFile(file, uploaderId)
                uploaded.add(response)
            } catch (e: Exception) {
                logger.error("Failed to upload file: ${file.originalFilename}", e)
                failed.add(FailedUpload(
                    fileName = file.originalFilename ?: "unknown",
                    error = e.message ?: "Upload failed"
                ))
            }
        }

        return BulkUploadResponse(uploaded, failed)
    }

    @Transactional(readOnly = true)
    fun getMedia(id: UUID, userId: UUID? = null): MediaResponse {
        val media = mediaRepository.findById(id)
            .orElseThrow { NotFoundException("Media", id) }

        val url = storageService.getPresignedUrl(media.storedPath)
        val likeCount = likeRepository.countByMediaId(id)
        val isLiked = userId?.let { likeRepository.existsByUserIdAndMediaId(it, id) } ?: false

        return MediaResponse.from(media, url, likeCount = likeCount, isLiked = isLiked)
    }

    @Transactional(readOnly = true)
    fun getMediaList(filter: MediaFilterRequest, userId: UUID? = null): MediaListResponse {
        val pageable = PageRequest.of(filter.page, filter.size)
        val spec = MediaSpecifications.withFilters(
            type = filter.type,
            startDate = filter.startDate,
            endDate = filter.endDate
        )
        val page = mediaRepository.findAll(spec, pageable)

        val content = page.content.map { media ->
            val url = storageService.getPresignedUrl(media.storedPath)
            val likeCount = likeRepository.countByMediaId(media.getId())
            val isLiked = userId?.let { likeRepository.existsByUserIdAndMediaId(it, media.getId()) } ?: false
            MediaResponse.from(media, url, likeCount = likeCount, isLiked = isLiked)
        }

        return MediaListResponse(
            content = content,
            page = page.number,
            size = page.size,
            totalElements = page.totalElements,
            totalPages = page.totalPages,
            hasNext = page.hasNext(),
            hasPrevious = page.hasPrevious()
        )
    }

    @Transactional(readOnly = true)
    fun getDistinctDates(): List<java.sql.Date> {
        return mediaRepository.findDistinctDates()
    }

    fun deleteMedia(id: UUID, userId: UUID) {
        val media = mediaRepository.findById(id)
            .orElseThrow { NotFoundException("Media", id) }

        val user = userRepository.findById(userId)
            .orElseThrow { NotFoundException("User", userId) }

        // Only uploader or parent can delete
        if (media.uploader.getId() != userId && user.role != UserRole.PARENT) {
            throw ForbiddenException("삭제 권한이 없습니다")
        }

        // Delete from storage
        storageService.deleteFile(media.storedPath)

        // Delete from database
        mediaRepository.delete(media)

        logger.info("Media deleted: id=$id by user=$userId")
    }

    @Transactional(readOnly = true)
    fun getDownloadUrl(id: UUID, expiryMinutes: Int = 60): String {
        val media = mediaRepository.findById(id)
            .orElseThrow { NotFoundException("Media", id) }

        return storageService.getPresignedUrl(media.storedPath, expiryMinutes)
    }

    private fun validateFile(file: MultipartFile) {
        if (file.isEmpty) {
            throw InvalidRequestException("파일이 비어있습니다")
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw InvalidRequestException("파일 크기는 100MB를 초과할 수 없습니다")
        }

        val contentType = file.contentType ?: throw InvalidRequestException("파일 형식을 확인할 수 없습니다")

        if (!ALLOWED_IMAGE_TYPES.contains(contentType) && !ALLOWED_VIDEO_TYPES.contains(contentType)) {
            throw InvalidRequestException("지원하지 않는 파일 형식입니다: $contentType")
        }
    }

    private fun validateUploaderRole(user: User) {
        if (user.role != UserRole.PARENT) {
            throw ForbiddenException("업로드 권한이 없습니다. 부모님만 업로드할 수 있습니다.")
        }
    }

    private fun determineMediaType(contentType: String): MediaType {
        return when {
            ALLOWED_IMAGE_TYPES.contains(contentType) -> MediaType.PHOTO
            ALLOWED_VIDEO_TYPES.contains(contentType) -> MediaType.VIDEO
            else -> throw InvalidRequestException("지원하지 않는 파일 형식입니다: $contentType")
        }
    }

    private fun extractMetadata(file: MultipartFile, mediaType: MediaType): MediaMetadata {
        return try {
            when (mediaType) {
                MediaType.PHOTO -> extractImageMetadata(file)
                MediaType.VIDEO -> extractVideoMetadata(file)
            }
        } catch (e: Exception) {
            logger.warn("Failed to extract metadata from file: ${file.originalFilename}", e)
            MediaMetadata()
        }
    }

    private fun extractImageMetadata(file: MultipartFile): MediaMetadata {
        var width: Int? = null
        var height: Int? = null
        var takenAt: LocalDateTime? = null

        try {
            // Extract EXIF data
            val metadata = ImageMetadataReader.readMetadata(file.inputStream)
            val exifDirectory = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory::class.java)

            exifDirectory?.let { dir ->
                val date = dir.getDate(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL)
                takenAt = date?.toInstant()?.atZone(ZoneId.systemDefault())?.toLocalDateTime()
            }

            // Extract dimensions
            file.inputStream.use { inputStream ->
                val image: BufferedImage? = ImageIO.read(inputStream)
                image?.let {
                    width = it.width
                    height = it.height
                }
            }
        } catch (e: Exception) {
            logger.warn("Failed to extract image metadata", e)
        }

        return MediaMetadata(width = width, height = height, takenAt = takenAt)
    }

    private fun extractVideoMetadata(file: MultipartFile): MediaMetadata {
        // Video metadata extraction is complex and requires additional libraries
        // For MVP, we'll skip detailed video metadata extraction
        // Consider using FFmpeg or similar for production
        return MediaMetadata()
    }

    private data class MediaMetadata(
        val width: Int? = null,
        val height: Int? = null,
        val duration: Int? = null,
        val takenAt: LocalDateTime? = null
    )
}
