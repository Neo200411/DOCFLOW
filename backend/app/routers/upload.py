import os
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.config import ALLOWED_EXTENSIONS, MAX_UPLOAD_SIZE_BYTES
from app.database import get_db
from app.models import (
    Document,
    DocumentVersion,
    DocumentTeamVisibility,
    UserTeamMembership,
    Team,
)
from app.models.document import SensitivityLevel, DocumentStatus
from app.schemas.document import UploadResponse
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/documents", tags=["documents"])


def _validate_file(filename: str, mime_type: str, size_bytes: int) -> None:
    """Phase 1 §4: reject unsupported formats / oversized files at upload time."""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )
    if size_bytes > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File exceeds the {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB limit. "
                "This is a temporary limit tied to local Postgres-blob storage and will be "
                "raised once the project moves to object storage (MinIO/S3)."
            ),
        )


def _resolve_uploading_as_team(
    db: Session, current_user: User, project_id: uuid.UUID, requested_team_id: uuid.UUID | None
) -> uuid.UUID:
    """
    Phase 1 §1: resolves which team the uploader is "acting as".
    - If the user belongs to exactly one team on this project, use it (no picker needed).
    - If they belong to multiple teams, requested_team_id must be provided explicitly.
    - If they belong to none, this is a permissions error (should not be able to upload).
    """
    from app.services.access_control import role_permits, get_user_project_admin_status
    is_project_admin = get_user_project_admin_status(db, current_user.user_id, project_id)

    if current_user.is_org_admin or is_project_admin:
        teams = db.execute(select(Team).where(Team.project_id == project_id)).scalars().all()
        team_ids = {t.team_id for t in teams}
        
        if not team_ids:
            raise HTTPException(status_code=403, detail="Project has no teams to upload to.")
            
        if requested_team_id is not None:
            if requested_team_id not in team_ids:
                raise HTTPException(status_code=403, detail="Requested team does not exist in this project.")
            return requested_team_id
            
        if len(team_ids) == 1:
            return next(iter(team_ids))
            
        admin_type = "Org admin" if current_user.is_org_admin else "Project admin"
        raise HTTPException(
            status_code=400,
            detail=f"{admin_type} can upload to multiple teams on this project — 'uploading_as_team_id' must be specified explicitly."
        )

    from app.models.team import TeamRole
    memberships = db.execute(
        select(UserTeamMembership).where(
            UserTeamMembership.user_id == current_user.user_id,
            UserTeamMembership.project_id == project_id
        )
    ).scalars().all()

    team_ids = {m.team_id for m in memberships}

    if requested_team_id is not None:
        if requested_team_id not in team_ids:
            raise HTTPException(
                status_code=403,
                detail="User is not a member of the specified 'uploading as' team on this project.",
            )
        target_team_id = requested_team_id
    elif len(team_ids) == 1:
        target_team_id = next(iter(team_ids))
    elif not team_ids:
        raise HTTPException(
            status_code=403,
            detail="User is not a member of any team on this project.",
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=(
                "User belongs to multiple teams on this project — "
                "'uploading_as_team_id' must be specified explicitly."
            ),
        )

    membership = next(m for m in memberships if m.team_id == target_team_id)
    
    if not role_permits(is_project_admin, membership.role, "write"):
        raise HTTPException(
            status_code=403,
            detail=f"Your role on this team ({membership.role.name}) does not permit uploading."
        )

    return target_team_id


@router.post("/upload", response_model=UploadResponse)
def upload_document(
    project_id: uuid.UUID = Form(...),
    stage_id: uuid.UUID = Form(...),
    uploading_as_team_id: uuid.UUID | None = Form(None),
    sensitivity_level: SensitivityLevel = Form(SensitivityLevel.internal),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Phase 1 upload flow:
      - project_id, stage_id: mandatory (per §1)
      - uploading_as_team_id: optional if user belongs to only one team on the
        project; required (as a picker) if they belong to multiple (per §1)
      - sensitivity_level: optional, defaults to Internal (per §1)
      - format/size validated per §4
      - always creates a NEW document + version 1 (this endpoint is the
        "normal add document" flow, not "upload new version" — per §2)
      - sets status = pending_review, which the async polling worker (§5)
        will later pick up for the Structure Scanner
    """
    file_bytes = file.file.read()
    size_bytes = len(file_bytes)

    _validate_file(file.filename, file.content_type, size_bytes)

    resolved_team_id = _resolve_uploading_as_team(
        db, current_user, project_id, uploading_as_team_id
    )

    document = Document(
        tenant_id=current_user.tenant_id,
        project_id=project_id,
        stage_id=stage_id,
        uploaded_by=current_user.user_id,
        uploaded_as_team_id=resolved_team_id,
        sensitivity_level=sensitivity_level,
        original_filename=file.filename,
        mime_type=file.content_type,
    )
    db.add(document)
    db.flush()  # get document.document_id before creating the version

    ext = os.path.splitext(file.filename)[1].lower()
    rel_path = document.logical_path(ext)
    abs_path = os.path.join(os.getcwd(), "storage", rel_path)
    
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with open(abs_path, "wb") as f:
        f.write(file_bytes)

    version = DocumentVersion(
        document_id=document.document_id,
        version_number=1,
        file_path=rel_path,
        file_size_bytes=size_bytes,
        uploaded_by=current_user.user_id,
        status=DocumentStatus.pending_review,
    )
    db.add(version)
    db.flush()

    document.current_version_id = version.version_id

    # Default visibility: the "uploading as" team (per §1). Editable later by team_lead+/project_admin.
    visibility = DocumentTeamVisibility(document_id=document.document_id, team_id=resolved_team_id)
    db.add(visibility)

    db.commit()
    db.refresh(document)
    db.refresh(version)

    return UploadResponse(
        document_id=document.document_id,
        version_id=version.version_id,
        original_filename=document.original_filename,
        status=version.status,
        sensitivity_level=document.sensitivity_level,
        uploaded_as_team_id=document.uploaded_as_team_id,
    )