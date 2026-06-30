"""
Admin Authentication
--------------------
Simple JWT-based auth for the admin panel.
One admin account — credentials set via environment variables.

Setup:
  ADMIN_USERNAME = harsha_admin        (change this)
  ADMIN_PASSWORD = YourStrongPass123!  (change this — REQUIRED in production)
  SECRET_KEY     = (already in config — used for JWT signing)
"""
import os
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY      = os.getenv("SECRET_KEY", "harsha-art-gallery-secret-key-2024")
ALGORITHM       = "HS256"
TOKEN_EXPIRE_H  = 12   # token valid for 12 hours

ADMIN_USERNAME  = os.getenv("ADMIN_USERNAME", "harsha_admin")
ADMIN_PASSWORD  = os.getenv("ADMIN_PASSWORD", "HarshaAdmin@2024!")[:72]  # bcrypt hard limit is 72 bytes

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer      = HTTPBearer(auto_error=False)

# ── Lazy-hash the configured password (avoids crashing the whole app at
#    import time if there's ever a bcrypt/passlib version mismatch again) ─────
_HASHED_PASSWORD: Optional[str] = None


def _get_hashed_password() -> str:
    global _HASHED_PASSWORD
    if _HASHED_PASSWORD is None:
        _HASHED_PASSWORD = pwd_context.hash(ADMIN_PASSWORD)
    return _HASHED_PASSWORD


def verify_credentials(username: str, password: str) -> bool:
    """Return True if username + password match the configured admin credentials."""
    return username == ADMIN_USERNAME and pwd_context.verify(password[:72], _get_hashed_password())


def create_access_token(username: str) -> str:
    """Create a signed JWT token."""
    payload = {
        "sub":  username,
        "role": "admin",
        "exp":  datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_H),
        "iat":  datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer)
) -> dict:
    """
    FastAPI dependency — require valid admin JWT.
    Raises 401 if missing or invalid.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = _decode_token(credentials.credentials)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
