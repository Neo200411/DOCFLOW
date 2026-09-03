import os
import uuid
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select
from google.oauth2 import id_token
from google.auth.transport import requests

from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_SECRET = os.environ["JWT_SECRET"]
ALGORITHM = "HS256"
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "your_google_client_id_here")

class GoogleAuthRequest(BaseModel):
    token: str

@router.post("/google")
def google_auth(data: GoogleAuthRequest, response: Response, db: Session = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(data.token, requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        
        if not user:
            # Auto-create user and dummy tenant for dev phase
            tenant = db.execute(select(Tenant).limit(1)).scalar_one_or_none()
            if not tenant:
                tenant = Tenant(name="Default Tenant")
                db.add(tenant)
                db.flush()
            
            user = User(tenant_id=tenant.tenant_id, email=email)
            db.add(user)
            db.commit()
            db.refresh(user)
            
        payload = {
            "sub": str(user.user_id),
            "exp": datetime.now(timezone.utc) + timedelta(days=7)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)
        
        response.set_cookie(
            key="session_token", 
            value=token, 
            httponly=True, 
            max_age=7*24*60*60,
            samesite="lax",
            secure=False
        )
        
        return {"message": "Authenticated", "user_id": user.user_id}
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get("session_token")
    if not token:
        # Dev fallback when testing API without frontend
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        user = db.execute(select(User).where(User.user_id == uuid.UUID(user_id_str))).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.user_id),
        "email": user.email,
        "is_org_admin": user.is_org_admin
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("session_token")
    return {"message": "Logged out"}
