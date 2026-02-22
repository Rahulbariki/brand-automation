import os
import time
import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, status
from typing import Optional, Dict

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
    PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "eswlocdooykyaxqyphwu")
    SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"

SUPABASE_ANON_KEY = os.getenv("SUPABASE_PUBLIC_KEY") or os.getenv("SUPABASE_KEY")

JWKS_URL = f"{SUPABASE_URL}/auth/v1/certs"
ISSUER = f"{SUPABASE_URL}/auth/v1"

# Local JWT secret for HS256 tokens (from login/signup)
LOCAL_JWT_SECRET = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", "super_secret_key_change_me"))

class SupabaseJWTVerifier:
    def __init__(self):
        self.jwks = {"keys": []}
        self.last_fetched = 0
        self.cache_ttl = 3600  # Cache JWKS for 1 hour

    async def fetch_jwks(self):
        """Fetch JWKS from Supabase with timeout and error handling."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {}
                if SUPABASE_ANON_KEY:
                    headers["apikey"] = SUPABASE_ANON_KEY
                response = await client.get(JWKS_URL, headers=headers)
                response.raise_for_status()
                self.jwks = response.json()
                self.last_fetched = time.time()
                print(f"JWKS fetched successfully: {len(self.jwks.get('keys', []))} keys")
        except httpx.TimeoutException:
            print(f"JWKS fetch timeout (URL: {JWKS_URL})")
            # Don't clear existing keys on timeout
        except Exception as e:
            print(f"Error fetching Supabase JWKS: {e}")
            # Don't clear existing keys on error

    def _should_refresh_jwks(self) -> bool:
        """Check if JWKS cache needs refresh."""
        return (time.time() - self.last_fetched) > self.cache_ttl

    def _verify_local_token(self, token: str) -> Optional[Dict]:
        """Verify a locally-issued HS256 token (from login/signup/google-login)."""
        try:
            payload = jwt.decode(token, LOCAL_JWT_SECRET, algorithms=["HS256"])
            return payload
        except JWTError as e:
            print(f"Local HS256 Verification Failed: {e}")
            return None

    async def verify_token(self, token: str) -> Optional[Dict]:
        """
        Smart token verification:
        - Tokens WITHOUT 'kid' header -> local HS256 tokens (from our login/signup)
        - Tokens WITH 'kid' header -> Supabase RS256 tokens (from OAuth)
        """
        try:
            # Check token header to determine verification method
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            
            if not kid:
                # It's a local HS256 token from our login/signup/google-login endpoints
                return self._verify_local_token(token)

            # It's a Supabase RS256 token — need JWKS
            # Refresh JWKS if cache is stale or empty
            if not self.jwks.get("keys") or self._should_refresh_jwks():
                await self.fetch_jwks()

            # Find the correct key
            key = None
            for jwk in self.jwks.get("keys", []):
                if jwk.get("kid") == kid:
                    key = jwk
                    break

            if not key:
                # Key not found, force refresh JWKS (key rotation may have happened)
                await self.fetch_jwks()
                for jwk in self.jwks.get("keys", []):
                    if jwk.get("kid") == kid:
                        key = jwk
                        break
                
                if not key:
                    print(f"Could not find JWKS key with kid: {kid}")
                    return None

            # Decode and verify Supabase token
            payload = jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                audience="authenticated",
                issuer=ISSUER,
                options={
                    "verify_aud": True,
                    "verify_iss": True,
                    "verify_exp": True,
                    "verify_iat": False,
                }
            )
            return payload

        except JWTError as e:
            print(f"JWT Verification Error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error during token verification: {e}")
            return None

# Singleton instance
verifier = SupabaseJWTVerifier()
