import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.team import Team, UserTeamMembership, TeamRole
from app.routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["admin"])


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    status: Optional[str] = "Active"

class TeamCreate(BaseModel):
    name: str

class MemberAdd(BaseModel):
    email: str
    role: str


@router.post("/projects")
def create_project(data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_org_admin:
        raise HTTPException(status_code=403, detail="Only org admins can create projects.")
    
    new_project = Project(
        tenant_id=current_user.tenant_id,
        name=data.name,
        description=data.description,
        status=data.status
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return {
        "id": str(new_project.project_id),
        "name": new_project.name,
        "description": new_project.description,
        "status": new_project.status
    }


@router.get("/projects/{project_id}/teams")
def list_teams(project_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    teams = db.execute(select(Team).where(Team.project_id == project_id)).scalars().all()
    return [{"id": str(t.team_id), "name": t.name} for t in teams]


@router.post("/projects/{project_id}/teams")
def create_team(project_id: uuid.UUID, data: TeamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_org_admin:
        raise HTTPException(status_code=403, detail="Only org admins can create teams.")
    
    new_team = Team(
        project_id=project_id,
        name=data.name
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return {"id": str(new_team.team_id), "name": new_team.name}


@router.get("/teams/{team_id}/members")
def list_team_members(team_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = (
        select(UserTeamMembership, User)
        .join(User, UserTeamMembership.user_id == User.user_id)
        .where(UserTeamMembership.team_id == team_id)
    )
    rows = db.execute(stmt).all()
    
    return [
        {
            "id": str(membership.id),
            "email": user.email,
            "role": membership.role.value
        }
        for membership, user in rows
    ]


@router.post("/teams/{team_id}/members")
def add_team_member(team_id: uuid.UUID, data: MemberAdd, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_org_admin:
        raise HTTPException(status_code=403, detail="Only org admins can add team members.")
    
    try:
        team_role = TeamRole(data.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role. Must be one of viewer, contributor, team_lead")
        
    print(f"DEBUG [OLD WAY] Email received from frontend: >{data.email}<")
    
    old_query = select(User).where(User.email == data.email)
    print(f"DEBUG [OLD WAY] Query: {old_query}")
    old_user = db.execute(old_query).scalar_one_or_none()
    print(f"DEBUG [OLD WAY] Query result: {old_user}")
    
    # New fixed way
    search_email = data.email.lower().strip()
    query = select(User).where(User.email == search_email)
    print(f"DEBUG [NEW WAY] Normalized email: >{search_email}<")
    print(f"DEBUG [NEW WAY] Query: {query}")
    user = db.execute(query).scalar_one_or_none()
    print(f"DEBUG [NEW WAY] Query result: {user}")
    
    if not user:
        raise HTTPException(status_code=400, detail="This person must sign in at least once via Google before they can be added to a team.")
        
    team = db.execute(select(Team).where(Team.team_id == team_id)).scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
        
    membership = db.execute(
        select(UserTeamMembership).where(
            and_(
                UserTeamMembership.user_id == user.user_id,
                UserTeamMembership.team_id == team.team_id,
                UserTeamMembership.project_id == team.project_id
            )
        )
    ).scalar_one_or_none()
    
    if membership:
        membership.role = team_role
        db.commit()
        db.refresh(membership)
    else:
        membership = UserTeamMembership(
            user_id=user.user_id,
            team_id=team.team_id,
            project_id=team.project_id,
            role=team_role
        )
        db.add(membership)
        db.commit()
        db.refresh(membership)
        
    return {
        "id": str(membership.id),
        "email": user.email,
        "role": membership.role.value
    }
