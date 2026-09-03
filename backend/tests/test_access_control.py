import pytest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.tenant import Tenant
from app.models.project import Project
from app.models.user import User
from app.models.team import Team, UserTeamMembership, ProjectAdmin, TeamRole
from app.models.document import Document, SensitivityLevel, DocumentTeamVisibility
from app.models.stage import Stage
from app.services.access_control import can_access, document_access_filter

import os
from dotenv import load_dotenv

load_dotenv()

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", 
    "postgresql+psycopg2://localhost:5432/docflow_ai_test"
)
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    tenant_id = uuid.uuid4()
    tenant = Tenant(tenant_id=tenant_id, name="Test Tenant")
    db.add(tenant)
    db.flush()
    
    project_id = uuid.uuid4()
    project = Project(project_id=project_id, tenant_id=tenant_id, name="Test Project")
    db.add(project)
    db.flush()
    
    stage_id = uuid.uuid4()
    stage = Stage(stage_id=stage_id, project_id=project_id, name="Test Stage", order_index=1)
    db.add(stage)
    
    eng_team_id = uuid.uuid4()
    eng_team = Team(team_id=eng_team_id, project_id=project_id, name="Engineering")
    db.add(eng_team)
    
    qa_team_id = uuid.uuid4()
    qa_team = Team(team_id=qa_team_id, project_id=project_id, name="QA")
    db.add(qa_team)

    db.commit()
    
    yield db, tenant_id, project_id, stage_id, eng_team_id, qa_team_id
    
    db.close()
    Base.metadata.drop_all(bind=engine)


def test_access_control_logic(setup_db):
    db, tenant_id, project_id, stage_id, eng_team_id, qa_team_id = setup_db
    
    # Create Users
    user_qa = User(tenant_id=tenant_id, email="qa@test.com", clearance=SensitivityLevel.internal)
    user_eng = User(tenant_id=tenant_id, email="eng@test.com", clearance=SensitivityLevel.restricted)
    user_org_admin = User(tenant_id=tenant_id, email="admin@test.com", is_org_admin=True)
    user_proj_admin = User(tenant_id=tenant_id, email="padmin@test.com", clearance=SensitivityLevel.restricted)
    user_no_role = User(tenant_id=tenant_id, email="norole@test.com", clearance=SensitivityLevel.restricted)
    db.add_all([user_qa, user_eng, user_org_admin, user_proj_admin, user_no_role])
    db.commit()
    
    # Assign Roles
    db.add(ProjectAdmin(user_id=user_proj_admin.user_id, project_id=project_id))
    
    # Assign Teams
    db.add(UserTeamMembership(user_id=user_qa.user_id, project_id=project_id, team_id=qa_team_id, role=TeamRole.contributor))
    db.add(UserTeamMembership(user_id=user_eng.user_id, project_id=project_id, team_id=eng_team_id, role=TeamRole.contributor))
    
    db.commit()

    # Create Document: Confidential, visible only to Engineering
    doc = Document(
        tenant_id=tenant_id,
        project_id=project_id,
        stage_id=stage_id,
        uploaded_by=user_eng.user_id,
        uploaded_as_team_id=eng_team_id,
        sensitivity_level=SensitivityLevel.confidential,
        original_filename="secret.pdf",
        mime_type="application/pdf"
    )
    db.add(doc)
    db.commit()
    
    db.add(DocumentTeamVisibility(document_id=doc.document_id, team_id=eng_team_id))
    db.commit()

    # 1. Same team, sufficient clearance (Eng user) -> should access
    assert can_access(db, user_eng, project_id, doc, "read") is True
    
    # 2. Same project, different team (QA user) blocked by team visibility
    assert can_access(db, user_qa, project_id, doc, "read") is False
    
    # 3. Modify doc to be visible to QA, but QA user has internal clearance (doc is confidential) -> blocked by clearance
    db.add(DocumentTeamVisibility(document_id=doc.document_id, team_id=qa_team_id))
    db.commit()
    assert can_access(db, user_qa, project_id, doc, "read") is False
    
    # 4. Org Admin bypass -> should access regardless of team or clearance
    assert can_access(db, user_org_admin, project_id, doc, "read") is True
    
    # 5. Project Admin bypass team visibility -> should access
    assert can_access(db, user_proj_admin, project_id, doc, "read") is True
    
    # 6. No project admin and no team role -> blocked
    assert can_access(db, user_no_role, project_id, doc, "read") is False
