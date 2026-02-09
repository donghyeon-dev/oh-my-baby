# Local Development Environment

로컬 개발을 위한 인프라(PostgreSQL + MinIO) Docker Compose 구성입니다.
Backend와 Frontend는 IDE에서 직접 실행합니다.

## Profile 구분

| Profile | 용도 | DB | Storage | 사용 시나리오 |
|---------|------|-----|---------|--------------|
| `local` | 단위 테스트 | H2 (in-memory) | Mock | `./gradlew test` |
| `dev` | 로컬 개발 / 통합 테스트 | PostgreSQL (Docker) | MinIO (Docker) | 이 폴더의 Docker Compose 사용 |
| `prod` | 운영 환경 | PostgreSQL (Cloud) | S3/MinIO (Cloud) | CI/CD 배포 |

## Quick Start

### 0. 환경변수 설정 (최초 1회)

```bash
cd local
cp .env.example .env
# .env 파일을 열어 비밀번호를 설정하세요
```

### 1. 인프라 시작

```bash
./start.sh
```

### 2. Backend 실행

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=dev'
```

### 3. Frontend 실행

```bash
cd frontend
npm run dev
```

## 스크립트

| 스크립트 | 설명 |
|----------|------|
| `./start.sh` | PostgreSQL + MinIO 시작 |
| `./stop.sh` | 인프라 중지 |
| `./reset.sh` | 인프라 중지 + 데이터 초기화 (볼륨 삭제) |
| `./status.sh` | 인프라 상태 확인 |

## 접속 정보

| 서비스 | URL | 계정 |
|--------|-----|------|
| PostgreSQL | `localhost:5432` | `.env` 파일 참조 |
| MinIO API | `http://localhost:9000` | `.env` 파일 참조 |
| MinIO Console | `http://localhost:9001` | `.env` 파일 참조 |
| Backend | `http://localhost:8080` | - |
| Frontend | `http://localhost:3000` | - |
| Swagger UI | `http://localhost:8080/swagger-ui.html` | - |

## 전체 Docker 실행 (선택사항)

모든 서비스를 Docker로 실행하려면 프로젝트 루트에서:

```bash
# .env 파일 생성 (최초 1회)
cp .env.example .env
# 값 수정 후 실행

# 개발 모드 (Hot reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# 프로덕션 모드
docker-compose up
```

## 트러블슈팅

### 포트 충돌
```bash
# PostgreSQL 5432 포트 사용 중인 프로세스 확인
lsof -i :5432

# MinIO 9000/9001 포트 사용 중인 프로세스 확인
lsof -i :9000
lsof -i :9001
```

### 데이터 초기화
```bash
./reset.sh
./start.sh
```
