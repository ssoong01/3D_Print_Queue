# Uploads Directory Configuration

The application stores uploaded showcase images in a configurable directory. This allows you to persist uploaded images across container restarts and store them on your preferred storage location.

## Local Development

For local development, set the `UPLOADS_DIR` environment variable in your `.env` file:

```env
# Windows (use forward slashes or escaped backslashes)
UPLOADS_DIR=W:/3d-print-queue/uploads
# or
UPLOADS_DIR=W:\\3d-print-queue\\uploads

# Linux/Mac
UPLOADS_DIR=/home/user/3d-print-queue/uploads

# Relative path (default)
UPLOADS_DIR=./uploads
```

## Docker Deployment

For Docker deployment, configure the host directory in your `.env` file:

```env
# The directory on your host machine where uploads will be stored
UPLOADS_HOST_DIR=./uploads
```

### Docker Compose Usage

1. **Set the uploads directory in `.env`:**
   ```env
   UPLOADS_HOST_DIR=/path/to/your/uploads
   ```

2. **Start the containers:**
   ```bash
   docker-compose up -d
   ```

3. **Verify the mount:**
   ```bash
   docker-compose exec app ls -la /app/uploads
   ```

### Platform-Specific Examples

**Windows:**
```env
UPLOADS_HOST_DIR=C:/Users/YourName/3d-print-queue/uploads
# or
UPLOADS_HOST_DIR=//c/Users/YourName/3d-print-queue/uploads
```

**Linux:**
```env
UPLOADS_HOST_DIR=/home/username/3d-print-queue/uploads
```

**macOS:**
```env
UPLOADS_HOST_DIR=/Users/username/3d-print-queue/uploads
```

**NAS/Network Storage:**
```env
# Windows network path
UPLOADS_HOST_DIR=//nas-server/share/3d-print-queue/uploads

# Linux NFS mount
UPLOADS_HOST_DIR=/mnt/nas/3d-print-queue/uploads
```

## Permissions

Ensure the uploads directory has appropriate permissions:

**Linux/Mac:**
```bash
mkdir -p /path/to/uploads
chmod 755 /path/to/uploads
```

**Docker:**
The Dockerfile creates the directory with 777 permissions to ensure the container can write to it.

## Backup Recommendations

Since uploads are stored in a bind mount, they can be easily backed up:

1. **Simple file copy:**
   ```bash
   cp -r /path/to/uploads /path/to/backup
   ```

2. **Rsync (incremental backup):**
   ```bash
   rsync -av /path/to/uploads/ /path/to/backup/
   ```

3. **Cloud sync:**
   Use tools like `rclone` to sync to cloud storage:
   ```bash
   rclone sync /path/to/uploads remote:backup/uploads
   ```

## Troubleshooting

### Permission Denied Errors

If you encounter permission denied errors:

1. Check directory permissions:
   ```bash
   ls -ld /path/to/uploads
   ```

2. Ensure the directory is writable:
   ```bash
   chmod 755 /path/to/uploads
   ```

3. For Docker on Linux, you may need to set the correct ownership:
   ```bash
   sudo chown -R 1000:1000 /path/to/uploads
   ```

### Windows Path Issues

If using Windows, ensure you're using forward slashes or properly escaped backslashes in the `.env` file.

### Disk Space

Monitor disk space in your uploads directory:

```bash
du -sh /path/to/uploads
df -h /path/to/uploads
```

Configure automatic cleanup of old images if needed by adding a cron job or scheduled task.