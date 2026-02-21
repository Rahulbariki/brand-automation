import os
import sys
from dotenv import load_dotenv

base_dir = os.path.dirname(os.path.normpath(os.path.abspath(__file__)))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

load_dotenv()

from database import engine
from sqlalchemy import text

def drop_brand_workspaces():
    try:
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS brand_workspaces CASCADE;"))
            conn.commit()
            print("Dropped brand_workspaces table successfully.")
    except Exception as e:
        print(f"Error dropping table: {e}")

if __name__ == "__main__":
    drop_brand_workspaces()
