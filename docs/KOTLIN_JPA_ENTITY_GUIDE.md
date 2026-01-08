# Kotlin JPA Entity Guide

이 문서는 Oh My Baby 프로젝트에서 Kotlin JPA Entity를 작성할 때 따라야 하는 규칙을 정의합니다.

## 참고 자료
- https://veluxer62.github.io/explanation/kotlin-jpa-entity/

---

## 핵심 원칙

### 1. data class 사용 금지

```kotlin
// BAD
data class User(
    @Id val id: UUID,
    val email: String
)

// GOOD
class User(
    email: String
) : PrimaryKeyEntity() {
    var email: String = email
        protected set
}
```

**이유:**
- `data class`의 `equals()`/`hashCode()`가 모든 프로퍼티를 비교하여 JPA와 충돌
- `copy()` 메서드가 새 인스턴스를 만들어 영속성 컨텍스트와 충돌

---

### 2. lateinit 사용 금지

```kotlin
// BAD
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id")
lateinit var user: User

// GOOD
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id", nullable = false)
var user: User = user
    protected set
```

**이유:**
- 연관관계에서 `lateinit`을 사용하면 초기화 전 접근 시 런타임 오류 발생
- 생성자에서 연관 엔티티를 주입받아 즉시 초기화해야 함

---

### 3. @GeneratedValue 사용 금지 (ULID 사용)

```kotlin
// BAD
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
val id: Long = 0

// GOOD
@MappedSuperclass
abstract class PrimaryKeyEntity : Persistable<UUID> {
    @Id
    private val id: UUID = UlidCreator.getMonotonicUlid().toUuid()
    
    override fun getId(): UUID = id
    // ...
}
```

**이유:**
- `@GeneratedValue`는 ID를 nullable로 만들어 Kotlin의 non-null 타입과 충돌
- DB 시퀀스/auto_increment 채번 부하 발생
- ULID는 시간순 정렬이 가능하고, 분산 환경에서도 충돌 없음

---

### 4. protected set으로 캡슐화

```kotlin
// BAD
class User {
    var name: String = ""  // 외부에서 직접 수정 가능
}

// GOOD
class User(name: String) : PrimaryKeyEntity() {
    var name: String = name
        protected set
    
    fun updateName(newName: String) {
        this.name = newName
    }
}
```

**이유:**
- 외부에서 프로퍼티 직접 수정 방지
- 비즈니스 로직을 엔티티 내부 메서드로 캡슐화

---

### 5. 연관관계는 ID가 아닌 Entity로 주입

```kotlin
// BAD
class Like(
    userId: Long,
    mediaId: Long
)

// GOOD
class Like(
    user: User,
    media: Media
) : PrimaryKeyEntity() {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User = user
        protected set
}
```

**이유:**
- 객체 그래프 탐색이 가능해짐
- JPA의 영속성 컨텍스트 관리가 제대로 동작

---

### 6. PrimaryKeyEntity 상속

모든 엔티티는 `PrimaryKeyEntity`를 상속해야 합니다.

```kotlin
@Entity
@Table(name = "users")
class User(
    email: String,
    password: String,
    name: String,
    role: UserRole = UserRole.VIEWER
) : PrimaryKeyEntity() {
    // ...
}
```

**PrimaryKeyEntity가 제공하는 것:**
- ULID 기반 UUID ID 자동 생성
- `Persistable<UUID>` 구현으로 새 엔티티 판별
- HibernateProxy를 고려한 `equals()`/`hashCode()`

---

## PrimaryKeyEntity 구현

```kotlin
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
```

---

## 엔티티 작성 템플릿

```kotlin
package com.ohmybaby.domain.xxx

import com.ohmybaby.common.entity.PrimaryKeyEntity
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "xxx")
class Xxx(
    // 생성자 파라미터 (초기화 필요한 값들)
    requiredField: String,
    optionalField: String? = null,
    relatedEntity: RelatedEntity
) : PrimaryKeyEntity() {

    @Column(nullable = false)
    var requiredField: String = requiredField
        protected set

    @Column
    var optionalField: String? = optionalField
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_entity_id", nullable = false)
    var relatedEntity: RelatedEntity = relatedEntity
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

    // 비즈니스 메서드
    fun updateRequiredField(newValue: String) {
        this.requiredField = newValue
    }

    override fun toString(): String {
        return "Xxx(id=${getId()}, requiredField='$requiredField')"
    }
}
```

---

## 체크리스트

엔티티 작성 시 다음 항목을 확인하세요:

- [ ] `data class`가 아닌 일반 `class` 사용
- [ ] `PrimaryKeyEntity` 상속
- [ ] `@Id`, `@GeneratedValue` 직접 선언하지 않음
- [ ] `lateinit` 사용하지 않음
- [ ] 모든 mutable 프로퍼티에 `protected set` 적용
- [ ] 연관관계는 ID가 아닌 Entity로 주입
- [ ] 수정 로직은 별도 메서드로 캡슐화 (e.g., `updateName()`)
- [ ] `equals()`/`hashCode()` 직접 오버라이드하지 않음 (PrimaryKeyEntity에서 제공)
- [ ] `toString()`에서 `getId()` 메서드 사용
