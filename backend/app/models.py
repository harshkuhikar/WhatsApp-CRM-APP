from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Numeric, JSON, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import uuid as uuid_lib
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid
import enum


class UserRole(str, enum.Enum):
    USER = "user"
    RESELLER = "reseller"
    ADMIN = "admin"


class LicenseStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    PENDING = "pending"


class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"


class MessageStatus(str, enum.Enum):
    QUEUED = "queued"
    SENDING = "sending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
    
    licenses = relationship("License", back_populates="owner", foreign_keys="License.owner_id")
    campaigns = relationship("Campaign", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    reseller_profile = relationship("Reseller", back_populates="user", uselist=False)


class Reseller(Base):
    __tablename__ = "resellers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    commission_percent = Column(Numeric(5, 2), default=10.0)
    quota = Column(Integer, default=100)
    used_quota = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="reseller_profile")
    licenses = relationship("License", back_populates="reseller", foreign_keys="License.reseller_id")


class License(Base):
    __tablename__ = "licenses"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid_lib.uuid4()))
    token = Column(Text, unique=True, nullable=False)
    human_key = Column(String(50), unique=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner_email = Column(String(255), nullable=False, index=True)
    plan = Column(String(50), nullable=False)
    status = Column(SQLEnum(LicenseStatus), default=LicenseStatus.ACTIVE, nullable=False, index=True)
    hwid = Column(String(255), index=True)
    max_devices = Column(Integer, default=1)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_validated = Column(DateTime(timezone=True))
    reseller_id = Column(Integer, ForeignKey("resellers.id"))
    meta_data = Column(JSON, default={})
    
    owner = relationship("User", back_populates="licenses", foreign_keys=[owner_id])
    reseller = relationship("Reseller", back_populates="licenses", foreign_keys=[reseller_id])
    devices = relationship("Device", back_populates="license")
    campaigns = relationship("Campaign", back_populates="license")


class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    license_id = Column(String(36), ForeignKey("licenses.id"), nullable=False)
    hwid = Column(String(255), nullable=False, index=True)
    device_info = Column(JSON, default={})
    activated_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    
    license = relationship("License", back_populates="devices")


class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    license_id = Column(String(36), ForeignKey("licenses.id"))
    name = Column(String(255), nullable=False)
    template = Column(Text, nullable=False)
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    scheduled_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    settings = Column(JSON, default={})
    
    user = relationship("User", back_populates="campaigns")
    license = relationship("License", back_populates="campaigns")
    contacts = relationship("Contact", back_populates="campaign")
    logs = relationship("Log", back_populates="campaign")


class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    name = Column(String(255))
    phone = Column(String(50), nullable=False)
    custom = Column(JSON, default={})
    status = Column(SQLEnum(MessageStatus), default=MessageStatus.QUEUED, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    campaign = relationship("Campaign", back_populates="contacts")
    logs = relationship("Log", back_populates="contact")


class Log(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    status = Column(SQLEnum(MessageStatus), nullable=False)
    detail = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    campaign = relationship("Campaign", back_populates="logs")
    contact = relationship("Contact", back_populates="logs")


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String(50), nullable=False)
    provider_payment_id = Column(String(255), unique=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    plan = Column(String(50))
    meta_data = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    user = relationship("User", back_populates="payments")
