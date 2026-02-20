import os
import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, status
from typing import Optional, Dict

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
    # Fallback to project ref if available in env, otherwise error
    PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "eswlocdooykyaxqyphwu")
    SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"

JWKS_URL = f"{SUPABASE_URL}/auth/v1/certs"
ISSUER = f"{SUPABASE_URL}/auth/v1"

class SupabaseJWTVerifier:
    def __init__(self):
        self.jwks = {"keys": []}
        self.last_fetched = 0

    async def fetch_jwks(self):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(JWKS_URL)
                response.raise_for_status()
                self.jwks = response.json()
        except Exception as e:
            print(f"Error fetching Supabase JWKS: {e}")
            # Keep old if fetch fails, or initialize empty if first time
            if self.jwks is None:
                self.jwks = {"keys": []}
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch Supabase authentication certificates"
            )

    async def verify_token(self, token: str) -> Optional[Dict]:
        if not self.jwks or not self.jwks.get("keys"):
            await self.fetch_jwks()

        try:
            # Unverified decode to get key id (kid)
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            if not kid:
                raise JWTError("Missing 'kid' in token header")

            # Find the correct key in JWKS
            key = None
            if self.jwks and "keys" in self.jwks:
                for jwk in self.jwks["keys"]:
                    if jwk.get("kid") == kid:
                        key = jwk
                        break

            if not key:
                # Key not found, try refreshing JWKS once
                await self.fetch_jwks()
                if self.jwks and "keys" in self.jwks:
                    for jwk in self.jwks["keys"]:
                        if jwk.get("kid") == kid:
                            key = jwk
                            break
                
                if not key:
                    raise JWTError(f"Could not find public key with kid: {kid}")

            # Decode and verify
            payload = jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                audience="authenticated",  # Supabase default aud
                issuer=ISSUER,
                options={
                    "verify_aud": True,
                    "verify_iss": True,
                    "verify_exp": True,
                    "verify_iat": False, # Supabase iat can sometimes be slightly in future
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
