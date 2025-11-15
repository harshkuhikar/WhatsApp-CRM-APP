from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, License, Payment, Campaign, Reseller, UserRole, LicenseStatus, PaymentStatus
from app.auth import get_current_admin, get_password_hash

router = APIRouter()


class CreateResellerRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    commission_percent: float = 10.0
    quota: int = 100


@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get admin dashboard statistics"""
    
    # User stats
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # License stats
    total_licenses = db.query(License).count()
    active_licenses = db.query(License).filter(License.status == LicenseStatus.ACTIVE).count()
    expired_licenses = db.query(License).filter(License.status == LicenseStatus.EXPIRED).count()
    
    # Revenue stats
    total_revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.status == PaymentStatus.COMPLETED
    ).scalar() or 0
    
    monthly_revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.status == PaymentStatus.COMPLETED,
        Payment.created_at >= datetime.utcnow() - timedelta(days=30)
    ).scalar() or 0
    
    # Campaign stats
    total_campaigns = db.query(Campaign).count()
    
    # Recent activations (last 7 days)
    recent_activations = db.query(License).filter(
        License.issued_at >= datetime.utcnow() - timedelta(days=7)
    ).count()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "licenses": {
            "total": total_licenses,
            "active": active_licenses,
            "expired": expired_licenses,
            "recent_activations": recent_activations
        },
        "revenue": {
            "total": float(total_revenue),
            "monthly": float(monthly_revenue)
        },
        "campaigns": {
            "total": total_campaigns
        }
    }


@router.get("/licenses")
async def list_licenses(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """List all licenses with filters"""
    
    query = db.query(License)
    
    if status:
        query = query.filter(License.status == LicenseStatus(status))
    
    if search:
        query = query.filter(
            (License.owner_email.ilike(f"%{search}%")) |
            (License.human_key.ilike(f"%{search}%"))
        )
    
    total = query.count()
    licenses = query.order_by(License.issued_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "licenses": [
            {
                "id": str(lic.id),
                "human_key": lic.human_key,
                "owner_email": lic.owner_email,
                "plan": lic.plan,
                "status": lic.status.value,
                "issued_at": lic.issued_at.isoformat(),
                "expires_at": lic.expires_at.isoformat(),
                "max_devices": lic.max_devices
            } for lic in licenses
        ]
    }


@router.post("/resellers")
async def create_reseller(
    request: CreateResellerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create a new reseller account"""
    
    # Check if user exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=UserRole.RESELLER
    )
    db.add(user)
    db.flush()
    
    # Create reseller profile
    reseller = Reseller(
        user_id=user.id,
        name=request.name,
        commission_percent=request.commission_percent,
        quota=request.quota
    )
    db.add(reseller)
    db.commit()
    db.refresh(reseller)
    
    return {
        "id": reseller.id,
        "user_id": user.id,
        "email": user.email,
        "name": reseller.name,
        "commission_percent": float(reseller.commission_percent),
        "quota": reseller.quota
    }


@router.get("/resellers")
async def list_resellers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """List all resellers"""
    
    resellers = db.query(Reseller).join(User).all()
    
    return {
        "resellers": [
            {
                "id": r.id,
                "name": r.name,
                "email": r.user.email,
                "commission_percent": float(r.commission_percent),
                "quota": r.quota,
                "used_quota": r.used_quota,
                "created_at": r.created_at.isoformat()
            } for r in resellers
        ]
    }


@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """List all users"""
    
    total = db.query(User).count()
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "role": u.role.value,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
                "last_login": u.last_login.isoformat() if u.last_login else None
            } for u in users
        ]
    }


@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Toggle user active status"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "id": user.id,
        "email": user.email,
        "is_active": user.is_active
    }
