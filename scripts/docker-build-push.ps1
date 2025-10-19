# Docker Hub Repository Configuration
$DOCKER_USERNAME = "yourusername"  # Change this to your Docker Hub username
$IMAGE_NAME = "3d-print-queue"
$VERSION = "1.0.0"
$LATEST = "latest"

Write-Host "Building Docker image..." -ForegroundColor Green

# Build the image
docker build -t "${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}" -t "${DOCKER_USERNAME}/${IMAGE_NAME}:${LATEST}" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green
Write-Host ""
Write-Host "Logging in to Docker Hub..." -ForegroundColor Green

# Login to Docker Hub
docker login

if ($LASTEXITCODE -ne 0) {
    Write-Host "Login failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Pushing image with version tag: ${VERSION}..." -ForegroundColor Green

# Push versioned image
docker push "${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing image with latest tag..." -ForegroundColor Green

# Push latest image
docker push "${DOCKER_USERNAME}/${IMAGE_NAME}:${LATEST}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Successfully pushed to Docker Hub!" -ForegroundColor Green
Write-Host "Image: ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}" -ForegroundColor Cyan
Write-Host "Image: ${DOCKER_USERNAME}/${IMAGE_NAME}:${LATEST}" -ForegroundColor Cyan
Write-Host ""
Write-Host "To pull this image, use:" -ForegroundColor Yellow
Write-Host "docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}" -ForegroundColor White
Write-Host "docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${LATEST}" -ForegroundColor White