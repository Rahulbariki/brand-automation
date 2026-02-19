import os
import sys
import json
import traceback

# Path Resolution
api_dir = os.path.dirname(os.path.normpath(os.path.abspath(__file__)))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

def create_error_app(error_msg, stack_trace):
    async def app(scope, receive, send):
        if scope['type'] == 'http':
            await send({
                'type': 'http.response.start',
                'status': 500,
                'headers': [[b'content-type', b'application/json']],
            })
            await send({
                'type': 'http.response.body',
                'body': json.dumps({
                    "error": f"Backend Error: {error_msg}",
                    "traceback": stack_trace,
                    "sys_path": sys.path
                }).encode('utf-8'),
            })
    return app

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    
    # Import our standardized modules (now using absolute imports from sys.path)
    # We use 'import database' because 'api' (api_dir) is at the start of sys.path
    import database
    from database import engine, Base
    import routes.auth_routes as auth_routes
    import routes.admin_routes as admin_routes
    import routes.branding_routes as branding_routes
    import routes.stripe_routes as stripe_routes
    import routes.debug_routes as debug_routes

    # Config
    ENV = os.getenv("ENV", "development")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

    app = FastAPI(
        title="BizForge API", 
        version="1.0.0",
        docs_url=None if ENV == "production" else "/docs",
        redoc_url=None if ENV == "production" else "/redoc"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # Relaxed for production stability, can be tightened later
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Debugging: Global Exception Handler ---
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        return JSONResponse(
            status_code=500,
            content={
                "message": "Internal Server Error (Debug Mode)",
                "detail": str(exc),
                "traceback": traceback.format_exc()
            },
        )


    # Mount Routers
    app.include_router(auth_routes.router, prefix="/api", tags=["Authentication"])
    app.include_router(admin_routes.router, prefix="/api/admin", tags=["Admin"])
    app.include_router(branding_routes.router, prefix="/api", tags=["Branding AI"])
    app.include_router(stripe_routes.router, prefix="/api/stripe", tags=["Stripe"])
    app.include_router(debug_routes.router, prefix="/api/debug", tags=["Debug"])

    @app.on_event("startup")
    def startup_event():
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as e:
            print(f"Startup Error (Database Init): {e}")

    @app.get("/api/health")
    def health_check():
        db_url = os.getenv("DATABASE_URL")
        is_sqlite = db_url and "sqlite" in db_url
        
        # Sanitize and extract host for debugging
        db_host = "unknown"
        if db_url and "@" in db_url:
            try:
                db_host = db_url.split("@")[1].split("/")[0]
            except:
                pass

        return {
            "status": "healthy", 
            "env": ENV, 
            "db_configured": bool(db_url),
            "using_sqlite_fallback": bool(is_sqlite),
            "db_connection_host": db_host # Critical for verifying IPv4/Pooler usage
        }

except Exception as e:
    app = create_error_app(str(e), traceback.format_exc())
