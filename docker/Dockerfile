# Multi-stage build for smaller image size
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY webpack.config.js ./

# Install ALL dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code and assets (favicon.png should already be in public/)
COPY src ./src
COPY public ./public

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Add labels for Docker Hub and Unraid
LABEL org.opencontainers.image.title="3D Print Queue"
LABEL org.opencontainers.image.description="A comprehensive web application for managing 3D print requests with user authentication, showcase gallery, and admin panel"
LABEL org.opencontainers.image.authors="ssoong01"
LABEL org.opencontainers.image.url="https://github.com/ssoong01/3d-print-queue"
LABEL org.opencontainers.image.documentation="https://github.com/ssoong01/3d-print-queue/blob/main/README.md"
LABEL org.opencontainers.image.source="https://github.com/ssoong01/3d-print-queue"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="ssoong01"

# Unraid-specific labels
LABEL net.unraid.docker.managed="true"
LABEL net.unraid.docker.webui="http://[IP]:[PORT:8080]"
LABEL net.unraid.docker.icon="https://raw.githubusercontent.com/ssoong01/3d-print-queue/main/templates/icon.png"
LABEL net.unraid.docker.template="https://raw.githubusercontent.com/ssoong01/3d-print-queue/main/templates/unraid-template.xml"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000 8080

# Set environment variables
ENV NODE_ENV=production
ENV API_PORT=3000
ENV WEB_PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/server/server.js"]