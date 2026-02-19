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
