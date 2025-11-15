# Deployment Guide

## Prerequisites

### Required
- Domain name with DNS access
- SSL certificate (Let's Encrypt recommended)
- Server with Docker and Docker Compose
- PostgreSQL database (managed or self-hosted)
- Redis instance
- SMTP credentials for email
- Stripe and/or Razorpay API keys

### Optional
- Code signing certificates (Windows Authenticode, Apple Developer)
- WhatsApp Business API credentials
- Sentry DSN for monitoring

## Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Create application directory
sudo mkdir -p /opt/mywasender
cd /opt/mywasender
```

### 2. Clone Repository

```bash
git clone https://github.com/your-org/MyWASender.git .
```

### 3. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env

# Update with production values:
# - DATABASE_URL (managed PostgreSQL)
# - REDIS_URL
# - JWT_SECRET (generate strong secret)
# - SMTP credentials
# - Payment API keys
# - CORS_ORIGINS (your domains)
```

### 4. SSL Certificate Setup

```bash
# Using Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d api.yourdomain.com
sudo certbot certonly --standalone -d admin.yourdomain.com
```

### 5. Database Initialization

```bash
# Run migrations
cd backend
docker-compose run backend alembic upgrade head

# Seed initial data
docker-compose run backend python scripts/seed_data.py
```

## Docker Deployment

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    restart: always
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    command: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

  sending-worker:
    build: ./sending-worker
    restart: always
    environment:
      - REDIS_URL=${REDIS_URL}
    ports:
      - "3001:3001"

  admin-panel:
    build: ./admin-panel
    restart: always
    ports:
      - "80:80"
```

### Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/mywasender

# API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin Panel
server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Desktop App Distribution

### Building Installers

```bash
cd desktop

# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### Code Signing (Optional)

#### Windows
```bash
# Set environment variables
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password

npm run build:win
```

#### macOS
```bash
# Set environment variables
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=app-specific-password

npm run build:mac
```

## Monitoring and Maintenance

### Health Checks

```bash
# API health
curl https://api.yourdomain.com/api/v1/health

# Worker health
curl http://localhost:3001/health
```

### Logs

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f sending-worker

# Backend logs
tail -f backend/logs/app.log

# Worker logs
tail -f sending-worker/logs/combined.log
```

### Backups

```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automated daily backups
0 2 * * * /opt/mywasender/scripts/backup.sh
```

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose run backend alembic upgrade head
```

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check DATABASE_URL format
   - Verify PostgreSQL is accessible
   - Check firewall rules

2. **License activation fails**
   - Verify JWT_SECRET is set
   - Check backend logs for errors
   - Ensure HWID is being generated correctly

3. **WhatsApp sending fails**
   - Check sending-worker logs
   - Verify Playwright browser installation
   - Check for rate limiting

### Support

For issues during the 30-day warranty period, contact support with:
- Error logs
- Steps to reproduce
- Environment details
