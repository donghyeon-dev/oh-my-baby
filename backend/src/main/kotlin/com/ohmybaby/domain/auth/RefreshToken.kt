package com.ohmybaby.domain.auth

import com.ohmybaby.common.entity.PrimaryKeyEntity
import com.ohmybaby.domain.user.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "refresh_tokens")
class RefreshToken(
    user: User,
    token: String,
    expiresAt: LocalDateTime
) : PrimaryKeyEntity() {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User = user
        protected set

    @Column(nullable = false, unique = true, length = 512)
    var token: String = token
        protected set

    @Column(name = "expires_at", nullable = false)
    var expiresAt: LocalDateTime = expiresAt
        protected set

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()

    fun isExpired(): Boolean = LocalDateTime.now().isAfter(expiresAt)

    override fun toString(): String {
        return "RefreshToken(id=${getId()}, expiresAt=$expiresAt)"
    }
}
