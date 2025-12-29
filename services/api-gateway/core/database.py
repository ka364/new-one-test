"""
Database configuration and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import redis.asyncio as redis

from services.api_gateway.core.config import settings

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Redis connection
_redis_client = None


async def get_redis() -> redis.Redis:
    """Get Redis client instance"""
    global _redis_client
    if _redis_client is None:
        redis_url = getattr(settings, 'REDIS_URL', 'redis://localhost:6379')
        _redis_client = redis.from_url(redis_url, decode_responses=True)
    return _redis_client


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session

    Usage in FastAPI:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def drop_db() -> None:
    """Drop all database tables (use with caution!)"""
    Base.metadata.drop_all(bind=engine)
