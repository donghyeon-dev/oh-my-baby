#!/bin/bash
# Backup Script for Oh My Baby

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Starting backup at ${TIMESTAMP}..."

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
docker exec ohmybaby-postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > ${BACKUP_DIR}/postgres_${TIMESTAMP}.sql

# Backup MinIO data
echo "Backing up MinIO data..."
docker run --rm \
  --network ohmybaby_ohmybaby-network \
  -v ${BACKUP_DIR}:/backup \
  minio/mc \
  mirror myminio/${MINIO_BUCKET_NAME} /backup/minio_${TIMESTAMP}

echo "Backup completed!"
echo "Files saved to ${BACKUP_DIR}"
