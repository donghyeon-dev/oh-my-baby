package com.ohmybaby.domain.auth

import com.ohmybaby.common.exception.DuplicateException
import com.ohmybaby.common.exception.UnauthorizedException
import com.ohmybaby.domain.auth.dto.LoginRequest
import com.ohmybaby.domain.auth.dto.RegisterRequest
import com.ohmybaby.domain.auth.dto.TokenResponse
import com.ohmybaby.domain.auth.dto.UserResponse
import com.ohmybaby.domain.user.User
import com.ohmybaby.domain.user.UserRepository
import com.ohmybaby.domain.user.UserRole
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.UUID

@Service
@Transactional
class AuthService(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val jwtTokenProvider: JwtTokenProvider,
    private val passwordEncoder: PasswordEncoder
) {

    fun register(request: RegisterRequest): TokenResponse {
        // Check if email already exists
        if (userRepository.existsByEmail(request.email)) {
            throw DuplicateException("User", "email", request.email)
        }

        // Create user
        val user = User(
            email = request.email,
            password = passwordEncoder.encode(request.password),
            name = request.name,
            role = UserRole.VIEWER  // Default role
        )
        val savedUser = userRepository.save(user)

        // Generate tokens
        return createTokenResponse(savedUser)
    }

    fun login(request: LoginRequest): TokenResponse {
        // Find user by email
        val user = userRepository.findByEmail(request.email)
            .orElseThrow { UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다") }

        // Verify password
        if (!passwordEncoder.matches(request.password, user.password)) {
            throw UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다")
        }

        // Generate tokens
        return createTokenResponse(user)
    }

    fun refresh(refreshToken: String): TokenResponse {
        // Validate refresh token
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw UnauthorizedException("유효하지 않거나 만료된 토큰입니다")
        }

        // Find refresh token in database
        val storedToken = refreshTokenRepository.findByToken(refreshToken)
            ?: throw UnauthorizedException("유효하지 않은 리프레시 토큰입니다")

        // Check if expired
        if (storedToken.isExpired()) {
            refreshTokenRepository.delete(storedToken)
            throw UnauthorizedException("만료된 리프레시 토큰입니다")
        }

        val user = storedToken.user

        // Delete old refresh token (rotation)
        refreshTokenRepository.delete(storedToken)

        // Generate new tokens
        return createTokenResponse(user)
    }

    fun logout(userId: UUID) {
        // Delete all refresh tokens for user
        refreshTokenRepository.deleteAllByUserId(userId)
    }

    fun logoutWithToken(refreshToken: String) {
        refreshTokenRepository.deleteByToken(refreshToken)
    }

    private fun createTokenResponse(user: User): TokenResponse {
        val accessToken = jwtTokenProvider.createAccessToken(
            userId = user.getId(),
            email = user.email,
            role = user.role.name
        )

        val refreshTokenString = jwtTokenProvider.createRefreshToken(
            userId = user.getId(),
            email = user.email,
            role = user.role.name
        )

        // Save refresh token to database
        val expiresAt = LocalDateTime.now().plusSeconds(
            jwtTokenProvider.getRefreshTokenExpiration() / 1000
        )
        val refreshToken = RefreshToken(
            user = user,
            token = refreshTokenString,
            expiresAt = expiresAt
        )
        refreshTokenRepository.save(refreshToken)

        return TokenResponse(
            accessToken = accessToken,
            refreshToken = refreshTokenString,
            user = UserResponse.from(user)
        )
    }

    @Transactional
    fun cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpiredTokens()
    }
}
