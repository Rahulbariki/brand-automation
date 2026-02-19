"""
Admin Seeder Script
Creates or updates the admin user for BrandNova.

Usage:
    cd backend
    python -m app.seed_admin
"""

import os
import sys

# Add project root to path (adjusted for flat /api)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from database import SessionLocal, engine, Base
from models import User
from auth import get_password_hash

# ═══ Admin Credentials ═══
ADMIN_EMAIL = "rahulbariki24@gmail.com"
ADMIN_PASSWORD = "Rahul24$$$$"
ADMIN_NAME = "Rahul Bariki"

def seed_admin():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if admin user already exists
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()

        if existing:
            # Update existing user to admin
            existing.is_admin = True
            existing.role = "admin"
            existing.hashed_password = get_password_hash(ADMIN_PASSWORD)
            existing.fullname = ADMIN_NAME
            existing.subscription_plan = "pro"
            existing.is_active = True
            db.commit()
            print(f"[OK] Updated existing user to ADMIN: {ADMIN_EMAIL}")
        else:
            # Create new admin user
            admin_user = User(
                email=ADMIN_EMAIL,
                hashed_password=get_password_hash(ADMIN_PASSWORD),
                fullname=ADMIN_NAME,
                provider="email",
                is_admin=True,
                role="admin",
                is_active=True,
                subscription_plan="pro",
            )
            db.add(admin_user)
            db.commit()
            print(f"[OK] Created ADMIN user: {ADMIN_EMAIL}")

        # Verify
        admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        print(f"   ID:       {admin.id}")
        print(f"   Email:    {admin.email}")
        print(f"   Name:     {admin.fullname}")
        print(f"   Role:     {admin.role}")
        print(f"   is_admin: {admin.is_admin}")
        print(f"   Plan:     {admin.subscription_plan}")
        print(f"   Active:   {admin.is_active}")
        print()
        print(f"[LOGIN] Credentials:")
        print(f"   Email:    {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")

    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
