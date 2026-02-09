#!/bin/bash
# ===========================================
# Oh My Baby - Start Local Infrastructure
# ===========================================
# Starts PostgreSQL + MinIO for local development
# Backend/Frontend should be run separately via IDE

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check .env file exists
if [ ! -f .env ]; then
  echo "ERROR: .env file not found!"
  echo "Run: cp .env.example .env"
  echo "Then edit .env with your passwords."
  exit 1
fi

echo "=========================================="
echo " Oh My Baby - Starting Local Infrastructure"
echo "=========================================="

docker-compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 3

# Check PostgreSQL
until docker exec ohmybaby-local-postgres pg_isready > /dev/null 2>&1; do
  echo "  Waiting for PostgreSQL..."
  sleep 2
done
echo "  PostgreSQL is ready!"

# Check MinIO
until docker exec ohmybaby-local-minio mc ready local > /dev/null 2>&1; do
  echo "  Waiting for MinIO..."
  sleep 2
done
echo "  MinIO is ready!"

echo ""
echo "=========================================="
echo " Infrastructure is running!"
echo "=========================================="
echo ""
echo " PostgreSQL    : localhost:5432"
echo " MinIO API     : http://localhost:9000"
echo " MinIO Console : http://localhost:9001"
echo ""
echo " Credentials are in your .env file."
echo ""
echo " Next steps:"
echo "   Backend  : cd backend && ./gradlew bootRun --args='--spring.profiles.active=dev'"
echo "   Frontend : cd frontend && npm run dev"
echo "=========================================="
