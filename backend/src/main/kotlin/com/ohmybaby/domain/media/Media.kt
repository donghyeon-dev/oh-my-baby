package com.ohmybaby.domain.media

import com.ohmybaby.common.entity.PrimaryKeyEntity
import com.ohmybaby.domain.user.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "media")
class Media(
    uploader: User,
    type: MediaType,
    originalName: String,
    storedPath: String,
    size: Long,
    mimeType: String,
    width: Int? = null,
    height: Int? = null,
    duration: Int? = null,
    takenAt: LocalDateTime? = null
) : PrimaryKeyEntity() {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    var uploader: User = uploader
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var type: MediaType = type
        protected set

    @Column(name = "original_name", nullable = false)
    var originalName: String = originalName
        protected set

    @Column(name = "stored_path", nullable = false)
    var storedPath: String = storedPath
        protected set

    @Column(nullable = false)
    var size: Long = size
        protected set

    @Column(name = "mime_type", nullable = false)
    var mimeType: String = mimeType
        protected set

    @Column
    var width: Int? = width
        protected set

    @Column
    var height: Int? = height
        protected set

    @Column
    var duration: Int? = duration
        protected set

    @Column(name = "taken_at")
    var takenAt: LocalDateTime? = takenAt
        protected set

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }

    override fun toString(): String {
        return "Media(id=${getId()}, type=$type, originalName='$originalName')"
    }
}

enum class MediaType {
    PHOTO,
    VIDEO
}
