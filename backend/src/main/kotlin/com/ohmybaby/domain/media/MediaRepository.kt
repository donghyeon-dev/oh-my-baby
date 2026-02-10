package com.ohmybaby.domain.media

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.domain.Specification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.UUID

@Repository
interface MediaRepository : JpaRepository<Media, UUID>, JpaSpecificationExecutor<Media> {

    fun findAllByOrderByTakenAtDescCreatedAtDesc(pageable: Pageable): Page<Media>

    @Query("""
        SELECT DISTINCT CAST(COALESCE(m.takenAt, m.createdAt) AS date) as mediaDate
        FROM Media m
        ORDER BY mediaDate DESC
    """)
    fun findDistinctDates(): List<java.sql.Date>

    fun countByUploaderId(uploaderId: UUID): Long
}

object MediaSpecifications {

    fun withFilters(
        type: MediaType?,
        startDate: LocalDateTime?,
        endDate: LocalDateTime?
    ): Specification<Media> {
        return Specification { root, query, cb ->
            val predicates = mutableListOf<jakarta.persistence.criteria.Predicate>()

            type?.let {
                predicates.add(cb.equal(root.get<MediaType>("type"), it))
            }

            val effectiveDate = cb.coalesce<LocalDateTime>().apply {
                value(root.get<LocalDateTime>("takenAt"))
                value(root.get<LocalDateTime>("createdAt"))
            }

            startDate?.let {
                predicates.add(cb.greaterThanOrEqualTo(effectiveDate, it))
            }

            endDate?.let {
                predicates.add(cb.lessThanOrEqualTo(effectiveDate, it))
            }

            query?.orderBy(cb.desc(effectiveDate))

            cb.and(*predicates.toTypedArray())
        }
    }
}
