# 3D Print Queue

A comprehensive web application for managing 3D print requests with user authentication, showcase gallery, and admin panel.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Docker](https://img.shields.io/badge/docker-ready-blue)

## ✨ Features

- 🖨️ **Queue Management** - Drag-and-drop reordering with priority system
- 👥 **User Authentication** - Secure JWT-based auth with email verification
- 🖼️ **Showcase Gallery** - Share completed prints with the community
- 📧 **Email Notifications** - Automatic status updates and admin alerts
- 🔐 **Admin Panel** - User management, server settings, and access logs
- 📊 **Access Logs** - Track activity and manage IP bans
- 🎨 **Modern UI** - Responsive glassmorphism design with dark theme
- 🐳 **Docker Ready** - Easy deployment with Docker/Docker Compose
- 🔧 **Unraid Support** - Pre-built templates for Unraid servers

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Docker Deployment](#docker-deployment)
- [Unraid Deployment](#unraid-deployment)
- [Development](#development)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB 5.0+
- SMTP server (optional, for email notifications)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/3d-print-queue.git
   cd 3d-print-queue
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Web UI: http://localhost:8080
   - API: http://localhost:3000

### Using Docker

```bash
# Copy environment file
cp docker/.env.example .env

# Edit .env with your settings
nano .env

# Start with Docker Compose
npm run docker:dev

# Or manually
docker-compose -f docker/docker-compose.yml up -d
```

## 📦 Installation

### From Source

```bash
# Clone repository
git clone https://github.com/yourusername/3d-print-queue.git
cd 3d-print-queue

# Install dependencies
npm install

# Build application
npm run build

# Start production server
npm start
```

### From Docker Hub

```bash
docker pull ssoong01/3d-print-queue:latest
```

See [Docker Documentation](docs/DOCKER.md) for detailed instructions.

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
API_PORT=3000
WEB_PORT=8080
NODE_ENV=production

# Security - REQUIRED
JWT_SECRET=your-secure-random-string-here
ADMIN_PASSWORD=your-admin-password

# MongoDB
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=print-queue

# Uploads
UPLOADS_DIR=./uploads
```

### First Time Setup

1. Access the web UI at `http://localhost:8080`
2. Click **Sign In** → **Register**
3. Create an admin account:
   - Enter your details
   - Check **Register as Admin**
   - Enter the `ADMIN_PASSWORD` from your `.env` file
4. Verify your email (if SMTP is configured)
5. Configure SMTP settings in **Admin Panel** → **Server Settings**

## 🐳 Docker Deployment

### Development

```bash
npm run docker:dev
```

### Production

```bash
# Edit docker/.env.example with your settings
cp docker/.env.example .env

# Start production stack
npm run docker:prod
```

### Manual Docker Commands

```bash
# Build image
docker build -f docker/Dockerfile -t 3d-print-queue .

# Run with docker-compose
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop containers
docker-compose -f docker/docker-compose.yml down
```

See [Docker Documentation](docs/DOCKER.md) for advanced configuration.

## 🖥️ Unraid Deployment

The application includes ready-to-use Unraid templates:

1. Copy templates from `templates/` to your Unraid server
2. Add container from template in Unraid UI
3. Configure required environment variables
4. Start the container

See [Unraid Setup Guide](docs/UNRAID.md) for detailed instructions.

## 🛠️ Development

### Project Structure

```
3d-print-queue/
├── src/
│   ├── client/          # React frontend
│   │   ├── components/  # React components
│   │   ├── context/     # React context providers
│   │   └── styles/      # CSS stylesheets
│   ├── server/          # Express backend
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # MongoDB models
│   │   ├── routes/      # API routes
│   │   └── utils/       # Utility functions
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
├── docker/              # Docker configuration
├── docs/                # Documentation
├── scripts/             # Build and deployment scripts
├── templates/           # Unraid templates
└── uploads/             # Uploaded files (gitignored)
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev servers (frontend + backend)
npm run server:dev       # Start backend only
npm run client:dev       # Start frontend only

# Build
npm run build           # Build for production
npm run clean           # Clean build artifacts

# Docker
npm run docker:build    # Build Docker image
npm run docker:dev      # Start dev environment
npm run docker:prod     # Start production environment
npm run docker:stop     # Stop containers
npm run docker:logs     # View container logs
npm run docker:push     # Build and push to Docker Hub
```

### Tech Stack

**Frontend:**
- React 18
- TypeScript
- React Router
- CSS Modules

**Backend:**
- Node.js
- Express
- MongoDB with Mongoose
- JWT Authentication
- Nodemailer

**DevOps:**
- Docker & Docker Compose
- Webpack
- TypeScript
- Nodemon

## 📚 Documentation

- [Docker Deployment Guide](docs/DOCKER.md)
- [Unraid Setup Guide](docs/UNRAID.md)
- [Uploads Configuration](docs/UPLOADS.md)
- [API Documentation](docs/API.md) *(coming soon)*
- [Contributing Guide](CONTRIBUTING.md) *(coming soon)*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Icons from [Heroicons](https://heroicons.com/)
- UI inspiration from modern glassmorphism design trends
- Community feedback and contributions

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/3d-print-queue/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/3d-print-queue/discussions)
- **Email**: your.email@example.com

---

Made with ❤️ by [Your Name](https://github.com/yourusername)