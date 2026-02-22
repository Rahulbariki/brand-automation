import sys
import os

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi.testclient import TestClient
from api.index import app

client = TestClient(app)

def test_read_main():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_admin_routes_exist():
    # Check if /api/admin/dashboard route is registered (even if 401 unsupported)
    routes = [route.path for route in app.routes]
    assert "/api/admin/dashboard" in routes
    assert "/api/admin/users" in routes
    print("Admin routes verified successfully")
    
if __name__ == "__main__":
    try:
        test_read_main()
        test_admin_routes_exist()
        print("Smoke test passed!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Smoke test failed: {e}")
        exit(1)
