package com.ohmybaby.domain.user

import com.ohmybaby.common.entity.PrimaryKeyEntity
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
class User(
    email: String,
    password: String,
    name: String,
    role: UserRole = UserRole.VIEWER
) : PrimaryKeyEntity() {

    @Column(unique = true, nullable = false)
    var email: String = email
        protected set

    @Column(nullable = false)
    var password: String = password
        protected set

    @Column(nullable = false)
    var name: String = name
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var role: UserRole = role
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

    fun updatePassword(newPassword: String) {
        this.password = newPassword
    }

    fun updateName(newName: String) {
        this.name = newName
    }

    fun updateRole(newRole: UserRole) {
        this.role = newRole
    }

    override fun toString(): String {
        return "User(id=${getId()}, email='$email', name='$name', role=$role)"
    }
}

enum class UserRole {
    ADMIN,   // Can upload, delete, manage users
    VIEWER   // Can view, download, like
}
