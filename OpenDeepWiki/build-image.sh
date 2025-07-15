#!/bin/bash

echo "==========================================="
echo "Building KoalaWiki Docker Images with BuildKit Multi-platform"
echo "==========================================="

# Enable Docker Buildx with a new builder that supports multi-platform builds
docker buildx create --name multiplatform-builder --use

# Build and push backend images for multiple platforms at once
echo "Building and pushing backend images for multiple platforms..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t crpi-j9ha7sxwhatgtvj4.cn-shenzhen.personal.cr.aliyuncs.com/koala-ai/koala-wiki:latest \
    -t crpi-j9ha7sxwhatgtvj4.cn-shenzhen.personal.cr.aliyuncs.com/koala-ai/koala-wiki:amd64 \
    -f src/KoalaWiki/Dockerfile \
    --push .

if [ $? -ne 0 ]; then
    echo "Error building and pushing backend images!"
    exit 1
fi

# Build and push frontend images for multiple platforms at once
echo "Building and pushing frontend images for multiple platforms..."
pushd web > /dev/null
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t crpi-j9ha7sxwhatgtvj4.cn-shenzhen.personal.cr.aliyuncs.com/koala-ai/koala-wiki-web:latest \
    -t crpi-j9ha7sxwhatgtvj4.cn-shenzhen.personal.cr.aliyuncs.com/koala-ai/koala-wiki-web:amd64 \
    -f Dockerfile \
    --push .

if [ $? -ne 0 ]; then
    echo "Error building and pushing frontend images!"
    exit 1
fi
popd > /dev/null

# Clean up the builder
docker buildx rm multiplatform-builder

echo "==========================================="
echo "All images built and pushed successfully!"
echo "==========================================="
