#!/bin/bash
# ===========================================
# Oh My Baby - Check Local Infrastructure Status
# ===========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo " Oh My Baby - Infrastructure Status"
echo "=========================================="
echo ""

# Check PostgreSQL
if docker ps --filter "name=ohmybaby-local-postgres" --filter "status=running" -q | grep -q .; then
  echo "  PostgreSQL : RUNNING (localhost:5432)"
else
  echo "  PostgreSQL : STOPPED"
fi

# Check MinIO
if docker ps --filter "name=ohmybaby-local-minio" --filter "status=running" -q | grep -q .; then
  echo "  MinIO API  : RUNNING (http://localhost:9000)"
  echo "  MinIO Console : RUNNING (http://localhost:9001)"
else
  echo "  MinIO      : STOPPED"
fi

echo ""

# Show docker-compose status
docker-compose ps 2>/dev/null || echo "  (docker-compose not initialized)"
