import uuid
import math
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, exists
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.document import Document, DocumentVersion
from app.models.stage import Stage
from app.models.team import ProjectAdmin, UserTeamMembership
from app.routers.auth import get_current_user
from app.services.access_control import document_access_filter

router = APIRouter(prefix="/api/projects", tags=["projects"])

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    status: str
    updatedAt: str

class DocumentResponse(BaseModel):
    id: str
    projectId: str
    name: str
    type: str
    size: str
    uploadedAt: str
    stage: str

def format_size(size_bytes: int) -> str:
    if not size_bytes or size_bytes == 0:
        return "0 B"
    size_name = ("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_name[i]}"

def format_date(dt: datetime) -> str:
    if not dt:
        return ""
    return dt.strftime("%b %d, %Y")

@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.is_org_admin:
        stmt = select(Project).where(Project.tenant_id == current_user.tenant_id)
    else:
        is_admin = exists().where(
            and_(
                ProjectAdmin.user_id == current_user.user_id,
                ProjectAdmin.project_id == Project.project_id
            )
        )
        has_membership = exists().where(
            and_(
                UserTeamMembership.user_id == current_user.user_id,
                UserTeamMembership.project_id == Project.project_id
            )
        )
        stmt = select(Project).where(
            and_(
                Project.tenant_id == current_user.tenant_id,
                is_admin | has_membership
            )
        )
    
    projects = db.execute(stmt).scalars().all()
    
    result = []
    for p in projects:
        # Just passing a readable string for updatedAt to match mock data vibe
        result.append({
            "id": str(p.project_id),
            "name": p.name,
            "description": p.description or "",
            "status": p.status,
            "updatedAt": format_date(p.updated_at)
        })
    return result

@router.get("/{project_id}/documents", response_model=List[DocumentResponse])
def list_project_documents(project_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    filter_cond = document_access_filter(db, current_user, project_id, action="read")
    if isinstance(filter_cond, bool) and filter_cond is False:
        return []
    
    stmt = (
        select(Document, DocumentVersion, Stage)
        .outerjoin(DocumentVersion, Document.current_version_id == DocumentVersion.version_id)
        .join(Stage, Document.stage_id == Stage.stage_id)
        .where(filter_cond)
    )
    
    rows = db.execute(stmt).all()
    
    result = []
    for doc, doc_ver, stage in rows:
        size_bytes = doc_ver.file_size_bytes if doc_ver else 0
        
        mime = doc.mime_type.lower()
        if "pdf" in mime:
            doc_type = "PDF"
        elif "word" in mime or "docx" in mime:
            doc_type = "DOCX"
        elif "text" in mime:
            doc_type = "TXT"
        elif "excel" in mime or "spreadsheet" in mime or "csv" in mime:
            doc_type = "XLSX" if "excel" in mime else "CSV"
        else:
            doc_type = doc.mime_type.split("/")[-1].upper()
            
        result.append({
            "id": str(doc.document_id),
            "projectId": str(doc.project_id),
            "name": doc.original_filename,
            "type": doc_type,
            "size": format_size(size_bytes),
            "uploadedAt": format_date(doc.created_at),
            "stage": stage.name
        })
    return result
