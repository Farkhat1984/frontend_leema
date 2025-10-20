#!/bin/bash
# Hot reload script - reload nginx without rebuilding container

echo "🔄 Reloading nginx in Docker container..."
docker exec frontend-leema nginx -s reload

if [ $? -eq 0 ]; then
    echo "✅ Nginx reloaded successfully!"
else
    echo "❌ Failed to reload nginx"
    exit 1
fi
