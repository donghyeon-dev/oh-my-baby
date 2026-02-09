package com.ohmybaby.domain.auth

import com.ohmybaby.common.exception.DuplicateException
import com.ohmybaby.common.exception.UnauthorizedException
import com.ohmybaby.domain.auth.dto.LoginRequest
import com.ohmybaby.domain.auth.dto.RegisterRequest
import com.ohmybaby.domain.user.User
import com.ohmybaby.domain.user.UserRepository
import com.ohmybaby.domain.user.UserRole
import io.mockk.*
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.security.crypto.password.PasswordEncoder
import java.time.LocalDateTime
import java.util.*

class AuthServiceTest {

    private lateinit var authService: AuthService
    private lateinit var userRepository: UserRepository
    private lateinit var refreshTokenRepository: RefreshTokenRepository
    private lateinit var jwtTokenProvider: JwtTokenProvider
    private lateinit var passwordEncoder: PasswordEncoder

    @BeforeEach
    fun setUp() {
        userRepository = mockk()
        refreshTokenRepository = mockk()
        jwtTokenProvider = mockk()
        passwordEncoder = mockk()

        authService = AuthService(
            userRepository = userRepository,
            refreshTokenRepository = refreshTokenRepository,
            jwtTokenProvider = jwtTokenProvider,
            passwordEncoder = passwordEncoder
        )
    }

    @AfterEach
    fun tearDown() {
        clearAllMocks()
    }

    // ========== REGISTER TESTS ==========

    @Test
    fun `register should create user and return token response on success`() {
        // Given
        val request = RegisterRequest(
            email = "test@example.com",
            password = "password123",
            name = "Test User"
        )
        val encodedPassword = "encodedPassword123"
        val userId = UUID.randomUUID()
        val accessToken = "access.token.here"
        val refreshToken = "refresh.token.here"

        val savedUser = User(
            email = request.email,
            password = encodedPassword,
            name = request.name,
            role = UserRole.VIEWER
        ).apply {
            // Simulate saved entity with ID
            setIdForTest(userId)
        }

        every { userRepository.existsByEmail(request.email) } returns false
        every { userRepository.count() } returns 1L  // Not first user, so VIEWER role
        every { passwordEncoder.encode(request.password) } returns encodedPassword
        every { userRepository.save(any<User>()) } returns savedUser
        every { jwtTokenProvider.createAccessToken(userId, request.email, UserRole.VIEWER.name) } returns accessToken
        every { jwtTokenProvider.createRefreshToken(userId, request.email, UserRole.VIEWER.name) } returns refreshToken
        every { jwtTokenProvider.getRefreshTokenExpiration() } returns 604800000L // 7 days
        every { refreshTokenRepository.save(any<RefreshToken>()) } returns mockk()

        // When
        val result = authService.register(request)

        // Then
        assertNotNull(result)
        assertEquals(accessToken, result.accessToken)
        assertEquals(refreshToken, result.refreshToken)
        assertEquals(request.email, result.user.email)
        assertEquals(request.name, result.user.name)
        assertEquals(UserRole.VIEWER.name, result.user.role)

        verify(exactly = 1) { userRepository.existsByEmail(request.email) }
        verify(exactly = 1) { passwordEncoder.encode(request.password) }
        verify(exactly = 1) { userRepository.save(any<User>()) }
        verify(exactly = 1) { jwtTokenProvider.createAccessToken(any(), any(), any()) }
        verify(exactly = 1) { jwtTokenProvider.createRefreshToken(any(), any(), any()) }
        verify(exactly = 1) { refreshTokenRepository.save(any<RefreshToken>()) }
    }

    @Test
    fun `register should throw DuplicateException when email already exists`() {
        // Given
        val request = RegisterRequest(
            email = "existing@example.com",
            password = "password123",
            name = "Test User"
        )

        every { userRepository.existsByEmail(request.email) } returns true

        // When & Then
        val exception = assertThrows<DuplicateException> {
            authService.register(request)
        }

        assertEquals("DUPLICATE", exception.code)
        assertTrue(exception.message.contains("email"))
        assertTrue(exception.message.contains(request.email))

        verify(exactly = 1) { userRepository.existsByEmail(request.email) }
        verify(exactly = 0) { userRepository.save(any<User>()) }
    }

    // ========== LOGIN TESTS ==========

