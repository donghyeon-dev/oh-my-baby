# Oh My Baby - 프로젝트 계획서

## 1. 프로젝트 개요

### 1.1 목적
양가 부모님과 아기 사진/동영상을 공유하기 위한 프라이빗 미디어 공유 플랫폼.
기존 상용 앱의 사진 제한(1,000장) 및 구독 요구 문제를 해결하기 위해 자체 서비스 구축.

### 1.2 대상 사용자
- 아기 부모 (관리자, 업로더)
- 양가 부모님 (뷰어, 다운로더)
- 예상 사용자 수: 4~6명

### 1.3 핵심 가치
- 무제한 사진/동영상 저장
- 광고 없는 깔끔한 경험
- 가족만 접근 가능한 프라이빗 공간
- 월 15,000원 이내 운영 비용

---

## 2. 기능 요구사항

### 2.1 MVP (Minimum Viable Product)

#### 인증/인가
- [ ] 회원가입 (초대 기반 또는 관리자 생성)
- [ ] 로그인/로그아웃
- [ ] JWT Access Token + Refresh Token
- [ ] 세션 자동 연장 (Refresh Token Rotation)

#### 미디어 업로드
- [ ] 단일 파일 업로드 (사진/동영상)
- [ ] 다중 파일 업로드 (사진+동영상 혼합 선택)
- [ ] 갤러리에서 파일 선택 UI
- [ ] 업로드 진행률 표시
- [ ] 동영상 길이 제한 (1분 이내)

#### 미디어 조회
- [ ] 전체 미디어 갤러리 뷰
- [ ] EXIF 메타데이터 기반 날짜별 그룹핑/정렬
- [ ] 날짜별 필터링
- [ ] 무한 스크롤 또는 페이지네이션
- [ ] 사진 상세 보기 (확대)
- [ ] 동영상 재생

#### 미디어 다운로드
- [ ] 단일 파일 다운로드
- [ ] 다중 파일 선택 후 순차 개별 다운로드 (갤러리 직접 저장)
- [ ] 다운로드 진행 상황 표시 (1/N, 2/N, ...)
- [ ] 원본 화질 다운로드

#### 반응
- [ ] 좋아요 기능
- [ ] 좋아요 수 표시

#### 알림
- [ ] 새 미디어 업로드 시 알림 (Push Notification 또는 인앱)

### 2.2 향후 확장 (Post-MVP)
- [ ] 댓글 기능
- [ ] 앨범/폴더 분류
- [ ] 얼굴 인식 자동 태깅
- [ ] 검색 기능
- [ ] 공유 링크 생성
- [ ] 백업/내보내기

---

## 3. 기술 스택

### 3.1 Frontend
| 항목 | 기술 | 비고 |
|------|------|------|
| Framework | Next.js 14+ (App Router) | React 기반, SSR/SSG 지원 |
| Language | TypeScript | 타입 안정성 |
| Styling | Tailwind CSS | 유틸리티 기반 CSS |
| State | Zustand 또는 React Query | 서버 상태 관리 |
| UI Components | shadcn/ui | 커스터마이징 용이 |
| PWA | next-pwa | 모바일 앱 경험 |

### 3.2 Backend
| 항목 | 기술 | 비고 |
|------|------|------|
| Framework | Spring Boot 3.2+ | Kotlin 지원 |
| Language | Kotlin | Java 상호운용 |
| ORM | Spring Data JPA + Hibernate | 표준 JPA |
| Security | Spring Security + JWT | 인증/인가 |
| Validation | Jakarta Validation | 입력 검증 |
| API Docs | SpringDoc OpenAPI | Swagger UI |

### 3.3 Database
| 항목 | 기술 | 비고 |
|------|------|------|
| RDBMS | PostgreSQL 16 | Self-hosted on Lightsail |
| Migration | Flyway | 스키마 버전 관리 |

### 3.4 Object Storage
| 항목 | 기술 | 비고 |
|------|------|------|
| Storage | MinIO | S3 호환 API |
| 구조 | Bucket per content type | photos/, videos/ |

