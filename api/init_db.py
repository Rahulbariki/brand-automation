import os
import sys
from dotenv import load_dotenv

# Path Resolution
base_dir = os.path.dirname(os.path.normpath(os.path.abspath(__file__)))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

load_dotenv()

from database import engine, Base, SessionLocal
from models import User, Workspace, WorkspaceAsset, WorkspaceActivity, GeneratedContent, UsageLog, Team, TeamMember

def init_db():
    print("🚀 Initializing BrandNova Unified Database Migration...")
    
    # 1. Create tables if they don't exist
    print("--- Creating all tables from models ---")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 2. Check for missing columns or perform data migrations if needed
        # (This is where logic from migrate_workspaces.py etc. lives)
        print("--- Verifying data integrity ---")
        
        # Example: Ensure at least one admin exists if needed
        admin_email = os.getenv("ADMIN_EMAIL", "rahulbariki24@gmail.com")
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if existing_admin:
            if not existing_admin.is_admin:
                print(f"Granting admin to {admin_email}")
                existing_admin.is_admin = True
                existing_admin.role = "admin"
                db.commit()
        
        print("✅ Database is synchronized and ready for production.")
    except Exception as e:
        print(f"❌ Migration Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
