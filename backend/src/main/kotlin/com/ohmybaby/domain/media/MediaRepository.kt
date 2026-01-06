package com.ohmybaby.domain.media

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface MediaRepository : JpaRepository<Media, Long> {
    
    fun findAllByOrderByTakenAtDescCreatedAtDesc(pageable: Pageable): Page<Media>
    
    @Query("""
        SELECT m FROM Media m 
        WHERE (:type IS NULL OR m.type = :type)
        AND (:startDate IS NULL OR COALESCE(m.takenAt, m.createdAt) >= :startDate)
        AND (:endDate IS NULL OR COALESCE(m.takenAt, m.createdAt) <= :endDate)
        ORDER BY COALESCE(m.takenAt, m.createdAt) DESC
    """)
    fun findAllWithFilters(
        @Param("type") type: MediaType?,
        @Param("startDate") startDate: LocalDateTime?,
        @Param("endDate") endDate: LocalDateTime?,
        pageable: Pageable
    ): Page<Media>
    
    @Query("""
        SELECT DISTINCT CAST(COALESCE(m.takenAt, m.createdAt) AS date) as mediaDate
        FROM Media m
        ORDER BY mediaDate DESC
    """)
    fun findDistinctDates(): List<java.sql.Date>
    
    fun countByUploaderId(uploaderId: Long): Long
}
