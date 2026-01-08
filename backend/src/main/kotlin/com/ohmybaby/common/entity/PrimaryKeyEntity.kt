package com.ohmybaby.common.entity

import com.github.f4b6a3.ulid.UlidCreator
import jakarta.persistence.Id
import jakarta.persistence.MappedSuperclass
import jakarta.persistence.PostLoad
import jakarta.persistence.PostPersist
import org.hibernate.proxy.HibernateProxy
import org.springframework.data.domain.Persistable
import java.util.Objects
import java.util.UUID

@MappedSuperclass
abstract class PrimaryKeyEntity : Persistable<UUID> {

    @Id
    private val id: UUID = UlidCreator.getMonotonicUlid().toUuid()

    @Transient
    private var _isNew: Boolean = true

    override fun getId(): UUID = id

    override fun isNew(): Boolean = _isNew

    @PostPersist
    @PostLoad
    protected fun markNotNew() {
        _isNew = false
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null) return false

        val otherEntity = when (other) {
            is HibernateProxy -> other.hibernateLazyInitializer.implementation
            else -> other
        }

        if (otherEntity !is PrimaryKeyEntity) return false
        if (this::class != otherEntity::class) return false

        return id == otherEntity.id
    }

    override fun hashCode(): Int = Objects.hashCode(id)
}
