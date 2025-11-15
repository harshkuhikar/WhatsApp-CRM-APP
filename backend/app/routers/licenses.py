from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from jose import jwt
import uuid
import secrets
from app.database import get_db
from app.models import User, License, Device, LicenseStatus, Reseller
from app.auth import get_current_user, get_current_admin, get_current_reseller
from app.config import settings

router = APIRouter()


class GenerateLicenseRequest(BaseModel):
    owner_email: EmailStr
    plan: str
    days: int
    max_devices: int = 1
    reseller_id: Optional[int] = None


class ActivateLicenseRequest(BaseModel):
    token: str
    hwid: str
    device_info: dict = {}


class ValidateLicenseRequest(BaseModel):
    token: str
    hwid: str


def generate_human_key() -> str:
    """Generate human-readable license key"""
    parts = [secrets.token_hex(2).upper() for _ in range(4)]
    return f"LFT-{'-'.join(parts)}"


def create_license_token(license_id: str, owner_email: str, plan: str, expires_at: datetime, max_devices: int) -> str:
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


def decode_license_token(token: str) -> dict:
    """Decode and validate license token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "license":
            raise ValueError("Invalid token type")
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid license token: {str(e)}")


@router.post("/generate")
async def generate_license(
    request: GenerateLicenseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_reseller)
):
    """Generate a new license (admin/reseller only)"""
    
    # Check reseller quota
    if current_user.role.value == "reseller":
        reseller = db.query(Reseller).filter(Reseller.user_id == current_user.id).first()
        if not reseller:
            raise HTTPException(status_code=403, detail="Reseller profile not found")
        if reseller.used_quota >= reseller.quota:
            raise HTTPException(status_code=403, detail="Reseller quota exceeded")
        reseller.used_quota += 1
        reseller_id = reseller.id
    else:
        reseller_id = request.reseller_id
    
    # Create license
    license_id = uuid.uuid4()
    expires_at = datetime.utcnow() + timedelta(days=request.days)
    
    token = create_license_token(
        license_id=license_id,
        owner_email=request.owner_email,
        plan=request.plan,
        expires_at=expires_at,
        max_devices=request.max_devices
    )
    
    human_key = generate_human_key()
    
    license = License(
        id=license_id,
        token=token,
        human_key=human_key,
        owner_email=request.owner_email,
        plan=request.plan,
        status=LicenseStatus.ACTIVE,
        expires_at=expires_at,
        max_devices=request.max_devices,
        reseller_id=reseller_id
    )
    
    db.add(license)
    db.commit()
    db.refresh(license)
    
    return {
        "license_id": str(license.id),
        "token": token,
        "human_key": human_key,
        "owner_email": request.owner_email,
        "plan": request.plan,
        "expires_at": expires_at.isoformat(),
        "max_devices": request.max_devices
    }


@router.post("/activate")
async def activate_license(
    request: ActivateLicenseRequest,
    db: Session = Depends(get_db)
):
    """Activate license on a device"""
    
    # Decode token
    payload = decode_license_token(request.token)
    license_id = payload["license_id"]
    
    # Get license from DB
    license = db.query(License).filter(License.id == license_id).first()
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    # Check status
    if license.status == LicenseStatus.REVOKED:
        raise HTTPException(status_code=403, detail="License has been revoked")
    
    if license.status == LicenseStatus.EXPIRED or datetime.utcnow() > license.expires_at:
        license.status = LicenseStatus.EXPIRED
        db.commit()
        raise HTTPException(status_code=403, detail="License has expired")
    
    # Check if device already activated
    existing_device = db.query(Device).filter(
        Device.license_id == license.id,
        Device.hwid == request.hwid
    ).first()
    
    if existing_device:
        # Update last seen
        existing_device.last_seen = datetime.utcnow()
        db.commit()
    else:
        # Check device limit
        device_count = db.query(Device).filter(Device.license_id == license.id).count()
        if device_count >= license.max_devices:
            raise HTTPException(status_code=403, detail="Maximum devices limit reached")
        
        # Create new device
        device = Device(
            license_id=license.id,
            hwid=request.hwid,
            device_info=request.device_info
        )
        db.add(device)
        
        # Bind HWID to license if first device
        if not license.hwid:
            license.hwid = request.hwid
    
    # Update last validated
    license.last_validated = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "license_id": str(license.id),
        "plan": license.plan,
        "expires_at": license.expires_at.isoformat(),
        "max_devices": license.max_devices,
        "offline_days": settings.LICENSE_OFFLINE_DAYS
    }


@router.post("/validate")
async def validate_license(
    request: ValidateLicenseRequest,
    db: Session = Depends(get_db)
):
    """Validate license (periodic check)"""
    
    # Decode token
    payload = decode_license_token(request.token)
    license_id = payload["license_id"]
    
    # Get license
    license = db.query(License).filter(License.id == license_id).first()
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    # Check status
    if license.status == LicenseStatus.REVOKED:
        raise HTTPException(status_code=403, detail="License revoked")
    
    if datetime.utcnow() > license.expires_at:
        license.status = LicenseStatus.EXPIRED
        db.commit()
        raise HTTPException(status_code=403, detail="License expired")
    
    # Verify device
    device = db.query(Device).filter(
        Device.license_id == license.id,
        Device.hwid == request.hwid
    ).first()
    
    if not device:
        raise HTTPException(status_code=403, detail="Device not activated")
    
    # Update timestamps
    device.last_seen = datetime.utcnow()
    license.last_validated = datetime.utcnow()
    db.commit()
    
    return {
        "valid": True,
        "status": license.status.value,
        "expires_at": license.expires_at.isoformat(),
        "plan": license.plan
    }


@router.post("/revoke/{license_id}")
async def revoke_license(
    license_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Revoke a license (admin only)"""
    
    license = db.query(License).filter(License.id == license_id).first()
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    license.status = LicenseStatus.REVOKED
    db.commit()
    
    return {"success": True, "message": "License revoked"}


@router.post("/extend/{license_id}")
async def extend_license(
    license_id: str,
    days: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Extend license expiry (admin only)"""
    
    license = db.query(License).filter(License.id == license_id).first()
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    license.expires_at = license.expires_at + timedelta(days=days)
    
    # Regenerate token with new expiry
    license.token = create_license_token(
        license_id=license.id,
        owner_email=license.owner_email,
        plan=license.plan,
        expires_at=license.expires_at,
        max_devices=license.max_devices
    )
    
    db.commit()
    
    return {
        "success": True,
        "new_token": license.token,
        "expires_at": license.expires_at.isoformat()
    }


@router.get("/{license_id}")
async def get_license(
    license_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get license details"""
    
    license = db.query(License).filter(License.id == license_id).first()
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    # Check permissions
    if current_user.role.value == "user" and license.owner_email != current_user.email:
        raise HTTPException(status_code=403, detail="Access denied")
    
    devices = db.query(Device).filter(Device.license_id == license.id).all()
    
    return {
        "id": str(license.id),
        "human_key": license.human_key,
        "owner_email": license.owner_email,
        "plan": license.plan,
        "status": license.status.value,
        "issued_at": license.issued_at.isoformat(),
        "expires_at": license.expires_at.isoformat(),
        "last_validated": license.last_validated.isoformat() if license.last_validated else None,
        "max_devices": license.max_devices,
        "devices": [
            {
                "hwid": d.hwid,
                "activated_at": d.activated_at.isoformat(),
                "last_seen": d.last_seen.isoformat()
            } for d in devices
        ]
    }
