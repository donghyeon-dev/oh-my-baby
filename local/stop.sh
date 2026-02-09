#!/bin/bash
# ===========================================
# Oh My Baby - Stop Local Infrastructure
# ===========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Stopping local infrastructure..."
docker-compose down

echo "Local infrastructure stopped."
