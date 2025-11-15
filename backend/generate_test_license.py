"""Generate a test license for immediate use"""
import sys
from datetime import datetime, timedelta
from jose import jwt
from app.config import settings
from app.database import SessionLocal
from app.models import License, LicenseStatus
import uuid
import secrets

def generate_human_key():
    """Generate human-readable license key"""
    parts = [secrets.token_hex(2).upper() for _ in range(4)]
    return f"LFT-{'-'.join(parts)}"

def create_license_token(license_id, owner_email, plan, expires_at, max_devices):
    """Create JWT license token"""
    payload = {
        "license_id": str(license_id),
        "owner_email": owner_email,
        "plan": plan,
        "issued_at": datetime.utcnow().isoformat(),
        "expires_at": expires_at.isoformat(),
        "max_devices": max_devices,
        "type": "license"
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

# Create license
db = SessionLocal()

license_id = str(uuid.uuid4())
expires_at = datetime.utcnow() + timedelta(days=365)
owner_email = "test@example.com"
plan = "premium"
max_devices = 3

token = create_license_token(
    license_id=license_id,
    owner_email=owner_email,
    plan=plan,
    expires_at=expires_at,
    max_devices=max_devices
)

human_key = generate_human_key()

license = License(
    id=license_id,
    token=token,
    human_key=human_key,
    owner_email=owner_email,
    plan=plan,
    status=LicenseStatus.ACTIVE,
    expires_at=expires_at,
    max_devices=max_devices
)

db.add(license)
db.commit()
db.close()

print("\n" + "="*80)
print("✅ TEST LICENSE GENERATED SUCCESSFULLY!")
print("="*80)
print(f"\n📋 License Details:")
print(f"   Owner: {owner_email}")
print(f"   Plan: {plan}")
print(f"   Expires: {expires_at.strftime('%Y-%m-%d')}")
print(f"   Max Devices: {max_devices}")
print(f"\n🔑 Human-Readable Key:")
print(f"   {human_key}")
print(f"\n🎫 JWT Token (copy this entire token):")
print(f"   {token}")
print("\n" + "="*80)
print("📝 COPY THE TOKEN ABOVE AND PASTE IT IN THE ACTIVATION SCREEN")
print("="*80)
print("\nNote: You can use either the human-readable key OR the full JWT token")
print("      The JWT token is recommended for testing.\n")
