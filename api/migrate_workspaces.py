from database import engine
from models import Workspace, WorkspaceAsset, WorkspaceActivity

def run_migration():
    print("Creating Workspace related tables...")
    Workspace.__table__.create(engine, checkfirst=True)
    WorkspaceAsset.__table__.create(engine, checkfirst=True)
    WorkspaceActivity.__table__.create(engine, checkfirst=True)
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
