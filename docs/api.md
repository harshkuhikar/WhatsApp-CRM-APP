# API Documentation

Base URL: `https://api.yourdomain.com/api/v1`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response: 200 OK
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response: 200 OK
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "..."
}

Response: 200 OK
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "role": "user",
  "created_at": "2024-11-14T00:00:00Z",
  "last_login": "2024-11-14T12:00:00Z"
}
```

### Licenses

#### Generate License (Admin/Reseller)
```http
POST /licenses/generate
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "owner_email": "customer@example.com",
  "plan": "premium",
  "days": 365,
  "max_devices": 2,
  "reseller_id": null
}

Response: 200 OK
{
  "license_id": "uuid",
  "token": "jwt_token",
  "human_key": "LFT-XXXX-YYYY-ZZZZ",
  "owner_email": "customer@example.com",
  "plan": "premium",
  "expires_at": "2025-11-14T00:00:00Z",
  "max_devices": 2
}
```

#### Activate License
```http
POST /licenses/activate
Content-Type: application/json

{
  "token": "jwt_token",
  "hwid": "machine-id",
  "device_info": {
    "platform": "win32",
    "userAgent": "..."
  }
}

Response: 200 OK
{
  "success": true,
  "license_id": "uuid",
  "plan": "premium",
  "expires_at": "2025-11-14T00:00:00Z",
  "max_devices": 2,
  "offline_days": 7
}
```

#### Validate License
```http
POST /licenses/validate
Content-Type: application/json

{
  "token": "jwt_token",
  "hwid": "machine-id"
}

Response: 200 OK
{
  "valid": true,
  "status": "active",
  "expires_at": "2025-11-14T00:00:00Z",
  "plan": "premium"
}
```

### Campaigns

#### Create Campaign
```http
POST /campaigns
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Black Friday Campaign",
  "template": "Hi {{name}}, special offer for you!",
  "scheduled_at": null,
  "settings": {
    "messages_per_minute": 10,
    "retry_failed": true
  }
}

Response: 200 OK
{
  "id": 1,
  "name": "Black Friday Campaign",
  "status": "draft",
  "created_at": "2024-11-14T00:00:00Z"
}
```

#### Add Contacts to Campaign
```http
POST /campaigns/{campaign_id}/contacts
Authorization: Bearer <token>
Content-Type: application/json

[
  {
    "name": "John Doe",
    "phone": "+1234567890",
    "custom": {
      "company": "Acme Inc"
    }
  }
]

Response: 200 OK
{
  "success": true,
  "count": 1
}
```

#### Import CSV
```http
POST /campaigns/{campaign_id}/import-csv
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: contacts.csv

Response: 200 OK
{
  "success": true,
  "imported": 100
}
```

#### Get Campaign Status
```http
GET /campaigns/{campaign_id}/status
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "name": "Black Friday Campaign",
  "status": "running",
  "created_at": "2024-11-14T00:00:00Z",
  "started_at": "2024-11-14T10:00:00Z",
  "statistics": {
    "total": 100,
    "queued": 20,
    "sent": 75,
    "failed": 5,
    "progress": 80.0
  }
}
```

### Payments

#### Create Checkout Session
```http
POST /payments/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "stripe",
  "plan": "premium",
  "amount": 99.99,
  "currency": "USD",
  "success_url": "https://app.example.com/success",
  "cancel_url": "https://app.example.com/cancel"
}

Response: 200 OK
{
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_..."
}
```

#### Payment History
```http
GET /payments/history
Authorization: Bearer <token>

Response: 200 OK
{
  "payments": [
    {
      "id": 1,
      "provider": "stripe",
      "amount": 99.99,
      "currency": "USD",
      "status": "completed",
      "plan": "premium",
      "created_at": "2024-11-14T00:00:00Z",
      "completed_at": "2024-11-14T00:01:00Z"
    }
  ]
}
```

### Admin

#### Get Statistics
```http
GET /admin/stats
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "users": {
    "total": 150,
    "active": 120
  },
  "licenses": {
    "total": 200,
    "active": 180,
    "expired": 15,
    "recent_activations": 25
  },
  "revenue": {
    "total": 15000.00,
    "monthly": 2500.00
  },
  "campaigns": {
    "total": 500
  }
}
```

#### List Licenses
```http
GET /admin/licenses?skip=0&limit=50&status=active&search=user@example.com
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "total": 100,
  "licenses": [...]
}
```

#### Create Reseller
```http
POST /admin/resellers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "reseller@example.com",
  "password": "securepassword",
  "name": "Reseller Inc",
  "commission_percent": 15.0,
  "quota": 100
}

Response: 200 OK
{
  "id": 1,
  "user_id": 10,
  "email": "reseller@example.com",
  "name": "Reseller Inc",
  "commission_percent": 15.0,
  "quota": 100
}
```

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message"
}
```

### Common Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

## Rate Limiting

- Default: 60 requests per minute per IP
- Authenticated: 120 requests per minute per user
- Headers:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp
