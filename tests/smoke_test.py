from fastapi.testclient import TestClient
from api.index import app
import sys
import os

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

client = TestClient(app)

def test_read_main():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_admin_routes_exist():
    # Check if /api/admin/stats route is registered (even if 401 unsupported)
    # We just want to know if the app initialized without error
    # and the route is present in the router
    routes = [route.path for route in app.routes]
    assert "/api/admin/stats" in routes
    assert "/api/admin/users" in routes
    print("Admin routes verified successfully")
    
if __name__ == "__main__":
    try:
        test_read_main()
        test_admin_routes_exist()
        print("Smoke test passed!")
    except Exception as e:
        print(f"Smoke test failed: {e}")
        exit(1)
