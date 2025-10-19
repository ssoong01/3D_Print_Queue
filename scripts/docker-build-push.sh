#!/bin/bash

# Docker Hub Repository Configuration
DOCKER_USERNAME="yourusername"  # Change this to your Docker Hub username
IMAGE_NAME="3d-print-queue"
VERSION="1.0.0"
LATEST="latest"

echo "Building Docker image..."

# Build the image
docker build -t "${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}" -t "${DOCKER_USERNAME}/${IMAGE_NAME}:${LATEST}" .

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Build successful!"
echo ""
echo "Logging in to Docker Hub..."

# Login to Docker Hub
docker login

if [ $? -ne 0 ]; then
    echo "Login failed!"
    exit 1
fi

echo ""
echo "Pushing image with version tag: ${VERSION}..."

# Push versioned image
docker push "${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

if [ $? -ne 0 ]; then
    echo "Push failed!"
    exit 1
fi

echo "Pushing image with latest tag..."

# Push latest image
docker push "${DOCKER_USERNAME}/${IMAGE_NAME}:${LATEST}"

if [ $? -ne 0 ]; then
    echo "Push failed!"
    exit 1
fi

echo ""
echo "Successfully pushed to Docker Hub!"
echo "Image: ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo "Image: ${DOCKER_USERNAME}/${IMAGE_NAME}:${LATEST}"
echo ""
echo "To pull this image, use:"
echo "docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo "docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${LATEST}"