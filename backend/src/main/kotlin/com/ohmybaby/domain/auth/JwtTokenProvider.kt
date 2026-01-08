package com.ohmybaby.domain.auth

import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets
import java.util.*
import javax.crypto.SecretKey

@Component
class JwtTokenProvider(
    @Value("\${jwt.secret}")
    private val secret: String,
    
    @Value("\${jwt.access-expiration}")
    private val accessExpiration: Long,
    
    @Value("\${jwt.refresh-expiration}")
    private val refreshExpiration: Long
) {
    private val key: SecretKey by lazy {
        Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))
    }

    fun createAccessToken(userId: UUID, email: String, role: String): String {
        return createToken(userId, email, role, accessExpiration)
    }

    fun createRefreshToken(userId: UUID, email: String, role: String): String {
        return createToken(userId, email, role, refreshExpiration)
    }

    private fun createToken(userId: UUID, email: String, role: String, expiration: Long): String {
        val now = Date()
        val expiryDate = Date(now.time + expiration)

        return Jwts.builder()
            .subject(userId.toString())
            .claim("email", email)
            .claim("role", role)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(key)
            .compact()
    }

    fun validateToken(token: String): Boolean {
        return try {
            val claims = getClaims(token)
            !claims.expiration.before(Date())
        } catch (e: ExpiredJwtException) {
            false
        } catch (e: Exception) {
            false
        }
    }

    fun getUserIdFromToken(token: String): UUID {
        return UUID.fromString(getClaims(token).subject)
    }

    fun getEmailFromToken(token: String): String {
        return getClaims(token)["email"] as String
    }

    fun getRoleFromToken(token: String): String {
        return getClaims(token)["role"] as String
    }

    fun getRefreshTokenExpiration(): Long = refreshExpiration

    private fun getClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}
