from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./test.db"
    
    # Redis
    REDIS_URL: str
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # License
    LICENSE_OFFLINE_DAYS: int = 7
    MAX_DEVICES_DEFAULT: int = 1
    
    # SMTP
    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM: str
    
    # Payments
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    
    # Sending Worker
    SENDING_WORKER_URL: str = "http://localhost:3001"
    
    # Security
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Monitoring
    SENTRY_DSN: str = ""
    
    # Environment
    ENVIRONMENT: str = "development"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
