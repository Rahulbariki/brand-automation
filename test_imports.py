import sys
import traceback
sys.path.insert(0, 'api')

from fastapi import FastAPI, Depends
app = FastAPI()

try:
    import routes.auth_routes as auth_routes
    from dependencies import admin_required
    import routes.admin_routes as admin_routes
    import routes.branding_routes as branding_routes
    import routes.stripe_routes as stripe_routes
    import routes.debug_routes as debug_routes
    import routes.workspace_routes as workspace_routes
    import routes.team_routes as team_routes
    
    app.include_router(auth_routes.router, prefix="/api", tags=["Auth"])
    app.include_router(admin_routes.router, prefix="/api/admin", dependencies=[Depends(admin_required)])
    app.include_router(branding_routes.router, prefix="/api")
    app.include_router(stripe_routes.router, prefix="/api/stripe")
    app.include_router(debug_routes.router, prefix="/api/debug")
    app.include_router(workspace_routes.router)
    app.include_router(team_routes.router, prefix="/api/team")
    print("All routes included successfully!")
except Exception as e:
    traceback.print_exc()
