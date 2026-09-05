import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.database import get_db
from app.models.user import User
from app.models.team import UserTeamMembership, TeamRole
from app.models.access_request import AccessRequest, AccessRequestStatus
from app.routers.auth import get_current_user
from app.services.access_control import get_user_project_admin_status

from pydantic import BaseModel
from datetime import datetime

router = APIRouter(tags=["Access Requests"])


class AccessRequestCreate(BaseModel):
    project_id: uuid.UUID
    team_id: uuid.UUID


class AccessRequestResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    project_id: uuid.UUID
    team_id: uuid.UUID
    status: AccessRequestStatus
    requested_at: datetime
    reviewed_by: uuid.UUID | None
    reviewed_at: datetime | None

    model_config = {"from_attributes": True}


@router.post("/api/access-requests", response_model=AccessRequestResponse)
def create_access_request(
    request: AccessRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if org_admin or project_admin
    is_project_admin = get_user_project_admin_status(db, current_user.user_id, request.project_id)
    if current_user.is_org_admin or is_project_admin:
        raise HTTPException(status_code=400, detail="You already have confidential access")

    # Check team role
    role = db.execute(
        select(UserTeamMembership.role).where(
            UserTeamMembership.user_id == current_user.user_id,
            UserTeamMembership.project_id == request.project_id,
            UserTeamMembership.team_id == request.team_id
        )
    ).scalar_one_or_none()

    if not role:
        raise HTTPException(status_code=403, detail="Not a member of this team")

    if role == TeamRole.team_lead:
        raise HTTPException(status_code=400, detail="You already have confidential access")
    
    if role == TeamRole.viewer:
        raise HTTPException(status_code=403, detail="Viewers cannot request confidential access")

    # Check for existing request
    existing = db.execute(
        select(AccessRequest).where(
            AccessRequest.user_id == current_user.user_id,
            AccessRequest.project_id == request.project_id,
            AccessRequest.team_id == request.team_id,
            AccessRequest.status.in_([AccessRequestStatus.pending, AccessRequestStatus.approved])
        )
    ).scalar_one_or_none()

    if existing:
        return existing

    # Create new request
    new_request = AccessRequest(
        user_id=current_user.user_id,
        project_id=request.project_id,
        team_id=request.team_id,
        status=AccessRequestStatus.pending
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


@router.get("/api/projects/{project_id}/access-requests", response_model=List[AccessRequestResponse])
def get_project_access_requests(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_project_admin = get_user_project_admin_status(db, current_user.user_id, project_id)
    
    if current_user.is_org_admin or is_project_admin:
        return db.execute(
            select(AccessRequest).where(AccessRequest.project_id == project_id)
        ).scalars().all()
        
    # Team leads can see requests for their teams
    led_teams = db.execute(
        select(UserTeamMembership.team_id).where(
            UserTeamMembership.user_id == current_user.user_id,
            UserTeamMembership.project_id == project_id,
            UserTeamMembership.role == TeamRole.team_lead
        )
    ).scalars().all()
    
    if not led_teams:
        raise HTTPException(status_code=403, detail="Not authorized to view access requests")
        
    return db.execute(
        select(AccessRequest).where(
            AccessRequest.project_id == project_id,
            AccessRequest.team_id.in_(led_teams)
        )
    ).scalars().all()


@router.post("/api/access-requests/{request_id}/approve", response_model=AccessRequestResponse)
def approve_access_request(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.execute(select(AccessRequest).where(AccessRequest.id == request_id)).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.user_id == current_user.user_id:
        raise HTTPException(status_code=403, detail="Cannot approve your own request")

    is_project_admin = get_user_project_admin_status(db, current_user.user_id, req.project_id)
    if not (current_user.is_org_admin or is_project_admin):
        # Check team lead
        role = db.execute(
            select(UserTeamMembership.role).where(
                UserTeamMembership.user_id == current_user.user_id,
                UserTeamMembership.project_id == req.project_id,
                UserTeamMembership.team_id == req.team_id
            )
        ).scalar_one_or_none()
        if role != TeamRole.team_lead:
            raise HTTPException(status_code=403, detail="Not authorized to approve this request")

    req.status = AccessRequestStatus.approved
    req.reviewed_by = current_user.user_id
    req.reviewed_at = datetime.now()
    
    db.commit()
    db.refresh(req)
    return req


@router.post("/api/access-requests/{request_id}/deny", response_model=AccessRequestResponse)
def deny_access_request(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.execute(select(AccessRequest).where(AccessRequest.id == request_id)).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    is_project_admin = get_user_project_admin_status(db, current_user.user_id, req.project_id)
    if not (current_user.is_org_admin or is_project_admin):
        role = db.execute(
            select(UserTeamMembership.role).where(
                UserTeamMembership.user_id == current_user.user_id,
                UserTeamMembership.project_id == req.project_id,
                UserTeamMembership.team_id == req.team_id
            )
        ).scalar_one_or_none()
        if role != TeamRole.team_lead:
            raise HTTPException(status_code=403, detail="Not authorized to deny this request")

    req.status = AccessRequestStatus.denied
    req.reviewed_by = current_user.user_id
    req.reviewed_at = datetime.now()
    
    db.commit()
    db.refresh(req)
    return req
