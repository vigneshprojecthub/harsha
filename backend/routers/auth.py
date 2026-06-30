"""
Auth Router
-----------
POST /api/auth/login   — get JWT token
GET  /api/auth/verify  — check if token is valid (used by frontend on page load)
POST /api/auth/logout  — client-side only (just discard token)
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from core.auth import verify_credentials, create_access_token, get_current_admin

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    username:     str
    message:      str = "Login successful"


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    """Verify admin credentials and return a JWT token."""
    if not verify_credentials(body.username, body.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )
    token = create_access_token(body.username)
    return LoginResponse(
        access_token=token,
        username=body.username,
    )


@router.get("/verify")
def verify_token(admin: dict = Depends(get_current_admin)):
    """Check if the current token is valid. Returns 200 or 401."""
    return {"valid": True, "username": admin["sub"]}


@router.post("/logout")
def logout():
    """Token is stateless — client just deletes it from localStorage."""
    return {"message": "Logged out successfully"}
