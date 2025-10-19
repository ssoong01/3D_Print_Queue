# Base image
FROM node:20-alpine

# Install dependencies for building
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
COPY tsconfig*.json ./
COPY webpack.config.js ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Create default uploads directory (will be overridden by volume mount)
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]