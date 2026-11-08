#!/bin/bash

# Configuration
DB_NAME="aerobase"
BACKUP_DIR="/var/backups/aerobase"
DATE=$(date +%F_%H-%M-%S)
FILE_NAME="aerobase_${DATE}.sql.gz"
RETENTION_DAYS=30

# 1. Create directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo "Starting backup of ${DB_NAME}..."

# 2. Dump and Compress on the fly (Saves 80% disk space)
pg_dump ${DB_NAME} | gzip > ${BACKUP_DIR}/${FILE_NAME}

if [ $? -eq 0 ]; then
    echo "✅ Backup successful: ${BACKUP_DIR}/${FILE_NAME}"
else
    echo "❌ Backup FAILED!"
    # In production, trigger an alert to Slack/PagerDuty here
    exit 1
fi

# 3. Clean up old backups (The 'MAANG' Logic: Prevent disk exhaustion)
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find ${BACKUP_DIR} -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -exec rm {} \;

echo "Backup routine completed."