package com.ohmybaby.domain.media.dto

import com.ohmybaby.domain.media.Media
import com.ohmybaby.domain.media.MediaType
import java.time.LocalDateTime
import java.util.UUID

data class MediaResponse(
    val id: UUID,
    val type: MediaType,
    val originalName: String,
    val url: String,
    val thumbnailUrl: String?,
    val size: Long,
    val mimeType: String,
    val width: Int?,
    val height: Int?,
    val duration: Int?,
    val takenAt: LocalDateTime?,
    val createdAt: LocalDateTime,
    val uploaderId: UUID,
    val uploaderName: String
) {
    companion object {
        fun from(media: Media, url: String, thumbnailUrl: String? = null): MediaResponse {
            return MediaResponse(
                id = media.getId(),
                type = media.type,
                originalName = media.originalName,
                url = url,
                thumbnailUrl = thumbnailUrl,
                size = media.size,
                mimeType = media.mimeType,
                width = media.width,
                height = media.height,
                duration = media.duration,
                takenAt = media.takenAt,
                createdAt = media.createdAt,
                uploaderId = media.uploader.getId(),
                uploaderName = media.uploader.name
            )
        }
    }
}

data class MediaUploadResponse(
    val id: UUID,
    val type: MediaType,
    val originalName: String,
    val url: String,
    val size: Long,
    val mimeType: String,
    val width: Int?,
    val height: Int?,
    val duration: Int?,
    val takenAt: LocalDateTime?,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(media: Media, url: String): MediaUploadResponse {
            return MediaUploadResponse(
                id = media.getId(),
                type = media.type,
                originalName = media.originalName,
                url = url,
                size = media.size,
                mimeType = media.mimeType,
                width = media.width,
                height = media.height,
                duration = media.duration,
                takenAt = media.takenAt,
                createdAt = media.createdAt
            )
        }
    }
}

data class MediaListResponse(
    val content: List<MediaResponse>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val hasNext: Boolean,
    val hasPrevious: Boolean
)

data class MediaFilterRequest(
    val type: MediaType? = null,
    val startDate: LocalDateTime? = null,
    val endDate: LocalDateTime? = null,
    val page: Int = 0,
    val size: Int = 20
)

data class BulkUploadResponse(
    val uploaded: List<MediaUploadResponse>,
    val failed: List<FailedUpload>
)

data class FailedUpload(
    val fileName: String,
    val error: String
)
