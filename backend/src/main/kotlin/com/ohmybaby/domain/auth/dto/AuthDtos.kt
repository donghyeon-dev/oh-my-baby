package com.ohmybaby.domain.auth.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.util.UUID

data class LoginRequest(
    @field:NotBlank(message = "이메일은 필수입니다")
    @field:Email(message = "올바른 이메일 형식이 아닙니다")
    val email: String,

    @field:NotBlank(message = "비밀번호는 필수입니다")
    val password: String
)

data class RegisterRequest(
    @field:NotBlank(message = "이메일은 필수입니다")
    @field:Email(message = "올바른 이메일 형식이 아닙니다")
    val email: String,

    @field:NotBlank(message = "비밀번호는 필수입니다")
    @field:Size(min = 8, max = 100, message = "비밀번호는 8자 이상 100자 이하여야 합니다")
    val password: String,

    @field:NotBlank(message = "이름은 필수입니다")
    @field:Size(min = 2, max = 50, message = "이름은 2자 이상 50자 이하여야 합니다")
    val name: String
)

data class TokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: UserResponse
)

data class UserResponse(
    val id: UUID,
    val email: String,
    val name: String,
    val role: String,
    val createdAt: String,
    val lastLoginAt: String?
) {
    companion object {
        fun from(user: com.ohmybaby.domain.user.User): UserResponse {
            return UserResponse(
                id = user.getId(),
                email = user.email,
                name = user.name,
                role = user.role.name,
                createdAt = user.createdAt.toString(),
                lastLoginAt = user.lastLoginAt?.toString()
            )
        }
    }
}

data class RefreshTokenRequest(
    val refreshToken: String? = null  // Can also be sent via cookie
)
