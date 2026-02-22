import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()
from sqlalchemy.orm import sessionmaker, declarative_base

# Load from environment variable (Set in .env or Render/Vercel)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("WARNING: DATABASE_URL not found. Using in-memory sqlite for build/import safety.")
    DATABASE_URL = "sqlite:///:memory:"

# Handle Supabase/Render "postgres://" (SQLAlchemy requires "postgresql://")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connect Args: needed for SQLite, not for Postgres
is_sqlite = "sqlite" in DATABASE_URL
connect_args = {"check_same_thread": False} if is_sqlite else {}

# Engine configuration for production
# - pool_pre_ping: recovers from stale connections
# - pool_recycle: refresh connections every 5 minutes (Supabase pooler timeout)
# - pool_size/max_overflow: conservative for serverless
# - For Supabase Transaction Pooler: MUST disable statement caching
engine_kwargs = {
    "connect_args": connect_args,
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

# Transaction Pooler doesn't support prepared statements
# We must set statement_cache_size=0 via execution options
if not is_sqlite:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    # Disable prepared statements for PgBouncer/Supabase Transaction Pooler
    engine_kwargs["execution_options"] = {"prepared_statement_cache_size": 0}

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
