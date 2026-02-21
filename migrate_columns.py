import os
import sys

# Add api directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from database import engine
from sqlalchemy import text

def run_migration():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN plan_source VARCHAR DEFAULT 'default'"))
            print("Added plan_source to users.")
        except Exception as e:
            print(f"plan_source likely exists: {e}")
            
        try:
            conn.execute(text("ALTER TABLE usage_logs ADD COLUMN api_used VARCHAR"))
            print("Added api_used to usage_logs.")
        except Exception as e:
            print(f"api_used likely exists: {e}")

        try:
            conn.execute(text("ALTER TABLE usage_logs ADD COLUMN request_count INTEGER DEFAULT 1"))
            print("Added request_count to usage_logs.")
        except Exception as e:
            print(f"request_count likely exists: {e}")
            
if __name__ == "__main__":
    run_migration()
