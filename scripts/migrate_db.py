"""
Database Migration Script
Adds missing columns to the 'users' table:
  - supabase_id
  - subscription_status
  - stripe_customer_id
  - stripe_subscription_id
"""
import os
import sys

# Ensure api/ is on the path
api_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "api")
sys.path.insert(0, api_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

# Columns to add: (column_name, column_type, default_value)
MIGRATIONS = [
    ("supabase_id",           "VARCHAR",  None),
    ("subscription_status",   "VARCHAR",  "'inactive'"),
    ("stripe_customer_id",    "VARCHAR",  None),
    ("stripe_subscription_id","VARCHAR",  None),
]

def run_migrations():
    with engine.connect() as conn:
        for col_name, col_type, default in MIGRATIONS:
            try:
                # Check if column already exists
                result = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name='users' AND column_name=:col"
                ), {"col": col_name})
                
                if result.fetchone():
                    print(f"  ✓ Column '{col_name}' already exists — skipping")
                    continue
                
                # Add the column
                default_clause = f" DEFAULT {default}" if default else ""
                sql = f"ALTER TABLE users ADD COLUMN {col_name} {col_type}{default_clause}"
                conn.execute(text(sql))
                conn.commit()
                print(f"  ✅ Added column '{col_name}' ({col_type}{default_clause})")
                
            except Exception as e:
                print(f"  ❌ Error adding '{col_name}': {e}")

if __name__ == "__main__":
    print("Running database migrations for 'users' table...")
    run_migrations()
    print("Done!")
