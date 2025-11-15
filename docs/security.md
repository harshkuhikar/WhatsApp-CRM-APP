# Security Best Practices

## Overview

MyWASender implements multiple layers of security to protect user data, prevent unauthorized access, and ensure system integrity.

## Authentication & Authorization

### JWT Tokens

- **Access Tokens**: Short-lived (30 minutes), used for API requests
- **Refresh Tokens**: Long-lived (30 days), used to obtain new access tokens
- **Algorithm**: HS256 with strong secret key
- **Storage**: Secure electron-store on desktop, httpOnly cookies for web

### Password Security

- **Hashing**: bcrypt with salt rounds
- **Requirements**: Minimum 8 characters (enforce in production)
- **Reset**: Email-based password reset with time-limited tokens

### Role-Based Access Control (RBAC)

- **User**: Basic access to own campaigns and licenses
- **Reseller**: Can generate licenses within quota
- **Admin**: Full system access

## License Security

### JWT-Based Licenses

- **Signature**: HMAC-SHA256 with server-only secret
- **HWID Binding**: Prevents license sharing across devices
- **Expiry**: Built into JWT payload
- **Revocation**: Database-backed revocation list

### Anti-Piracy Measures

1. **Server-Side Validation**: All license checks happen on backend
2. **Periodic Validation**: Desktop app validates every 24 hours
3. **Offline Grace Period**: Limited to 7 days to prevent indefinite offline use
4. **Device Tracking**: Monitor activation patterns for abuse
5. **Rate Limiting**: Prevent brute-force activation attempts

## API Security

### HTTPS/TLS

- **Requirement**: All production traffic must use HTTPS
- **Certificate**: Use Let's Encrypt or commercial CA
- **TLS Version**: Minimum TLS 1.2

### CORS

- **Whitelist**: Only allow specific origins
- **Credentials**: Enable credentials for authenticated requests
- **Methods**: Restrict to necessary HTTP methods

### Rate Limiting

```python
# Per IP
- 60 requests/minute for unauthenticated
- 120 requests/minute for authenticated

# Per Endpoint
- /auth/login: 5 attempts/minute
- /licenses/activate: 10 attempts/hour
- /licenses/generate: 20 requests/hour (reseller)
```

### Input Validation

- **Pydantic Models**: Automatic validation on all endpoints
- **SQL Injection**: SQLAlchemy ORM prevents SQL injection
- **XSS**: React automatically escapes output
- **File Uploads**: Validate file types and sizes

## Data Protection

### Encryption

- **In Transit**: TLS 1.2+ for all connections
- **At Rest**: Database encryption (managed by provider)
- **Passwords**: bcrypt hashing, never stored in plain text
- **Secrets**: Environment variables, never in code

### Database Security

- **Access Control**: Restrict database access to backend only
- **Connection Pooling**: Prevent connection exhaustion
- **Prepared Statements**: SQLAlchemy uses parameterized queries
- **Backups**: Encrypted daily backups

### PII Handling

- **Minimal Collection**: Only collect necessary data
- **Anonymization**: Remove PII from logs
- **Retention**: Delete old data per policy
- **GDPR Compliance**: Provide data export and deletion

## WhatsApp Automation Security

### Rate Limiting

```javascript
// Recommended limits to avoid bans
- Messages per minute: 10-20
- Messages per hour: 200-500
- Delay between messages: 3-10 seconds (random)
- Daily limit: 1000-2000 messages
```

### Anti-Ban Measures

1. **Human-Like Behavior**: Random delays, typing simulation
2. **Profile Warm-Up**: Gradual increase in sending volume
3. **Proxy Rotation**: Use different IPs per profile
4. **Session Persistence**: Maintain WhatsApp Web sessions
5. **Error Handling**: Pause on rate limit errors

### Legal Compliance

- **Terms of Service**: Display WhatsApp TOS acceptance
- **Consent**: Require user consent for automation
- **Disclaimer**: Clear warning about account risks
- **Opt-Out**: Provide unsubscribe mechanism

## Infrastructure Security

### Server Hardening

```bash
# Firewall
- Allow only ports 80, 443, 22 (SSH)
- Restrict SSH to key-based auth
- Disable root login

# Updates
- Enable automatic security updates
- Regular package updates

# Monitoring
- Failed login attempts
- Unusual traffic patterns
- Resource usage spikes
```

### Docker Security

- **Non-Root User**: Run containers as non-root
- **Image Scanning**: Scan for vulnerabilities
- **Secrets Management**: Use Docker secrets or vault
- **Network Isolation**: Separate networks for services

### Secrets Management

```bash
# Environment Variables
- Never commit .env files
- Use .env.example as template
- Rotate secrets regularly

# Production
- Use secret management service (AWS Secrets Manager, Vault)
- Encrypt secrets at rest
- Audit secret access
```

## Monitoring & Logging

### Logging Best Practices

```python
# What to Log
- Authentication attempts (success/failure)
- License activations and validations
- API errors and exceptions
- Payment transactions
- Admin actions

# What NOT to Log
- Passwords or tokens
- Credit card numbers
- Full license tokens (log only last 4 chars)
- PII without anonymization
```

### Error Tracking

- **Sentry**: Capture and track errors
- **Alerts**: Notify on critical errors
- **Context**: Include user ID, request ID, timestamp

### Security Monitoring

- **Failed Logins**: Alert on multiple failures
- **Unusual Patterns**: Detect abnormal license activations
- **API Abuse**: Monitor for scraping or DoS
- **Data Breaches**: Implement breach detection

## Incident Response

### Security Incident Procedure

1. **Detect**: Monitor logs and alerts
2. **Contain**: Isolate affected systems
3. **Investigate**: Determine scope and impact
4. **Remediate**: Fix vulnerability, revoke compromised credentials
5. **Notify**: Inform affected users if required
6. **Document**: Record incident details and lessons learned

### Breach Response

If user data is compromised:
1. Immediately revoke all tokens
2. Force password reset for affected users
3. Notify users within 72 hours (GDPR requirement)
4. Report to authorities if required
5. Conduct security audit

## Compliance

### GDPR (EU)

- **Data Minimization**: Collect only necessary data
- **Right to Access**: Provide data export
- **Right to Deletion**: Implement account deletion
- **Consent**: Explicit consent for data processing
- **Data Portability**: Export in machine-readable format

### PCI DSS (Payments)

- **No Card Storage**: Use Stripe/Razorpay, never store cards
- **Secure Transmission**: HTTPS for all payment data
- **Tokenization**: Use payment provider tokens

## Security Checklist

### Pre-Deployment

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET
- [ ] Enable HTTPS with valid certificate
- [ ] Configure CORS whitelist
- [ ] Set up rate limiting
- [ ] Enable Sentry error tracking
- [ ] Configure database backups
- [ ] Review and restrict firewall rules
- [ ] Disable debug mode in production
- [ ] Remove test/demo accounts

### Post-Deployment

- [ ] Monitor logs for errors
- [ ] Test license activation flow
- [ ] Verify payment webhooks
- [ ] Check SSL certificate expiry
- [ ] Review access logs
- [ ] Test backup restoration
- [ ] Conduct security audit
- [ ] Penetration testing (recommended)

### Ongoing

- [ ] Rotate JWT_SECRET quarterly
- [ ] Update dependencies monthly
- [ ] Review access logs weekly
- [ ] Test backups monthly
- [ ] Security audit annually
- [ ] Renew SSL certificates before expiry

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email: security@yourdomain.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
4. Allow 90 days for fix before public disclosure

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
