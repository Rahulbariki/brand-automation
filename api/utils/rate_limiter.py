import time
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
import threading

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 10, window: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window
        self.requests = defaultdict(list)
        self.lock = threading.Lock()

    async def dispatch(self, request: Request, call_next):
        # Only limit specific paths
        path = request.url.path
        protected_prefixes = [
            "/api/generate", 
            "/api/usage", 
            "/api/admin",
            "/api/branding",
            "/api/chat",
            "/api/analyze",
            "/api/get-colors",
            "/api/transcribe"
        ]
        
        is_protected = any(path.startswith(prefix) for prefix in protected_prefixes)
        
        if not is_protected:
            return await call_next(request)

        # Identify user (by IP as fallback, or ID if authenticated)
        # Authentication hasn't happened yet in middleware dispatch chain 
        # unless we use a dependency or check headers manually.
        # Since this is BaseHTTPMiddleware, it runs before dependencies.
        
        user_id = request.client.host # Default to IP
        
        # Check if we have a token to identify user more accurately
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # We don't verify the JWT here to save time, just use the token string or IP
            user_id = auth_header 

        now = time.time()
        
        with self.lock:
            # Clean up old requests
            self.requests[user_id] = [t for t in self.requests[user_id] if now - t < self.window]
            
            if len(self.requests[user_id]) >= self.limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Limit is 10 per minute."
                )
            
            self.requests[user_id].append(now)

        response = await call_next(request)
        return response
