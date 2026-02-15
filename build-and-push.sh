#!/bin/bash

# Build and push multi-architecture Docker images to Docker Hub
# Usage: ./build-and-push.sh [dockerhub_username]

set -e

DOCKERHUB_USER=${1:-wottle}
DOMAIN="inventorydifferent.com"
PLATFORMS="linux/amd64,linux/arm64"

echo "Building and pushing multi-arch images for Docker Hub user: $DOCKERHUB_USER"
echo "Platforms: $PLATFORMS"
echo "Domain configured: $DOMAIN"
echo ""

# Login to Docker Hub
echo "Logging in to Docker Hub..."
docker login

# Create/use buildx builder for multi-arch
echo ""
echo "Setting up Docker buildx for multi-architecture builds..."
docker buildx create --name multiarch --use 2>/dev/null || docker buildx use multiarch
docker buildx inspect --bootstrap

# Build and push API image (multi-arch)
echo ""
echo "Building and pushing API image (multi-arch)..."
docker buildx build \
  --platform $PLATFORMS \
  -t $DOCKERHUB_USER/inventory-api:latest \
  --push \
  ./api

# Build and push Web image (multi-arch, with domain baked in)
echo ""
echo "Building and pushing Web image (multi-arch) with NEXT_PUBLIC_API_URL=https://$DOMAIN..."
docker buildx build \
  --platform $PLATFORMS \
  --build-arg NEXT_PUBLIC_API_URL=https://$DOMAIN \
  -t $DOCKERHUB_USER/inventory-web:latest \
  --push \
  ./web

# Build and push Storefront image (multi-arch, with domain baked in)
echo ""
echo "Building and pushing Storefront image (multi-arch) with NEXT_PUBLIC_API_URL=https://$DOMAIN..."
docker buildx build \
  --platform $PLATFORMS \
  --build-arg NEXT_PUBLIC_API_URL=https://$DOMAIN \
  -t $DOCKERHUB_USER/inventory-storefront:latest \
  --push \
  ./storefront

# Build and push MCP Server image (multi-arch)
echo ""
echo "Building and pushing MCP Server image (multi-arch)..."
docker buildx build \
  --platform $PLATFORMS \
  -t $DOCKERHUB_USER/inventory-mcp:latest \
  --push \
  ./mcp-server

echo ""
echo "✅ Done! Multi-arch images pushed to Docker Hub:"
echo "   - $DOCKERHUB_USER/inventory-api:latest (amd64 + arm64)"
echo "   - $DOCKERHUB_USER/inventory-web:latest (amd64 + arm64)"
echo "   - $DOCKERHUB_USER/inventory-storefront:latest (amd64 + arm64)"
echo "   - $DOCKERHUB_USER/inventory-mcp:latest (amd64 + arm64)"
echo ""
echo "On your NAS, run:"
echo "   docker compose -f docker-compose.nas.yml pull"
echo "   docker compose -f docker-compose.nas.yml up -d"
