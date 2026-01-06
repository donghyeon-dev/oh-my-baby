package com.ohmybaby.domain.media

import com.ohmybaby.domain.user.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "media")
data class Media(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    val uploader: User,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val type: MediaType,

    @Column(name = "original_name", nullable = false)
    val originalName: String,

    @Column(name = "stored_path", nullable = false)
    val storedPath: String,

    @Column(nullable = false)
    val size: Long,

    @Column(name = "mime_type", nullable = false)
    val mimeType: String,

    val width: Int? = null,
    val height: Int? = null,
    val duration: Int? = null,  // Video duration in seconds

    @Column(name = "taken_at")
    val takenAt: LocalDateTime? = null,  // From EXIF data

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

enum class MediaType {
    PHOTO,
    VIDEO
}
