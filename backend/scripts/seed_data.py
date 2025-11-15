"""Seed database with initial data"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models import User, UserRole
from app.auth import get_password_hash


def seed_admin():
    db = SessionLocal()
    
    # Check if admin exists
    admin = db.query(User).filter(User.email == "admin@mywasender.com").first()
    if not admin:
        admin = User(
            email="admin@mywasender.com",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN
        )
        db.add(admin)
        db.commit()
        print("✓ Admin user created: admin@mywasender.com / admin123")
    else:
        print("✓ Admin user already exists")
    
    db.close()


if __name__ == "__main__":
    print("Seeding database...")
    seed_admin()
    print("Done!")
