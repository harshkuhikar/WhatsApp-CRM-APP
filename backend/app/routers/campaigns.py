from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import csv
import io
from app.database import get_db
from app.models import User, Campaign, Contact, Log, CampaignStatus, MessageStatus
from app.auth import get_current_user

router = APIRouter()


class CreateCampaignRequest(BaseModel):
    name: str
    template: str
    scheduled_at: Optional[datetime] = None
    settings: dict = {}


class ContactData(BaseModel):
    name: Optional[str]
    phone: str
    custom: dict = {}


@router.get("")
async def list_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all campaigns for current user"""
    
    campaigns = db.query(Campaign).filter(
        Campaign.user_id == current_user.id
    ).order_by(Campaign.created_at.desc()).all()
    
    return [
        {
            "id": campaign.id,
            "name": campaign.name,
            "status": campaign.status.value,
            "template": campaign.template,
            "created_at": campaign.created_at.isoformat(),
            "scheduled_at": campaign.scheduled_at.isoformat() if campaign.scheduled_at else None,
            "started_at": campaign.started_at.isoformat() if campaign.started_at else None,
            "completed_at": campaign.completed_at.isoformat() if campaign.completed_at else None,
            "settings": campaign.settings
        } for campaign in campaigns
    ]


@router.post("")
async def create_campaign(
    request: CreateCampaignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new campaign"""
    
    campaign = Campaign(
        user_id=current_user.id,
        name=request.name,
        template=request.template,
        scheduled_at=request.scheduled_at,
        settings=request.settings,
        status=CampaignStatus.DRAFT
    )
    
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    
    return {
        "id": campaign.id,
        "name": campaign.name,
        "status": campaign.status.value,
        "template": campaign.template,
        "created_at": campaign.created_at.isoformat(),
        "settings": campaign.settings
    }


@router.post("/{campaign_id}/contacts")
async def add_contacts(
    campaign_id: int,
    contacts: List[ContactData],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add contacts to campaign"""
    
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Add contacts
    for contact_data in contacts:
        contact = Contact(
            campaign_id=campaign.id,
            name=contact_data.name,
            phone=contact_data.phone,
            custom=contact_data.custom
        )
        db.add(contact)
    
    db.commit()
    
    return {"success": True, "count": len(contacts)}


@router.post("/{campaign_id}/import-csv")
async def import_csv(
    campaign_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import contacts from CSV"""
    
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Read CSV
    content = await file.read()
    csv_file = io.StringIO(content.decode('utf-8'))
    reader = csv.DictReader(csv_file)
    
    count = 0
    for row in reader:
        if 'phone' not in row:
            continue
        
        contact = Contact(
            campaign_id=campaign.id,
            name=row.get('name'),
            phone=row['phone'],
            custom={k: v for k, v in row.items() if k not in ['name', 'phone']}
        )
        db.add(contact)
        count += 1
    
    db.commit()
    
    return {"success": True, "imported": count}


@router.get("/{campaign_id}/status")
async def get_campaign_status(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get campaign status and statistics"""
    
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get contact statistics
    total = db.query(Contact).filter(Contact.campaign_id == campaign.id).count()
    queued = db.query(Contact).filter(
        Contact.campaign_id == campaign.id,
        Contact.status == MessageStatus.QUEUED
    ).count()
    sent = db.query(Contact).filter(
        Contact.campaign_id == campaign.id,
        Contact.status == MessageStatus.SENT
    ).count()
    failed = db.query(Contact).filter(
        Contact.campaign_id == campaign.id,
        Contact.status == MessageStatus.FAILED
    ).count()
    
    return {
        "id": campaign.id,
        "name": campaign.name,
        "status": campaign.status.value,
        "created_at": campaign.created_at.isoformat(),
        "started_at": campaign.started_at.isoformat() if campaign.started_at else None,
        "completed_at": campaign.completed_at.isoformat() if campaign.completed_at else None,
        "statistics": {
            "total": total,
            "queued": queued,
            "sent": sent,
            "failed": failed,
            "progress": round((sent + failed) / total * 100, 2) if total > 0 else 0
        }
    }


@router.get("/{campaign_id}/report")
async def get_campaign_report(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed campaign report"""
    
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    contacts = db.query(Contact).filter(Contact.campaign_id == campaign.id).all()
    
    report = []
    for contact in contacts:
        logs = db.query(Log).filter(Log.contact_id == contact.id).order_by(Log.timestamp.desc()).all()
        
        report.append({
            "name": contact.name,
            "phone": contact.phone,
            "status": contact.status.value,
            "custom": contact.custom,
            "logs": [
                {
                    "status": log.status.value,
                    "detail": log.detail,
                    "timestamp": log.timestamp.isoformat()
                } for log in logs
            ]
        })
    
    return {
        "campaign": {
            "id": campaign.id,
            "name": campaign.name,
            "status": campaign.status.value
        },
        "contacts": report
    }


@router.post("/{campaign_id}/start")
async def start_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start campaign execution"""
    
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.PAUSED]:
        raise HTTPException(status_code=400, detail="Campaign cannot be started")
    
    campaign.status = CampaignStatus.RUNNING
    campaign.started_at = datetime.utcnow()
    db.commit()
    
    # TODO: Queue campaign for sending worker
    
    return {"success": True, "status": campaign.status.value}


@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Pause campaign execution"""
    
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.status != CampaignStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Campaign is not running")
    
    campaign.status = CampaignStatus.PAUSED
    db.commit()
    
    return {"success": True, "status": campaign.status.value}


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a campaign"""
    
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Delete associated contacts and logs
    db.query(Contact).filter(Contact.campaign_id == campaign_id).delete()
    db.query(Log).filter(Log.campaign_id == campaign_id).delete()
    
    # Delete campaign
    db.delete(campaign)
    db.commit()
    
    return {"success": True, "message": "Campaign deleted successfully"}


@router.get("/{campaign_id}/contacts")
async def get_campaign_contacts(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all contacts for a campaign"""
    
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    contacts = db.query(Contact).filter(Contact.campaign_id == campaign_id).all()
    
    return [
        {
            "id": contact.id,
            "name": contact.name,
            "phone": contact.phone,
            "custom": contact.custom,
            "status": contact.status.value,
            "created_at": contact.created_at.isoformat()
        } for contact in contacts
    ]
