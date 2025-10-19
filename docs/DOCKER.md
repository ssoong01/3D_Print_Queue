# 3D Print Queue - Docker Image

A comprehensive web application for managing 3D print requests with user authentication, showcase gallery, and admin panel.

## Features

- 🖨️ Queue management with drag-and-drop reordering
- 👥 User authentication with email verification
- 🖼️ Showcase gallery for sharing prints
- 📧 Email notifications
- 🔐 Admin panel with user management
- 📊 Access logs and IP management
- 🎨 Modern, responsive UI

## Quick Start

### Using Docker Compose (Recommended)

1. **Create a `.env` file:**

```env
# Required
JWT_SECRET=your-secure-random-string-here
ADMIN_PASSWORD=your-admin-password

# Optional
API_PORT=3000
WEB_PORT=8080
MONGODB_PORT=27017
UPLOADS_HOST_DIR=./uploads
```

2. **Create `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  app:
    image: yourusername/3d-print-queue:latest
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - MONGODB_HOST=db
      - MONGODB_PORT=27017
      - MONGODB_DATABASE=print-queue
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mongo:7-jammy
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

3. **Start the application:**

```bash
docker-compose up -d
```

4. **Access the application:**

- Web UI: http://localhost:8080
- API: http://localhost:3000

### Using Docker Run

```bash
# Create network
docker network create print-queue-network

# Run MongoDB
docker run -d \
  --name print-queue-db \
  --network print-queue-network \
  -v mongodb_data:/data/db \
  mongo:7-jammy

# Run Application
docker run -d \
  --name print-queue-app \
  --network print-queue-network \
  -p 3000:3000 \
  -p 8080:8080 \
  -e JWT_SECRET=your-secret-key \
  -e ADMIN_PASSWORD=admin \
  -e MONGODB_HOST=print-queue-db \
  -v ./uploads:/app/uploads \
  yourusername/3d-print-queue:latest
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | **Required** - Secret for JWT tokens | - |
| `ADMIN_PASSWORD` | **Required** - Admin registration password | `admin` |
| `API_PORT` | API server port | `3000` |
| `WEB_PORT` | Web UI port | `8080` |
| `MONGODB_HOST` | MongoDB hostname | `localhost` |
| `MONGODB_PORT` | MongoDB port | `27017` |
| `MONGODB_DATABASE` | Database name | `print-queue` |
| `UPLOADS_DIR` | Uploads directory path | `/app/uploads` |

## Volumes

- `/app/uploads` - Persistent storage for uploaded showcase images
- MongoDB data is stored in a named volume `mongodb_data`

## Ports

- `3000` - API Server
- `8080` - Web UI

## Health Check

The container includes a health check that runs every 30 seconds:
- Endpoint: `http://localhost:3000/api/health`
- Timeout: 10s
- Start period: 40s
- Retries: 3

## First Time Setup

1. Access http://localhost:8080
2. Click "Sign In" → "Register"
3. Create admin account:
   - Check "Register as Admin"
   - Enter the `ADMIN_PASSWORD` you set
4. Verify email (if SMTP configured)
5. Configure SMTP settings in Admin Panel

## Backup

### Backup MongoDB Data

```bash
docker-compose exec -T db mongodump --archive > backup-$(date +%Y%m%d).archive
```

### Backup Uploads

```bash
tar czf uploads-backup-$(date +%Y%m%d).tar.gz ./uploads
```

### Restore MongoDB Data

```bash
docker-compose exec -T db mongorestore --archive < backup.archive
```

## Updating

```bash
docker-compose pull
docker-compose up -d
```

## Troubleshooting

### Permission Issues (Linux)

```bash
sudo chown -R 1001:1001 ./uploads
```

### View Logs

```bash
docker-compose logs -f app
```

### Reset Admin Password

1. Stop containers: `docker-compose down`
2. Update `ADMIN_PASSWORD` in `.env`
3. Start containers: `docker-compose up -d`
4. Use Admin Panel to update password

## Support

- GitHub: [Your Repository URL]
- Issues: [Your Issues URL]
- Documentation: [Your Docs URL]

## License

MIT