    @Test
    fun `login should return token response on valid credentials`() {
        // Given
        val request = LoginRequest(
            email = "test@example.com",
            password = "password123"
        )
        val userId = UUID.randomUUID()
        val encodedPassword = "encodedPassword123"
        val accessToken = "access.token.here"
        val refreshToken = "refresh.token.here"

        val user = User(
            email = request.email,
            password = encodedPassword,
            name = "Test User",
            role = UserRole.VIEWER
        ).apply {
            setIdForTest(userId)
        }

        every { userRepository.findByEmail(request.email) } returns Optional.of(user)
        every { passwordEncoder.matches(request.password, encodedPassword) } returns true
        every { jwtTokenProvider.createAccessToken(userId, request.email, UserRole.VIEWER.name) } returns accessToken
        every { jwtTokenProvider.createRefreshToken(userId, request.email, UserRole.VIEWER.name) } returns refreshToken
        every { jwtTokenProvider.getRefreshTokenExpiration() } returns 604800000L
        every { refreshTokenRepository.save(any<RefreshToken>()) } returns mockk()

        // When
        val result = authService.login(request)

        // Then
        assertNotNull(result)
        assertEquals(accessToken, result.accessToken)
        assertEquals(refreshToken, result.refreshToken)
        assertEquals(request.email, result.user.email)

        verify(exactly = 1) { userRepository.findByEmail(request.email) }
        verify(exactly = 1) { passwordEncoder.matches(request.password, encodedPassword) }
        verify(exactly = 1) { jwtTokenProvider.createAccessToken(any(), any(), any()) }
        verify(exactly = 1) { jwtTokenProvider.createRefreshToken(any(), any(), any()) }
    }

