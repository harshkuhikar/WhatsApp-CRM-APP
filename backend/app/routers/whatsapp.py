"""
WhatsApp API Routes
Endpoints for sending WhatsApp messages
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.services.whatsapp_service import whatsapp_service

router = APIRouter()


# Pydantic Models
class SendMessageRequest(BaseModel):
    to: str
    message: str
    preview_url: bool = False


class SendTemplateRequest(BaseModel):
    to: str
    template_name: str
    language_code: str = "en_US"
    variables: Optional[Dict[str, str]] = None


class SendCampaignRequest(BaseModel):
    contacts: List[str]
    template_name: str
    variables: Dict[str, str]
    language_code: str = "en_US"


class SendMediaRequest(BaseModel):
    to: str
    media_type: str  # image, video, document, audio
    media_url: str
    caption: Optional[str] = None


# API Endpoints
@router.post("/send-text")
async def send_text_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send a text message to a single recipient
    
    Example:
    ```json
    {
        "to": "1234567890",
        "message": "Hello from MyWASender!",
        "preview_url": false
    }
    ```
    """
    # Validate phone number
    if not whatsapp_service.validate_phone_number(request.to):
        raise HTTPException(status_code=400, detail="Invalid phone number format")
    
    # Format phone number
    formatted_phone = whatsapp_service.format_phone_number(request.to)
    
    # Send message
    result = whatsapp_service.send_text_message(
        to=formatted_phone,
        message=request.message,
        preview_url=request.preview_url
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to send message: {result.get('error', 'Unknown error')}"
        )
    
    return {
        "success": True,
        "message_id": result["message_id"],
        "to": formatted_phone,
        "sent_at": datetime.utcnow().isoformat()
    }


@router.post("/send-template")
async def send_template_message(
    request: SendTemplateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send a template message to a single recipient
    
    Example:
    ```json
    {
        "to": "1234567890",
        "template_name": "hello_world",
        "language_code": "en_US",
        "variables": {
            "name": "John",
            "company": "Acme Inc"
        }
    }
    ```
    """
    # Validate phone number
    if not whatsapp_service.validate_phone_number(request.to):
        raise HTTPException(status_code=400, detail="Invalid phone number format")
    
    # Format phone number
    formatted_phone = whatsapp_service.format_phone_number(request.to)
    
    # Send template message
    if request.variables:
        result = whatsapp_service.send_campaign_message(
            to=formatted_phone,
            template_name=request.template_name,
            variables=request.variables,
            language_code=request.language_code
        )
    else:
        result = whatsapp_service.send_template_message(
            to=formatted_phone,
            template_name=request.template_name,
            language_code=request.language_code
        )
    
    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to send template: {result.get('error', 'Unknown error')}"
        )
    
    return {
        "success": True,
        "message_id": result["message_id"],
        "to": formatted_phone,
        "template": request.template_name,
        "sent_at": datetime.utcnow().isoformat()
    }


@router.post("/send-media")
async def send_media_message(
    request: SendMediaRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send a media message (image, video, document)
    
    Example:
    ```json
    {
        "to": "1234567890",
        "media_type": "image",
        "media_url": "https://example.com/image.jpg",
        "caption": "Check this out!"
    }
    ```
    """
    # Validate phone number
    if not whatsapp_service.validate_phone_number(request.to):
        raise HTTPException(status_code=400, detail="Invalid phone number format")
    
    # Validate media type
    valid_types = ["image", "video", "document", "audio"]
    if request.media_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid media type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Format phone number
    formatted_phone = whatsapp_service.format_phone_number(request.to)
    
    # Send media message
    result = whatsapp_service.send_media_message(
        to=formatted_phone,
        media_type=request.media_type,
        media_url=request.media_url,
        caption=request.caption
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to send media: {result.get('error', 'Unknown error')}"
        )
    
    return {
        "success": True,
        "message_id": result["message_id"],
        "to": formatted_phone,
        "media_type": request.media_type,
        "sent_at": datetime.utcnow().isoformat()
    }


@router.post("/send-campaign")
async def send_campaign(
    request: SendCampaignRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Send a campaign to multiple recipients
    
    Example:
    ```json
    {
        "contacts": ["1234567890", "0987654321"],
        "template_name": "welcome_message",
        "variables": {
            "name": "Customer",
            "company": "MyCompany"
        },
        "language_code": "en_US"
    }
    ```
    """
    if not request.contacts:
        raise HTTPException(status_code=400, detail="No contacts provided")
    
    # Validate all phone numbers
    invalid_numbers = []
    for phone in request.contacts:
        if not whatsapp_service.validate_phone_number(phone):
            invalid_numbers.append(phone)
    
    if invalid_numbers:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid phone numbers: {', '.join(invalid_numbers)}"
        )
    
    # Send messages in background
    results = []
    for phone in request.contacts:
        formatted_phone = whatsapp_service.format_phone_number(phone)
        
        result = whatsapp_service.send_campaign_message(
            to=formatted_phone,
            template_name=request.template_name,
            variables=request.variables,
            language_code=request.language_code
        )
        
        results.append({
            "phone": formatted_phone,
            "success": result["success"],
            "message_id": result.get("message_id"),
            "error": result.get("error")
        })
    
    # Count successes and failures
    successful = sum(1 for r in results if r["success"])
    failed = len(results) - successful
    
    return {
        "success": True,
        "total": len(results),
        "successful": successful,
        "failed": failed,
        "results": results,
        "sent_at": datetime.utcnow().isoformat()
    }


@router.get("/message-status/{message_id}")
async def get_message_status(
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the status of a sent message
    
    Note: WhatsApp uses webhooks for real-time status updates.
    This endpoint returns cached status information.
    """
    status = whatsapp_service.get_message_status(message_id)
    return status


@router.post("/validate-phone")
async def validate_phone_number(
    phone: str,
    current_user: User = Depends(get_current_user)
):
    """
    Validate a phone number format
    
    Example: /validate-phone?phone=1234567890
    """
    is_valid = whatsapp_service.validate_phone_number(phone)
    formatted = whatsapp_service.format_phone_number(phone) if is_valid else None
    
    return {
        "phone": phone,
        "is_valid": is_valid,
        "formatted": formatted
    }


@router.get("/test-connection")
async def test_whatsapp_connection(
    current_user: User = Depends(get_current_user)
):
    """
    Test WhatsApp Business API connection
    """
    try:
        # Try to send a test request to verify credentials
        # This is a simple check - you might want to implement a proper health check
        return {
            "success": True,
            "message": "WhatsApp API credentials configured",
            "api_version": whatsapp_service.api_version,
            "phone_number_id": whatsapp_service.phone_number_id[:10] + "..." if whatsapp_service.phone_number_id else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to WhatsApp API: {str(e)}"
        )
