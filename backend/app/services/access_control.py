import uuid
from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_, exists

from app.models.user import User
from app.models.document import Document, DocumentTeamVisibility, SensitivityLevel
from app.models.team import UserTeamMembership, ProjectAdmin, TeamRole


def get_user_project_admin_status(db: Session, user_id: uuid.UUID, project_id: uuid.UUID) -> bool:
    return db.execute(
        select(ProjectAdmin).where(
            ProjectAdmin.user_id == user_id,
            ProjectAdmin.project_id == project_id
        )
    ).scalar_one_or_none() is not None


def get_user_max_team_role(db: Session, user_id: uuid.UUID, project_id: uuid.UUID) -> TeamRole | None:
    roles = db.execute(
        select(UserTeamMembership.role).where(
            UserTeamMembership.user_id == user_id,
            UserTeamMembership.project_id == project_id
        )
    ).scalars().all()
    
    if not roles:
        return None
        
    if TeamRole.team_lead in roles:
        return TeamRole.team_lead
    if TeamRole.contributor in roles:
        return TeamRole.contributor
    return TeamRole.viewer


def get_user_teams(db: Session, user_id: uuid.UUID, project_id: uuid.UUID) -> set[uuid.UUID]:
    memberships = db.execute(
        select(UserTeamMembership.team_id).where(
            UserTeamMembership.user_id == user_id,
            UserTeamMembership.project_id == project_id
        )
    ).scalars().all()
    return set(memberships)


def get_document_visible_teams(db: Session, document_id: uuid.UUID) -> set[uuid.UUID]:
    visible_teams = db.execute(
        select(DocumentTeamVisibility.team_id).where(
            DocumentTeamVisibility.document_id == document_id
        )
    ).scalars().all()
    return set(visible_teams)


def role_permits(is_admin: bool, max_team_role: TeamRole | None, action: str) -> bool:
    if is_admin:
        return True
        
    if max_team_role is None:
        return False
        
    permissions = {
        TeamRole.team_lead: {"read", "write"},
        TeamRole.contributor: {"read", "write"},
        TeamRole.viewer: {"read"},
    }
    return action in permissions.get(max_team_role, set())


def sensitivity_to_int(level: SensitivityLevel) -> int:
    order = {
        SensitivityLevel.public: 0,
        SensitivityLevel.internal: 1,
        SensitivityLevel.confidential: 2,
        SensitivityLevel.restricted: 3,
    }
    return order.get(level, 0)


def can_access(db: Session, user: User, project_id: uuid.UUID, document: Document, action: str) -> bool:
    """
    Evaluate access for a single document loaded in memory.
    """
    if user.is_org_admin and user.tenant_id == document.tenant_id:
        return True

    is_project_admin = get_user_project_admin_status(db, user.user_id, project_id)
    max_team_role = get_user_max_team_role(db, user.user_id, project_id)
    
    if not is_project_admin and max_team_role is None:
        return False

    if not is_project_admin:
        visible_teams = get_document_visible_teams(db, document.document_id)
        if visible_teams:
            user_teams = get_user_teams(db, user.user_id, project_id)
            if not (user_teams & visible_teams):
                return False

    user_clearance = sensitivity_to_int(user.clearance)
    doc_sensitivity = sensitivity_to_int(document.sensitivity_level)
    
    if user_clearance < doc_sensitivity:
        return False

    if not role_permits(is_project_admin, max_team_role, action):
        return False

    return True


def document_access_filter(db: Session, user: User, project_id: uuid.UUID, action: str) -> Any:
    """
    Returns a SQLAlchemy condition to be used in `.where(...)` to filter 
    Document queries based on the user's RBAC/ABAC permissions.
    """
    if user.is_org_admin:
        return Document.tenant_id == user.tenant_id

    is_project_admin = get_user_project_admin_status(db, user.user_id, project_id)
    max_team_role = get_user_max_team_role(db, user.user_id, project_id)
    
    if not role_permits(is_project_admin, max_team_role, action):
        return False  # Force no results

    if is_project_admin:
        visibility_cond = True
    else:
        user_team_ids = list(get_user_teams(db, user.user_id, project_id))
        has_no_visibility_restrictions = ~exists().where(DocumentTeamVisibility.document_id == Document.document_id)
        matches_user_team = exists().where(
            and_(
                DocumentTeamVisibility.document_id == Document.document_id,
                DocumentTeamVisibility.team_id.in_(user_team_ids)
            )
        )
        visibility_cond = or_(has_no_visibility_restrictions, matches_user_team)

    user_clearance_int = sensitivity_to_int(user.clearance)
    allowed_sensitivities = [
        level for level in SensitivityLevel 
        if sensitivity_to_int(level) <= user_clearance_int
    ]
    clearance_cond = Document.sensitivity_level.in_(allowed_sensitivities)

    return and_(
        Document.project_id == project_id,
        Document.tenant_id == user.tenant_id,
        visibility_cond,
        clearance_cond
    )
