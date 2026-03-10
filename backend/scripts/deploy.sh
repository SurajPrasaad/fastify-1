#!/bin/bash

# Configuration (Change these or use Environment Variables)
PROJECT_DIR="/var/www/socialmedia/backend"
IMAGE_NAME="ghcr.io/${GITHUB_REPOSITORY:-yourusername/socialmedia-backend}:latest"

echo "🚀 Starting Deployment..."

# 1. Pull latest code (if not already handled by CD)
# cd $PROJECT_DIR && git pull origin main

# 2. Login to Registry (Github Token should be set as env var or pre-authenticated)
# echo $GH_TOKEN | docker login ghcr.io -u $GH_USER --password-stdin

# 3. Pull latest image
echo "📥 Pulling latest image..."
docker pull $IMAGE_NAME

# 4. Restart services using docker-compose
echo "🔄 Restarting containers..."
docker-compose -f docker-compose.yml up -d --remove-orphans

# 5. Clean up old images to save space
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment Successful!"
