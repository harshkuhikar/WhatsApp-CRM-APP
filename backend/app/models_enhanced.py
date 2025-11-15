"""Enhanced models for Template and Campaign system with 90+ features"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Template(Base):
    """Template model with versioning and analytics"""
    __tablename__ = "templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    message_body = Column(Text, nullable=False)
    variables = Column(JSON, default=[])  # Extracted variables
    attachments = Column(JSON, default=[])  # File paths
    character_count = Column(Integer, default=0)
    segment_count = Column(Integer, default=1)  # WhatsApp segments
    is_draft = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)  # Soft delete
    tags = Column(JSON, default=[])
    author_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    usage_count = Column(Integer, default=0)  # How many campaigns used this
    
    # Relationships
    author = relationship("User", foreign_keys=[author_id])
    versions = relationship("TemplateVersion", back_populates="template", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="template")


class TemplateVersion(Base):
    """Template version history"""
    __tablename__ = "template_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    message_body = Column(Text, nullable=False)
    variables = Column(JSON, default=[])
    attachments = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    template = relationship("Template", back_populates="versions")
    creator = relationship("User", foreign_keys=[created_by])


class CampaignEnhanced(Base):
    """Enhanced Campaign model"""
    __tablename__ = "campaigns_enhanced"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"))
    template_version_id = Column(Integer, ForeignKey("template_versions.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Campaign settings
    status = Column(String(50), default="draft", index=True)
    scheduled_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    paused_at = Column(DateTime(timezone=True))
    
    # Sending configuration
    delay_min = Column(Integer, default=1)  # seconds
    delay_max = Column(Integer, default=5)  # seconds
    random_delay = Column(Boolean, default=True)
    messages_per_minute = Column(Integer, default=10)
    
    # Statistics
    total_contacts = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    pending_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    
    # Metadata
    estimated_completion_time = Column(Integer)  # minutes
    variable_mapping = Column(JSON, default={})  # CSV column to variable mapping
    is_draft = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    template = relationship("Template", back_populates="campaigns")
    template_version = relationship("TemplateVersion", foreign_keys=[template_version_id])
    user = relationship("User")
    contacts = relationship("CampaignContact", back_populates="campaign", cascade="all, delete-orphan")
    logs = relationship("CampaignLog", back_populates="campaign", cascade="all, delete-orphan")


class CampaignContact(Base):
    """Campaign contacts with personalized data"""
    __tablename__ = "campaign_contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns_enhanced.id"), nullable=False)
    name = Column(String(255))
    phone = Column(String(50), nullable=False)
    variables = Column(JSON, default={})  # Personalized variables
    status = Column(String(50), default="pending", index=True)
    personalized_message = Column(Text)  # Message with variables replaced
    sent_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    failed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    
    # Relationships
    campaign = relationship("CampaignEnhanced", back_populates="contacts")
    logs = relationship("CampaignLog", back_populates="contact")


class CampaignLog(Base):
    """Real-time campaign logs"""
    __tablename__ = "campaign_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns_enhanced.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("campaign_contacts.id"))
    log_type = Column(String(50), nullable=False)  # info, success, error, warning
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    metadata = Column(JSON, default={})
    
    # Relationships
    campaign = relationship("CampaignEnhanced", back_populates="logs")
    contact = relationship("CampaignContact", back_populates="logs")


class FileAttachment(Base):
    """File attachments for templates"""
    __tablename__ = "file_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"))
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # image, document, video, pdf
    file_size = Column(Integer, nullable=False)  # bytes
    mime_type = Column(String(100))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    template = relationship("Template")
    uploader = relationship("User", foreign_keys=[uploaded_by])