    @Test
    fun `login should throw UnauthorizedException when user not found`() {
        // Given
        val request = LoginRequest(
            email = "nonexistent@example.com",
            password = "password123"
        )

        every { userRepository.findByEmail(request.email) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<UnauthorizedException> {
            authService.login(request)
        }

        assertEquals("UNAUTHORIZED", exception.code)
        assertTrue(exception.message.contains("이메일") || exception.message.contains("비밀번호"))

        verify(exactly = 1) { userRepository.findByEmail(request.email) }
        verify(exactly = 0) { passwordEncoder.matches(any(), any()) }
    }

    @Test
    fun `login should throw UnauthorizedException when password is wrong`() {
        // Given
        val request = LoginRequest(
            email = "test@example.com",
            password = "wrongPassword"
        )
        val userId = UUID.randomUUID()
        val encodedPassword = "encodedPassword123"

        val user = User(
            email = request.email,
            password = encodedPassword,
            name = "Test User",
            role = UserRole.VIEWER
        ).apply {
            setIdForTest(userId)
        }

        every { userRepository.findByEmail(request.email) } returns Optional.of(user)
        every { passwordEncoder.matches(request.password, encodedPassword) } returns false

        // When & Then
        val exception = assertThrows<UnauthorizedException> {
            authService.login(request)
        }

        assertEquals("UNAUTHORIZED", exception.code)
        assertTrue(exception.message.contains("이메일") || exception.message.contains("비밀번호"))

        verify(exactly = 1) { userRepository.findByEmail(request.email) }
        verify(exactly = 1) { passwordEncoder.matches(request.password, encodedPassword) }
        verify(exactly = 0) { jwtTokenProvider.createAccessToken(any(), any(), any()) }
    }

    // ========== REFRESH TESTS ==========

    @Test
    fun `refresh should return new tokens on valid refresh token`() {
        // Given
        val oldRefreshToken = "old.refresh.token"
        val newAccessToken = "new.access.token"
        val newRefreshToken = "new.refresh.token"
        val userId = UUID.randomUUID()
        val email = "test@example.com"

        val user = User(
            email = email,
            password = "encodedPassword",
            name = "Test User",
            role = UserRole.VIEWER
        ).apply {
            setIdForTest(userId)
        }

        val storedToken = RefreshToken(
            user = user,
            token = oldRefreshToken,
            expiresAt = LocalDateTime.now().plusDays(7)
        )

        every { jwtTokenProvider.validateToken(oldRefreshToken) } returns true
        every { refreshTokenRepository.findByToken(oldRefreshToken) } returns storedToken
        every { refreshTokenRepository.delete(storedToken) } just Runs
        every { jwtTokenProvider.createAccessToken(userId, email, UserRole.VIEWER.name) } returns newAccessToken
        every { jwtTokenProvider.createRefreshToken(userId, email, UserRole.VIEWER.name) } returns newRefreshToken
        every { jwtTokenProvider.getRefreshTokenExpiration() } returns 604800000L
        every { refreshTokenRepository.save(any<RefreshToken>()) } returns mockk()

        // When
        val result = authService.refresh(oldRefreshToken)

        // Then
        assertNotNull(result)
        assertEquals(newAccessToken, result.accessToken)
        assertEquals(newRefreshToken, result.refreshToken)
        assertEquals(email, result.user.email)

        verify(exactly = 1) { jwtTokenProvider.validateToken(oldRefreshToken) }
        verify(exactly = 1) { refreshTokenRepository.findByToken(oldRefreshToken) }
        verify(exactly = 1) { refreshTokenRepository.delete(storedToken) }
        verify(exactly = 1) { refreshTokenRepository.save(any<RefreshToken>()) }
    }

    @Test
    fun `refresh should throw UnauthorizedException when token is invalid`() {
        // Given
        val invalidToken = "invalid.token"

        every { jwtTokenProvider.validateToken(invalidToken) } returns false

        // When & Then
        val exception = assertThrows<UnauthorizedException> {
            authService.refresh(invalidToken)
        }

        assertEquals("UNAUTHORIZED", exception.code)

        verify(exactly = 1) { jwtTokenProvider.validateToken(invalidToken) }
        verify(exactly = 0) { refreshTokenRepository.findByToken(any()) }
    }

    @Test
    fun `refresh should throw UnauthorizedException when token not found in database`() {
        // Given
        val token = "valid.but.not.stored.token"

        every { jwtTokenProvider.validateToken(token) } returns true
        every { refreshTokenRepository.findByToken(token) } returns null

        // When & Then
        val exception = assertThrows<UnauthorizedException> {
            authService.refresh(token)
        }

        assertEquals("UNAUTHORIZED", exception.code)
        assertTrue(exception.message.contains("리프레시 토큰"))

        verify(exactly = 1) { jwtTokenProvider.validateToken(token) }
        verify(exactly = 1) { refreshTokenRepository.findByToken(token) }
    }

    @Test
    fun `refresh should throw UnauthorizedException when token is expired`() {
        // Given
        val expiredToken = "expired.refresh.token"
        val userId = UUID.randomUUID()

        val user = User(
            email = "test@example.com",
            password = "encodedPassword",
            name = "Test User",
            role = UserRole.VIEWER
        ).apply {
            setIdForTest(userId)
        }

        val storedToken = RefreshToken(
            user = user,
            token = expiredToken,
            expiresAt = LocalDateTime.now().minusDays(1) // Expired
        )

        every { jwtTokenProvider.validateToken(expiredToken) } returns true
        every { refreshTokenRepository.findByToken(expiredToken) } returns storedToken
        every { refreshTokenRepository.delete(storedToken) } just Runs

        // When & Then
        val exception = assertThrows<UnauthorizedException> {
            authService.refresh(expiredToken)
        }

        assertEquals("UNAUTHORIZED", exception.code)
        assertTrue(exception.message.contains("만료"))

        verify(exactly = 1) { jwtTokenProvider.validateToken(expiredToken) }
        verify(exactly = 1) { refreshTokenRepository.findByToken(expiredToken) }
        verify(exactly = 1) { refreshTokenRepository.delete(storedToken) }
    }

    // ========== LOGOUT TESTS ==========

    @Test
    fun `logout should delete all refresh tokens for user`() {
        // Given
        val userId = UUID.randomUUID()

        every { refreshTokenRepository.deleteAllByUserId(userId) } just Runs

        // When
        authService.logout(userId)

        // Then
        verify(exactly = 1) { refreshTokenRepository.deleteAllByUserId(userId) }
    }

    @Test
    fun `logoutWithToken should delete specific refresh token`() {
        // Given
        val refreshToken = "refresh.token.to.delete"

        every { refreshTokenRepository.deleteByToken(refreshToken) } just Runs

        // When
        authService.logoutWithToken(refreshToken)

        // Then
        verify(exactly = 1) { refreshTokenRepository.deleteByToken(refreshToken) }
    }

    @Test
    fun `cleanupExpiredTokens should call repository cleanup method`() {
        // Given
        every { refreshTokenRepository.deleteExpiredTokens(any()) } just Runs

        // When
        authService.cleanupExpiredTokens()

        // Then
        verify(exactly = 1) { refreshTokenRepository.deleteExpiredTokens(any()) }
    }

    // Helper extension function to set ID for testing
    private fun User.setIdForTest(id: UUID) {
        val field = this::class.java.superclass.getDeclaredField("id")
        field.isAccessible = true
        field.set(this, id)
    }
}
