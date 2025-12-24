"""
Core configuration for HaderOS Platform
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "HaderOS Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://haderosai.com"
    ]
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://haderos:haderos@localhost:5432/haderos_platform"
    )
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv(
        "KAFKA_BOOTSTRAP_SERVERS",
        "localhost:9092"
    )
    
    # Blockchain
    ETH_RPC_URL: str = os.getenv(
        "ETH_RPC_URL",
        "https://mainnet.infura.io/v3/YOUR-PROJECT-ID"
    )
    POLYGON_RPC_URL: str = os.getenv(
        "POLYGON_RPC_URL",
        "https://polygon-mainnet.infura.io/v3/YOUR-PROJECT-ID"
    )
    CONTRACT_OWNER_ADDRESS: str = os.getenv("CONTRACT_OWNER_ADDRESS", "")
    CONTRACT_OWNER_PRIVATE_KEY: str = os.getenv("CONTRACT_OWNER_PRIVATE_KEY", "")
    
    # ERC-3643 Configuration
    ERC3643_REGISTRY_ADDRESS: str = os.getenv("ERC3643_REGISTRY_ADDRESS", "")
    ERC3643_COMPLIANCE_ADDRESS: str = os.getenv("ERC3643_COMPLIANCE_ADDRESS", "")
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # KAIA Theology Engine
    KAIA_SERVICE_URL: str = os.getenv("KAIA_SERVICE_URL", "http://localhost:8080")
    KAIA_API_KEY: str = os.getenv("KAIA_API_KEY", "")
    THEOLOGY_FIREWALL_ENABLED: bool = True
    
    # Monitoring
    PROMETHEUS_ENABLED: bool = True
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
