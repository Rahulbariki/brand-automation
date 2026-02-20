from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db, engine
from models import User
from utils.hashing import hash_password, verify_password
import os
import sys

router = APIRouter()

@router.get("/config")
def debug_config():
    """Check environment and path configuration"""
    return {
        "sys_path": sys.path,
        "cwd": os.getcwd(),
        "database_url_present": bool(os.getenv("DATABASE_URL")),
        "database_url_start": os.getenv("DATABASE_URL")[:10] if os.getenv("DATABASE_URL") else None,
        "env_var_keys": list(os.environ.keys())
    }

@router.get("/db-check")
def debug_db_check(db: Session = Depends(get_db)):
    """Try to execute a simple query"""
    try:
        # Check connection
        result = db.execute(text("SELECT 1")).scalar()
        
        # Check tables
        tables = engine.table_names() if hasattr(engine, "table_names") else "N/A (Check metadata)"
        
        # Check User count
        user_count = db.query(User).count()
        
        return {
            "status": "connected", 
            "select_1": result, 
            "tables": tables,
            "user_count": user_count
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@router.get("/hashing-check")
def debug_hashing():
    """Test bcrypt hashing to see if library crashes"""
    try:
        TestPass = "testpassword"
        hashed = hash_password(TestPass)
        verify = verify_password(TestPass, hashed)
        return {"status": "ok", "hashed": hashed, "verify": verify}
    except Exception as e:
        import traceback
        return {
            "status": "error", 
            "error": str(e), 
            "detail": "Likely missing libffi or bcrypt binary incompatibility",
            "traceback": traceback.format_exc()
        }

@router.get("/migrate")
def run_migration(db: Session = Depends(get_db)):
    """One-time migration: add missing columns to users table."""
    results = []
    
    columns_to_add = [
        ("supabase_id",            "VARCHAR", None),
        ("subscription_status",    "VARCHAR", "'inactive'"),
        ("stripe_customer_id",     "VARCHAR", None),
        ("stripe_subscription_id", "VARCHAR", None),
    ]
    
    for col_name, col_type, default in columns_to_add:
        try:
            # Check if column exists
            check = db.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='users' AND column_name=:col"
            ), {"col": col_name})
            
            if check.fetchone():
                results.append({"column": col_name, "status": "already_exists"})
                continue
            
            default_clause = f" DEFAULT {default}" if default else ""
            sql = f"ALTER TABLE users ADD COLUMN {col_name} {col_type}{default_clause}"
            db.execute(text(sql))
            db.commit()
            results.append({"column": col_name, "status": "added"})
        except Exception as e:
            results.append({"column": col_name, "status": "error", "detail": str(e)})
    
    return {"migration": "complete", "results": results}
