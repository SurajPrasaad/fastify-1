#!/bin/bash

# Configuration
BACKUP_DIR="./backups/postgres"
CONTAINER_NAME="postgres-db"
DB_NAME="fastify_app"
DB_USER="postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting backup of $DB_NAME..."

# Run pg_dump inside the container and compress the output
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup successful: $BACKUP_FILE"
    
    # Optional: Keep only last 7 days of backups
    find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete
    echo "🧹 Old backups cleaned up (older than 7 days)."
else
    echo "❌ Backup failed!"
    exit 1
fi
