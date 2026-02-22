import os
import sys
from dotenv import load_dotenv

# Add api to path
sys.path.insert(0, os.path.join(os.getcwd(), "api"))

load_dotenv()

from database import SessionLocal
from models import User

def fix_admin():
    db = SessionLocal()
    try:
        # 1. Correct Gmail Admin
        admin_email = "rahulbariki24@gmail.com"
        user = db.query(User).filter(User.email.ilike(admin_email)).first()
        if user:
            user.is_admin = True
            user.role = "admin"
            user.subscription_plan = "enterprise"
            user.subscription_status = "active"
            db.commit()
            print(f"[SUCCESS] {admin_email} is now a FULL ADMIN.")
        else:
            print(f"[WARNING] {admin_email} not found in database.")

        # 2. Remove incorrect Gnail entry if it exists
        wrong_email = "rahulbariki24@gnail.com"
        wrong_user = db.query(User).filter(User.email.ilike(wrong_email)).first()
        if wrong_user:
            db.delete(wrong_user)
            db.commit()
            print(f"[CLEANUP] Deleted incorrect account: {wrong_email}")
        else:
            print(f"[INFO] No '{wrong_email}' account found to delete.")

        # 3. List all admins for verification
        admins = db.query(User).filter(User.is_admin == True).all()
        print("\n--- Current Admins ---")
        for a in admins:
            print(f"ID: {a.id} | Email: {a.email} | Plan: {a.subscription_plan}")

    except Exception as e:
        print(f"[ERROR] {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin()
