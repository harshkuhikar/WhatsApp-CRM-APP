# License System Documentation

## Overview

MyWASender uses a JWT-based license system with hardware ID (HWID) binding for secure license management.

## License Flow

### 1. License Generation (Admin/Reseller)

```
Admin/Reseller → Generate License Request → Backend
                                              ↓
                                    Create JWT Token
                                              ↓
                                    Store in Database
                                              ↓
                                    Return Token + Human Key
```

**API Endpoint**: `POST /api/v1/licenses/generate`

**Request**:
```json
{
  "owner_email": "user@example.com",
  "plan": "premium",
  "days": 365,
  "max_devices": 2,
  "reseller_id": null
}
```

**Response**:
```json
{
  "license_id": "uuid",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "human_key": "LFT-A1B2-C3D4-E5F6-G7H8",
  "owner_email": "user@example.com",
  "plan": "premium",
  "expires_at": "2025-11-14T00:00:00Z",
  "max_devices": 2
}
```

### 2. License Activation (User)

```
Desktop App → Get HWID → Send Activation Request → Backend
                                                      ↓
                                            Verify JWT Signature
                                                      ↓
                                            Check Expiry & Status
                                                      ↓
                                            Bind HWID (if first)
                                                      ↓
                                            Return Success
```

**API Endpoint**: `POST /api/v1/licenses/activate`

**Request**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "hwid": "machine-id-hash",
  "device_info": {
    "platform": "win32",
    "userAgent": "..."
  }
}
```

**Response**:
```json
{
  "success": true,
  "license_id": "uuid",
  "plan": "premium",
  "expires_at": "2025-11-14T00:00:00Z",
  "max_devices": 2,
  "offline_days": 7
}
```

### 3. License Validation (Periodic)

The desktop app validates the license:
- On startup
- Every 24 hours
- Before critical operations

**Offline Grace Period**: If validation fails (no internet), the app allows offline usage for N days (default: 7) based on the last successful validation timestamp.

**API Endpoint**: `POST /api/v1/licenses/validate`

**Request**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "hwid": "machine-id-hash"
}
```

**Response**:
```json
{
  "valid": true,
  "status": "active",
  "expires_at": "2025-11-14T00:00:00Z",
  "plan": "premium"
}
```

## JWT Token Structure

### Payload

```json
{
  "license_id": "uuid",
  "owner_email": "user@example.com",
  "plan": "premium",
  "issued_at": "2024-11-14T00:00:00Z",
  "expires_at": "2025-11-14T00:00:00Z",
  "max_devices": 2,
  "type": "license",
  "exp": 1731542400
}
```

### Signature

- Algorithm: HS256
- Secret: `JWT_SECRET` environment variable
- Must be kept secure and rotated periodically

## License States

| State | Description | User Impact |
|-------|-------------|-------------|
| `active` | License is valid and active | Full access |
| `expired` | License has passed expiry date | No access, renewal required |
| `revoked` | Admin manually revoked license | No access, contact support |
| `pending` | Payment pending (if applicable) | Limited or no access |

## Device Management

### HWID Generation

The desktop app generates a unique hardware ID using:
- Machine ID (via `node-machine-id`)
- Fallback to timestamp-based ID if machine ID unavailable

### Multi-Device Support

- Licenses can support multiple devices (configurable via `max_devices`)
- Each device activation is tracked separately
- Device list visible in admin panel

### Device Change Flow

If a user needs to change devices:

1. **Option A**: Admin manually unbinds old device
2. **Option B**: User requests device change via email verification
3. **Option C**: Automatic unbind after device inactive for X days (future feature)

## Reseller System

### Reseller Quotas

- Each reseller has a quota (number of licenses they can generate)
- Quota is decremented on each license generation
- Admin can increase quota as needed

### Commission Tracking

- Resellers earn commission on sales
- Commission percentage configurable per reseller
- Revenue tracking in admin panel

## Security Best Practices

### For Admins

1. **Rotate JWT Secret**: Change `JWT_SECRET` periodically
2. **Monitor Activations**: Watch for suspicious activation patterns
3. **Revoke Compromised Licenses**: Immediately revoke if abuse detected
4. **Audit Logs**: Review license generation and activation logs

### For Developers

1. **Never Expose JWT_SECRET**: Keep in environment variables only
2. **Validate on Server**: Always validate licenses server-side
3. **Rate Limit**: Implement rate limiting on activation endpoints
4. **Log Everything**: Log all license operations for audit trail

## Troubleshooting

### License Activation Fails

**Error**: "Invalid license token"
- **Cause**: Token signature invalid or JWT_SECRET mismatch
- **Solution**: Verify JWT_SECRET is correct on backend

**Error**: "License has expired"
- **Cause**: Current date > expires_at
- **Solution**: Extend license or issue new one

**Error**: "Maximum devices limit reached"
- **Cause**: License already activated on max_devices
- **Solution**: Increase max_devices or unbind old device

### Offline Validation

If user has no internet:
- App checks last validation timestamp
- If within offline_days grace period, allows usage
- Shows warning about validation needed
- Blocks usage after grace period expires

## API Reference

### Generate License
`POST /api/v1/licenses/generate`
- **Auth**: Admin or Reseller
- **Body**: `{ owner_email, plan, days, max_devices, reseller_id }`

### Activate License
`POST /api/v1/licenses/activate`
- **Auth**: None (public endpoint)
- **Body**: `{ token, hwid, device_info }`

### Validate License
`POST /api/v1/licenses/validate`
- **Auth**: None (public endpoint)
- **Body**: `{ token, hwid }`

### Revoke License
`POST /api/v1/licenses/revoke/{license_id}`
- **Auth**: Admin only

### Extend License
`POST /api/v1/licenses/extend/{license_id}`
- **Auth**: Admin only
- **Body**: `{ days }`

### Get License Details
`GET /api/v1/licenses/{license_id}`
- **Auth**: User (own licenses) or Admin (all licenses)
