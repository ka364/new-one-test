"""
Database seeding utilities
"""

from sqlalchemy.orm import Session
from backend.core.models import User


def seed_super_admin(db: Session):
    """Create default super admin user if it doesn't exist"""
    
    # Check if admin already exists
    admin_user = db.query(User).filter(User.username == "OShader").first()
    
    if admin_user:
        # Update password to ensure it's correct
        admin_user.set_password("Os@2030")
        db.commit()
        return admin_user
    
    # Create super admin user
    admin_user = User(
        username="OShader",
        email="oshader@haderos.local",
        full_name="OShader Administrator",
        role="super_admin",
        is_active=True,
        is_verified=True
    )
    admin_user.set_password("Os@2030")
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    return admin_user


def seed_all(db: Session):
    """Seed all database data"""
    super_admin = seed_super_admin(db)
    print(f"✅ Super Admin created: username='OShader' password='Os@2030'")
    return super_admin
