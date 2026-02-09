#!/bin/bash
# ===========================================
# Oh My Baby - Reset Local Infrastructure
# ===========================================
# Stops containers and removes all data volumes
# WARNING: This will delete all local database and storage data!

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo " WARNING: This will delete all local data!"
echo "=========================================="
read -p "Are you sure? (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Cancelled."
  exit 0
fi

echo "Stopping and removing containers + volumes..."
docker-compose down -v

echo ""
echo "Local infrastructure reset complete."
echo "Run ./start.sh to start fresh."
