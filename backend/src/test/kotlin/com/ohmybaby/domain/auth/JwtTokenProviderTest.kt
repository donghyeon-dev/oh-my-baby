package com.ohmybaby.domain.auth

import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.nio.charset.StandardCharsets
import java.util.*

class JwtTokenProviderTest {

    private lateinit var jwtTokenProvider: JwtTokenProvider
    private val secret = "test-secret-key-that-is-long-enough-for-hmac-sha-256-algorithm-minimum-32-bytes"
    private val accessExpiration = 3600000L // 1 hour
    private val refreshExpiration = 604800000L // 7 days

    @BeforeEach
    fun setUp() {
        jwtTokenProvider = JwtTokenProvider(
            secret = secret,
            accessExpiration = accessExpiration,
            refreshExpiration = refreshExpiration
        )
    }

    // ========== CREATE ACCESS TOKEN TESTS ==========

    @Test
    fun `createAccessToken should generate valid JWT token`() {
        // Given
        val userId = UUID.randomUUID()
        val email = "test@example.com"
        val role = "FAMILY"

        // When
        val token = jwtTokenProvider.createAccessToken(userId, email, role)

        // Then
        assertNotNull(token)
        assertTrue(token.isNotBlank())
        assertTrue(token.split(".").size == 3) // JWT has 3 parts: header.payload.signature

        // Verify token can be parsed
        val key = Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))
        val claims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload

        assertEquals(userId.toString(), claims.subject)
        assertEquals(email, claims["email"])
        assertEquals(role, claims["role"])
        assertNotNull(claims.issuedAt)
        assertNotNull(claims.expiration)
    }

    @Test
    fun `createAccessToken should set correct expiration time`() {
        // Given
        val userId = UUID.randomUUID()
        val email = "test@example.com"
        val role = "PARENT"
        val beforeCreation = System.currentTimeMillis()

        // When
        val token = jwtTokenProvider.createAccessToken(userId, email, role)
        val afterCreation = System.currentTimeMillis()

        // Then
        val key = Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))
        val claims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload

        val expirationTime = claims.expiration.time
        val tolerance = 1000L // 1 second tolerance for test execution time
        assertTrue(expirationTime >= beforeCreation + accessExpiration - tolerance)
        assertTrue(expirationTime <= afterCreation + accessExpiration + tolerance)
    }

    // ========== CREATE REFRESH TOKEN TESTS ==========

    @Test
    fun `createRefreshToken should generate valid JWT token`() {
        // Given
        val userId = UUID.randomUUID()
        val email = "test@example.com"
        val role = "FAMILY"

        // When
        val token = jwtTokenProvider.createRefreshToken(userId, email, role)

        // Then
        assertNotNull(token)
        assertTrue(token.isNotBlank())
        assertTrue(token.split(".").size == 3)

        val key = Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))
        val claims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload

        assertEquals(userId.toString(), claims.subject)
        assertEquals(email, claims["email"])
        assertEquals(role, claims["role"])
    }

    @Test
    fun `createRefreshToken should set longer expiration than access token`() {
        // Given
        val userId = UUID.randomUUID()
        val email = "test@example.com"
        val role = "FAMILY"

        // When
        val accessToken = jwtTokenProvider.createAccessToken(userId, email, role)
        val refreshToken = jwtTokenProvider.createRefreshToken(userId, email, role)

        // Then
        val key = Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))

        val accessClaims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(accessToken)
            .payload

        val refreshClaims = Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(refreshToken)
            .payload

        assertTrue(refreshClaims.expiration.after(accessClaims.expiration))
    }

    // ========== VALIDATE TOKEN TESTS ==========

    @Test
    fun `validateToken should return true for valid token`() {
        // Given
        val userId = UUID.randomUUID()
        val email = "test@example.com"
        val role = "FAMILY"
        val token = jwtTokenProvider.createAccessToken(userId, email, role)

        // When
        val isValid = jwtTokenProvider.validateToken(token)

        // Then
        assertTrue(isValid)
    }

    @Test
    fun `validateToken should return false for expired token`() {
        // Given - Create a token provider with very short expiration
        val shortExpirationProvider = JwtTokenProvider(
            secret = secret,
            accessExpiration = 1L, // 1 millisecond
            refreshExpiration = 1L
        )

        val userId = UUID.randomUUID()
        val email = "test@example.com"
        val role = "FAMILY"
        val token = shortExpirationProvider.createAccessToken(userId, email, role)

        // Wait for token to expire
        Thread.sleep(10)

        // When
        val isValid = jwtTokenProvider.validateToken(token)

        // Then
        assertFalse(isValid)
    }

    @Test
    fun `validateToken should return false for malformed token`() {
        // Given
        val malformedToken = "not.a.valid.jwt.token"

        // When
        val isValid = jwtTokenProvider.validateToken(malformedToken)

        // Then
        assertFalse(isValid)
    }

    @Test
    fun `validateToken should return false for token with wrong signature`() {
        // Given
        val differentSecret = "different-secret-key-that-is-long-enough-for-hmac-sha-256-algorithm-minimum"
        val differentProvider = JwtTokenProvider(
            secret = differentSecret,
            accessExpiration = accessExpiration,
            refreshExpiration = refreshExpiration
        )

        val userId = UUID.randomUUID()
        val email = "test@example.com"
        val role = "FAMILY"
        val token = differentProvider.createAccessToken(userId, email, role)

        // When - Validate with original provider (different secret)
        val isValid = jwtTokenProvider.validateToken(token)

        // Then
        assertFalse(isValid)
    }

    @Test
    fun `validateToken should return false for empty token`() {
        // Given
        val emptyToken = ""

        // When
        val isValid = jwtTokenProvider.validateToken(emptyToken)

        // Then
        assertFalse(isValid)
    }

    // ========== GET USER ID FROM TOKEN TESTS ==========

    @Test
    fun `getUserIdFromToken should extract correct user ID`() {
        // Given
        val userId = UUID.randomUUID()
        val email = "test@example.com"
        val role = "FAMILY"
        val token = jwtTokenProvider.createAccessToken(userId, email, role)

        // When
        val extractedUserId = jwtTokenProvider.getUserIdFromToken(token)

        // Then
        assertEquals(userId, extractedUserId)
    }

    @Test
    fun `getUserIdFromToken should throw exception for invalid token`() {
        // Given
        val invalidToken = "invalid.token"

        // When & Then
        assertThrows<Exception> {
            jwtTokenProvider.getUserIdFromToken(invalidToken)
        }
    }

    // ========== GET EMAIL FROM TOKEN TESTS ==========

    @Test
    fun `getEmailFromToken should extract correct email`() {
        // Given
        val userId = UUID.randomUUID()
        val email = "test@example.com"
        val role = "PARENT"
        val token = jwtTokenProvider.createAccessToken(userId, email, role)

        // When
        val extractedEmail = jwtTokenProvider.getEmailFromToken(token)

        // Then
        assertEquals(email, extractedEmail)
    }

    @Test
    fun `getEmailFromToken should throw exception for invalid token`() {
        // Given
        val invalidToken = "invalid.token"

        // When & Then
        assertThrows<Exception> {
            jwtTokenProvider.getEmailFromToken(invalidToken)
        }
    }

    // ========== GET ROLE FROM TOKEN TESTS ==========

    @Test
    fun `getRoleFromToken should extract correct role`() {
        // Given
        val userId = UUID.randomUUID()
        val email = "test@example.com"
        val role = "PARENT"
        val token = jwtTokenProvider.createAccessToken(userId, email, role)

        // When
        val extractedRole = jwtTokenProvider.getRoleFromToken(token)

        // Then
        assertEquals(role, extractedRole)
    }

    @Test
    fun `getRoleFromToken should throw exception for invalid token`() {
        // Given
        val invalidToken = "invalid.token"

        // When & Then
        assertThrows<Exception> {
            jwtTokenProvider.getRoleFromToken(invalidToken)
        }
    }

    // ========== GET REFRESH TOKEN EXPIRATION TESTS ==========

    @Test
    fun `getRefreshTokenExpiration should return correct value`() {
        // When
        val expiration = jwtTokenProvider.getRefreshTokenExpiration()

        // Then
        assertEquals(refreshExpiration, expiration)
    }

    // ========== COMPREHENSIVE TOKEN LIFECYCLE TEST ==========

    @Test
    fun `token lifecycle - create, validate, and extract claims`() {
        // Given
        val userId = UUID.randomUUID()
        val email = "lifecycle@example.com"
        val role = "FAMILY"

        // When - Create access token
        val accessToken = jwtTokenProvider.createAccessToken(userId, email, role)

        // Then - Validate token
        assertTrue(jwtTokenProvider.validateToken(accessToken))

        // And - Extract all claims
        assertEquals(userId, jwtTokenProvider.getUserIdFromToken(accessToken))
        assertEquals(email, jwtTokenProvider.getEmailFromToken(accessToken))
        assertEquals(role, jwtTokenProvider.getRoleFromToken(accessToken))

        // When - Create refresh token
        val refreshToken = jwtTokenProvider.createRefreshToken(userId, email, role)

        // Then - Validate refresh token
        assertTrue(jwtTokenProvider.validateToken(refreshToken))

        // And - Extract claims from refresh token
        assertEquals(userId, jwtTokenProvider.getUserIdFromToken(refreshToken))
        assertEquals(email, jwtTokenProvider.getEmailFromToken(refreshToken))
        assertEquals(role, jwtTokenProvider.getRoleFromToken(refreshToken))
    }

    @Test
    fun `tokens with different user data should have different signatures`() {
        // Given
        val userId1 = UUID.randomUUID()
        val userId2 = UUID.randomUUID()
        val email = "test@example.com"
        val role = "FAMILY"

        // When
        val token1 = jwtTokenProvider.createAccessToken(userId1, email, role)
        val token2 = jwtTokenProvider.createAccessToken(userId2, email, role)

        // Then
        assertNotEquals(token1, token2)
    }

    @Test
    fun `tokens created at different times should have different timestamps`() {
        // Given
        val userId = UUID.randomUUID()
        val email = "test@example.com"
        val role = "FAMILY"

        // When
        val token1 = jwtTokenProvider.createAccessToken(userId, email, role)
        Thread.sleep(1000) // Ensure different timestamp (1 second to guarantee difference)
        val token2 = jwtTokenProvider.createAccessToken(userId, email, role)

        // Then - Tokens should be different due to different issuedAt timestamps
        assertNotEquals(token1, token2)

        // Verify both tokens are valid
        assertTrue(jwtTokenProvider.validateToken(token1))
        assertTrue(jwtTokenProvider.validateToken(token2))
    }
}
