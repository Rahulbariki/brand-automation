import os
import sys

# Add api directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from database import engine
from models import Base
from sqlalchemy import text

def run_migration():
    Base.metadata.create_all(bind=engine)
    print("Migration complete. Team tables created.")
            
if __name__ == "__main__":
    run_migration()
