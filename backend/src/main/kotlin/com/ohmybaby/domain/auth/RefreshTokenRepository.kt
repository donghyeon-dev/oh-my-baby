package com.ohmybaby.domain.auth

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface RefreshTokenRepository : JpaRepository<RefreshToken, Long> {
    fun findByToken(token: String): RefreshToken?
    fun findAllByUserId(userId: Long): List<RefreshToken>
    fun deleteByToken(token: String)
    fun deleteAllByUserId(userId: Long)
    
    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :now")
    fun deleteExpiredTokens(now: LocalDateTime = LocalDateTime.now())
}