### 3.5 Infrastructure
| 항목 | 기술 | 비고 |
|------|------|------|
| Server | AWS Lightsail $10 | 2 vCPU, 2GB RAM, 60GB SSD |
| Container | Docker + Docker Compose | 전체 스택 컨테이너화 |
| Reverse Proxy | Nginx | SSL, 라우팅 |
| SSL | Let's Encrypt (Certbot) | 무료 인증서 |
| Domain | 추후 구매 | 개발 중 IP/DuckDNS 사용 |

---

## 4. 시스템 아키텍처

### 4.1 전체 구조
```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Lightsail ($10)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Docker Compose                       │   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │  Nginx   │  │ Next.js  │  │  Spring Boot     │  │   │
│  │  │  :80/443 │──│  :3000   │  │  :8080           │  │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │   │
│  │                                       │             │   │
│  │                              ┌────────┴────────┐   │   │
│  │                              │                 │   │   │
│  │                        ┌─────┴─────┐    ┌─────┴─────┐  │
│  │                        │ PostgreSQL│    │   MinIO   │  │
│  │                        │   :5432   │    │   :9000   │  │
│  │                        └───────────┘    └───────────┘  │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 요청 흐름
```
User (Browser/Mobile)
         │
         ▼
      Nginx (SSL Termination, Routing)
         │
         ├── /api/* ──────► Spring Boot API
         │                        │
         │                        ├──► PostgreSQL (메타데이터)
         │                        └──► MinIO (파일 저장/조회)
         │
         └── /* ──────────► Next.js (SSR/Static)
```

### 4.3 인증 흐름
```
1. 로그인 요청 (email, password)
         │
         ▼
2. 서버 검증 → JWT 발급
   - Access Token (15분)
   - Refresh Token (7일, HttpOnly Cookie)
         │
         ▼
3. API 요청 시 Access Token 포함
         │
         ▼
4. Access Token 만료 시
   - Refresh Token으로 자동 갱신
   - Refresh Token Rotation 적용
```

---

## 5. 데이터 모델

### 5.1 ERD
```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│    User     │       │      Media      │       │    Like     │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)         │       │ id (PK)     │
│ email       │──────<│ uploader_id(FK) │>──────│ user_id(FK) │
│ password    │       │ type (PHOTO/    │       │ media_id(FK)│
│ name        │       │       VIDEO)    │       │ created_at  │
│ role        │       │ original_name   │       └─────────────┘
│ created_at  │       │ stored_path     │
│ updated_at  │       │ size            │
└─────────────┘       │ mime_type       │
                      │ width           │
                      │ height          │
                      │ duration        │
                      │ taken_at (EXIF) │
                      │ created_at      │
                      │ updated_at      │
                      └─────────────────┘

┌─────────────────┐
│  RefreshToken   │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ token           │
│ expires_at      │
│ created_at      │
└─────────────────┘
```

### 5.2 주요 엔티티

#### User
```kotlin
@Entity
@Table(name = "users")
data class User(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(unique = true, nullable = false)
    val email: String,
    
    @Column(nullable = false)
    val password: String,
    
    @Column(nullable = false)
    val name: String,
    
    @Enumerated(EnumType.STRING)
    val role: UserRole = UserRole.VIEWER,
    
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

enum class UserRole {
    ADMIN,  // 관리자 (업로드 가능)
    VIEWER  // 뷰어 (조회/다운로드만)
}
```

#### Media
```kotlin
@Entity
@Table(name = "media")
data class Media(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    val uploader: User,
    
    @Enumerated(EnumType.STRING)
    val type: MediaType,
    
    val originalName: String,
    val storedPath: String,
    val size: Long,
    val mimeType: String,
    
    val width: Int? = null,
    val height: Int? = null,
    val duration: Int? = null,  // 동영상 길이 (초)
    
    val takenAt: LocalDateTime? = null,  // EXIF 촬영일시
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

enum class MediaType {
    PHOTO, VIDEO
}
```

---

## 6. API 설계

### 6.1 인증 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 |
| POST | /api/auth/logout | 로그아웃 |
| POST | /api/auth/refresh | 토큰 갱신 |
| GET | /api/auth/me | 내 정보 조회 |

### 6.2 미디어 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/media | 미디어 목록 조회 (페이지네이션, 필터) |
| GET | /api/media/:id | 미디어 상세 조회 |
| POST | /api/media/upload | 미디어 업로드 (multipart) |
| DELETE | /api/media/:id | 미디어 삭제 |
| GET | /api/media/:id/download | 파일 다운로드 |

### 6.3 좋아요 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/media/:id/like | 좋아요 토글 |
| GET | /api/media/:id/likes | 좋아요 목록 |

### 6.4 알림 API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/notifications | 알림 목록 |
| PUT | /api/notifications/:id/read | 읽음 처리 |

---

## 7. 프로젝트 구조

### 7.1 모노레포 구조
```
oh-my-baby/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── PROJECT_PLAN.md
│
├── frontend/                    # Next.js
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   │
│   ├── public/
│   │   └── icons/
│   │
│   ├── src/
│   │   ├── app/                 # App Router
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (main)/
│   │   │   │   ├── gallery/
│   │   │   │   ├── upload/
│   │   │   │   └── settings/
│   │   │   └── api/             # API Routes (BFF)
│   │   │
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui
│   │   │   ├── media/
│   │   │   ├── auth/
│   │   │   └── layout/
│   │   │
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── services/            # API 클라이언트
│   │   ├── stores/              # Zustand stores
│   │   └── types/
│   │
│   └── tests/
│
├── backend/                     # Spring Boot
│   ├── Dockerfile
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   │
│   └── src/
│       ├── main/
│       │   ├── kotlin/
│       │   │   └── com/ohmybaby/
│       │   │       ├── OhMyBabyApplication.kt
│       │   │       │
│       │   │       ├── config/
│       │   │       │   ├── SecurityConfig.kt
│       │   │       │   ├── JwtConfig.kt
│       │   │       │   ├── MinioConfig.kt
│       │   │       │   └── WebConfig.kt
│       │   │       │
│       │   │       ├── domain/
│       │   │       │   ├── user/
│       │   │       │   │   ├── User.kt
│       │   │       │   │   ├── UserRepository.kt
│       │   │       │   │   ├── UserService.kt
│       │   │       │   │   └── UserController.kt
│       │   │       │   │
│       │   │       │   ├── media/
│       │   │       │   │   ├── Media.kt
│       │   │       │   │   ├── MediaRepository.kt
│       │   │       │   │   ├── MediaService.kt
│       │   │       │   │   └── MediaController.kt
│       │   │       │   │
│       │   │       │   ├── auth/
│       │   │       │   │   ├── AuthService.kt
│       │   │       │   │   ├── AuthController.kt
│       │   │       │   │   ├── JwtTokenProvider.kt
│       │   │       │   │   └── RefreshToken.kt
│       │   │       │   │
│       │   │       │   └── like/
│       │   │       │       ├── Like.kt
│       │   │       │       ├── LikeRepository.kt
│       │   │       │       └── LikeService.kt
│       │   │       │
│       │   │       ├── infra/
│       │   │       │   └── storage/
│       │   │       │       └── MinioStorageService.kt
│       │   │       │
│       │   │       └── common/
│       │   │           ├── exception/
│       │   │           ├── response/
│       │   │           └── util/
│       │   │
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── application-dev.yml
│       │       ├── application-prod.yml
│       │       └── db/migration/
│       │
│       └── test/
│
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
│
└── scripts/
    ├── init-minio.sh
    └── backup.sh
```

---

## 8. 개발 일정

### Phase 1: 프로젝트 셋업 (1주) - **완료**
- [x] 모노레포 구조 생성
- [x] Docker Compose 환경 구성
- [x] PostgreSQL, MinIO 컨테이너 설정
- [x] Next.js 프로젝트 초기화
- [x] Spring Boot 프로젝트 초기화
- [x] Nginx 설정
- [ ] ~~개발 환경 테스트~~ (스킵 - Docker 미설치 환경)

### Phase 2: 인증 시스템 (1주) - **완료**
- [x] User 엔티티 및 마이그레이션
- [x] 회원가입/로그인 API
- [x] JWT 토큰 발급/검증
- [x] Refresh Token 로직
- [x] Frontend 로그인/회원가입 UI
- [x] 인증 상태 관리 (Zustand)

### Phase 3: 미디어 업로드 (1주)
- [ ] Media 엔티티 및 마이그레이션
- [ ] MinIO 연동 (파일 업로드)
- [ ] EXIF 메타데이터 추출
- [ ] 업로드 API 구현
- [ ] Frontend 업로드 UI (다중 선택)
- [ ] 업로드 진행률 표시

### Phase 4: 미디어 조회/다운로드 (1주)
- [ ] 미디어 목록 API (페이지네이션, 날짜 필터)
- [ ] Frontend 갤러리 UI
- [ ] 날짜별 그룹핑
- [ ] 사진 뷰어 (확대)
- [ ] 동영상 플레이어
- [ ] 다운로드 API (단일/ZIP)

### Phase 5: 부가 기능 (1주)
- [ ] 좋아요 기능
- [ ] 알림 기능 (인앱)
- [ ] PWA 설정
- [ ] 반응형 UI 최적화

### Phase 6: 배포 및 안정화 (1주)
- [ ] Lightsail 인스턴스 생성
- [ ] Docker 이미지 빌드/배포
- [ ] SSL 인증서 설정
- [ ] 도메인 연결
- [ ] 성능 테스트 및 최적화
- [ ] 버그 수정

**예상 총 기간: 6주**

---

## 9. 리스크 및 대응

| 리스크 | 가능성 | 영향 | 대응 |
|--------|--------|------|------|
| Lightsail 2GB 메모리 부족 | 중 | 높음 | 스케일업 ($20 플랜) |
| 60GB 스토리지 부족 | 중 | 중 | EBS 추가 또는 외부 스토리지 |
| EXIF 추출 실패 | 낮음 | 낮음 | 업로드 시간으로 fallback |
| 동영상 용량 초과 | 중 | 중 | 업로드 전 압축 또는 제한 강화 |

---

## 10. 비용 요약

| 항목 | 월 비용 | 연 비용 |
|------|---------|---------|
| Lightsail $10 | ~13,000원 | ~156,000원 |
| 도메인 (.com) | - | ~15,000원 |
| **총계** | **~13,000원** | **~171,000원** |

※ 스케일업 시 Lightsail $20 = 월 ~27,000원

---

## 11. 진행 현황

### Phase 1 완료 (2026-01-06)
- [x] 모노레포 구조 생성
- [x] Docker Compose 환경 구성 (dev/prod)
- [x] PostgreSQL, MinIO 컨테이너 설정
- [x] Backend 프로젝트 초기화 (Spring Boot + Kotlin)
- [x] Frontend 프로젝트 초기화 (Next.js + TypeScript)
- [x] Nginx 설정
- [ ] ~~개발 환경 테스트~~ (스킵 - Docker 미설치 환경)

### Phase 2 완료 (2026-01-07)
- [x] User 엔티티 및 마이그레이션 (Phase 1에서 완료)
- [x] AuthService, AuthController 구현 (회원가입/로그인 API)
- [x] JWT 토큰 발급/검증 로직
- [x] Refresh Token 로직 (Rotation 포함)
- [x] UserService, UserController 구현
- [x] Frontend 로그인 페이지 UI
- [x] Frontend 회원가입 페이지 UI
- [x] 인증 상태 관리 (Zustand)
- [x] API 클라이언트 인증 연동
- [x] Protected Route 및 Auth Guard

### 다음 단계: Phase 3 - 미디어 업로드
1. Media 엔티티 및 마이그레이션
2. MinIO 연동 (파일 업로드)
3. EXIF 메타데이터 추출
4. 업로드 API 구현
5. Frontend 업로드 UI (다중 선택)
6. 업로드 진행률 표시
