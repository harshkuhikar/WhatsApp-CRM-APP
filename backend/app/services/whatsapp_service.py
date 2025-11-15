"""
WhatsApp Business API Service
Handles sending messages via WhatsApp Business API
"""
import requests
import logging
from typing import Dict, List, Optional
from datetime import datetime
from app.config import settings

logger = logging.getLogger(__name__)


class WhatsAppService:
    """Service for sending WhatsApp messages via Business API"""
    
    def __init__(self):
        self.api_version = settings.WHATSAPP_API_VERSION or "v18.0"
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.access_token = settings.WHATSAPP_ACCESS_TOKEN
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authorization"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
    
    def send_template_message(
        self,
        to: str,
        template_name: str,
        language_code: str = "en_US",
        components: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Send a template message
        
        Args:
            to: Recipient phone number (with country code, no +)
            template_name: Name of the approved template
            language_code: Language code (e.g., en_US, es_ES)
            components: Template components (header, body, buttons)
            
        Returns:
            Response from WhatsApp API
        """
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        data = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": language_code
                }
            }
        }
        
        # Add components if provided (for variables in template)
        if components:
            data["template"]["components"] = components
        
        try:
            response = requests.post(
                url,
                headers=self._get_headers(),
                json=data,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Template message sent to {to}: {result}")
            return {
                "success": True,
                "message_id": result.get("messages", [{}])[0].get("id"),
                "response": result
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send template message to {to}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "response": getattr(e.response, 'json', lambda: {})()
            }
    
    def send_text_message(
        self,
        to: str,
        message: str,
        preview_url: bool = False
    ) -> Dict:
        """
        Send a text message
        
        Args:
            to: Recipient phone number
            message: Message text
            preview_url: Enable URL preview
            
        Returns:
            Response from WhatsApp API
        """
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        data = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {
                "preview_url": preview_url,
                "body": message
            }
        }
        
        try:
            response = requests.post(
                url,
                headers=self._get_headers(),
                json=data,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Text message sent to {to}: {result}")
            return {
                "success": True,
                "message_id": result.get("messages", [{}])[0].get("id"),
                "response": result
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send text message to {to}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "response": getattr(e.response, 'json', lambda: {})()
            }
    
    def send_media_message(
        self,
        to: str,
        media_type: str,
        media_url: str,
        caption: Optional[str] = None
    ) -> Dict:
        """
        Send a media message (image, video, document)
        
        Args:
            to: Recipient phone number
            media_type: Type of media (image, video, document, audio)
            media_url: URL of the media file
            caption: Optional caption for the media
            
        Returns:
            Response from WhatsApp API
        """
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        data = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": media_type,
            media_type: {
                "link": media_url
            }
        }
        
        # Add caption if provided
        if caption and media_type in ["image", "video", "document"]:
            data[media_type]["caption"] = caption
        
        try:
            response = requests.post(
                url,
                headers=self._get_headers(),
                json=data,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Media message sent to {to}: {result}")
            return {
                "success": True,
                "message_id": result.get("messages", [{}])[0].get("id"),
                "response": result
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send media message to {to}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "response": getattr(e.response, 'json', lambda: {})()
            }
    
    def send_campaign_message(
        self,
        to: str,
        template_name: str,
        variables: Dict[str, str],
        language_code: str = "en_US"
    ) -> Dict:
        """
        Send a campaign message with variables
        
        Args:
            to: Recipient phone number
            template_name: Name of the template
            variables: Dictionary of variables to replace
            language_code: Language code
            
        Returns:
            Response from WhatsApp API
        """
        # Build components with variables
        components = []
        
        if variables:
            body_parameters = [
                {"type": "text", "text": value}
                for value in variables.values()
            ]
            
            components.append({
                "type": "body",
                "parameters": body_parameters
            })
        
        return self.send_template_message(
            to=to,
            template_name=template_name,
            language_code=language_code,
            components=components
        )
    
    def get_message_status(self, message_id: str) -> Dict:
        """
        Get the status of a sent message
        
        Args:
            message_id: WhatsApp message ID
            
        Returns:
            Message status information
        """
        # Note: WhatsApp uses webhooks for status updates
        # This is a placeholder for webhook handling
        return {
            "message_id": message_id,
            "status": "sent",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def validate_phone_number(self, phone: str) -> bool:
        """
        Validate phone number format
        
        Args:
            phone: Phone number to validate
            
        Returns:
            True if valid, False otherwise
        """
        # Remove common separators
        cleaned = phone.replace("+", "").replace("-", "").replace(" ", "")
        
        # Check if it's numeric and has reasonable length
        return cleaned.isdigit() and 10 <= len(cleaned) <= 15
    
    def format_phone_number(self, phone: str) -> str:
        """
        Format phone number for WhatsApp API
        
        Args:
            phone: Phone number with or without country code
            
        Returns:
            Formatted phone number (no + sign)
        """
        # Remove all non-numeric characters
        cleaned = ''.join(filter(str.isdigit, phone))
        
        # Ensure it starts with country code
        # If it doesn't have country code, you might want to add default
        return cleaned


# Create singleton instance
whatsapp_service = WhatsAppService()
