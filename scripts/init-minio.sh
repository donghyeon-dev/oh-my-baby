#!/bin/bash
# MinIO Bucket Initialization Script

set -e

echo "Waiting for MinIO to be ready..."
sleep 5

# Configure mc client
mc alias set myminio http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}

# Create bucket if not exists
mc mb myminio/${MINIO_BUCKET_NAME} --ignore-existing

# Set bucket policy for public read on public folder
mc anonymous set download myminio/${MINIO_BUCKET_NAME}/public

echo "MinIO initialization completed!"
