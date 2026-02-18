import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()
from sqlalchemy.orm import sessionmaker, declarative_base

# Load from environment variable (Set in .env or Render/Vercel)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback/Placeholder for local dev (SQLite) if not set, BUT for prod we need Postgres.
    # The prompt explicitly asked to raise error if not set, but for transition safety 
    # and local dev without full env setup yet, I'll log a warning or use sqlite as fallback IF desired?
    # No, prompt said: "if not DATABASE_URL: raise ValueError"
    # I will follow prompt.
    raise ValueError("DATABASE_URL is not set in environment variables")

# Handle Supabase/Render "postgres://" (SQLAlchemy requires "postgresql://")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connect Args: needed for SQLite, not for Postgres
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

# Engine configuration for production (Pool pre-ping, recycle)
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True, 
    pool_recycle=300
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
