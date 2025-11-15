# Architecture Overview

## System Components

### 1. Desktop Application (Electron + React)
- **Technology**: Electron, React, Vite, Material-UI
- **Purpose**: User-facing desktop application for campaign management
- **Key Features**:
  - License activation with HWID binding
  - Contact import (CSV)
  - Campaign creation and management
  - Real-time sending progress
  - Local data caching with electron-store

### 2. Backend API (FastAPI + PostgreSQL)
- **Technology**: Python FastAPI, SQLAlchemy, PostgreSQL
- **Purpose**: Central API server for authentication, licensing, and data management
- **Key Features**:
  - JWT-based authentication
  - License generation and validation
  - Campaign metadata storage
  - Payment processing (Stripe + Razorpay)
  - Admin and reseller management

### 3. Sending Worker (Node.js + Playwright)
- **Technology**: Node.js, Playwright, Express
- **Purpose**: WhatsApp message sending automation
- **Key Features**:
  - Multiple WhatsApp profile management
  - Playwright-based WhatsApp Web automation
  - Rate limiting and anti-ban measures
  - Proxy support per profile
  - Queue-based message processing

### 4. Admin/Reseller Panel (React SPA)
- **Technology**: React, Vite, Material-UI
- **Purpose**: Web-based management interface
- **Key Features**:
  - License management
  - User and reseller administration
  - Analytics and reporting
  - Revenue tracking

## Data Flow

```
Desktop App → Backend API → PostgreSQL
                ↓
          Sending Worker → WhatsApp Web
                ↓
            Redis Queue
```

## Security Architecture

1. **Authentication**: JWT tokens with refresh mechanism
2. **License Validation**: JWT-signed license tokens with HWID binding
3. **API Security**: HTTPS, rate limiting, CORS
4. **Data Encryption**: TLS in transit, bcrypt for passwords
5. **Secrets Management**: Environment variables, no hardcoded secrets

## Deployment Architecture

### Development
- Docker Compose for local development
- Hot reload for all services

### Production
- Kubernetes or Docker Swarm
- Managed PostgreSQL (RDS/DigitalOcean)
- Redis cluster for high availability
- Load balancer for API
- CDN for admin panel

## Scalability Considerations

1. **Horizontal Scaling**: Multiple sending worker instances
2. **Database**: Connection pooling, read replicas
3. **Caching**: Redis for session and license validation
4. **Queue**: Redis-based job queue for async processing
5. **Monitoring**: Sentry for error tracking, structured logging
