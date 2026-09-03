import uuid
import os
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import DATABASE_URL
from app.models.tenant import Tenant
from app.models.project import Project
from app.models.stage import Stage
from app.models.team import Team, UserTeamMembership, TeamRole
from app.models.user import User
from app.models.document import Document, DocumentVersion, SensitivityLevel, DocumentTeamVisibility, DocumentStatus

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def seed():
    print("Clearing old project data (preserving users/tenants)...")
    db.query(DocumentTeamVisibility).delete()
    db.query(DocumentVersion).delete()
    db.query(Document).delete()
    db.query(UserTeamMembership).delete()
    db.query(Team).delete()
    db.query(Stage).delete()
    db.query(Project).delete()
    db.commit()

    # Get the existing user (created during Google sign in)
    user = db.query(User).first()
    if not user:
        print("No user found! Please sign in with Google first so a user exists.")
        return

    tenant_id = user.tenant_id

    print("Creating Project...")
    project = Project(
        tenant_id=tenant_id, 
        name="DocFlow Alpha Migration",
        description="Migrating the legacy system to DocFlow.",
        status="Active"
    )
    db.add(project)
    db.flush()

    print("Creating Stages...")
    stage_req = Stage(project_id=project.project_id, name="Requirements", order_index=1)
    stage_design = Stage(project_id=project.project_id, name="Design", order_index=2)
    stage_dev = Stage(project_id=project.project_id, name="Development", order_index=3)
    db.add_all([stage_req, stage_design, stage_dev])
    db.flush()

    print("Creating Teams...")
    team_eng = Team(project_id=project.project_id, name="Engineering")
    team_qa = Team(project_id=project.project_id, name="QA")
    db.add_all([team_eng, team_qa])
    db.flush()

    print("Assigning user to QA team (Viewer)...")
    # User is in QA, so they should only see QA-visible documents
    # Give them high enough clearance to see confidential docs, but team visibility will block them
    user.clearance = SensitivityLevel.restricted
    user.is_org_admin = False # Make sure they aren't org admin, otherwise RBAC is bypassed
    db.add(user)

    membership = UserTeamMembership(
        user_id=user.user_id,
        project_id=project.project_id,
        team_id=team_qa.team_id,
        role=TeamRole.viewer
    )
    db.add(membership)
    db.flush()

    print("Creating Documents...")
    
    # Doc 1: Public, visible to QA (User CAN see this)
    doc1 = Document(
        tenant_id=tenant_id,
        project_id=project.project_id,
        stage_id=stage_req.stage_id,
        uploaded_by=user.user_id,
        uploaded_as_team_id=team_qa.team_id,
        sensitivity_level=SensitivityLevel.internal,
        original_filename="Public_Requirements.pdf",
        mime_type="application/pdf"
    )
    db.add(doc1)
    db.flush()

    doc1_ver = DocumentVersion(
        document_id=doc1.document_id,
        version_number=1,
        file_path="mock/path/req.pdf",
        file_size_bytes=1024 * 1024 * 2, # 2MB
        uploaded_by=user.user_id,
        status=DocumentStatus.indexed
    )
    db.add(doc1_ver)
    db.flush()
    doc1.current_version_id = doc1_ver.version_id
    db.add(DocumentTeamVisibility(document_id=doc1.document_id, team_id=team_qa.team_id))

    # Doc 2: Confidential, visible to Engineering ONLY (User CANNOT see this right now!)
    doc2 = Document(
        tenant_id=tenant_id,
        project_id=project.project_id,
        stage_id=stage_design.stage_id,
        uploaded_by=user.user_id,
        uploaded_as_team_id=team_eng.team_id,
        sensitivity_level=SensitivityLevel.confidential,
        original_filename="Secret_Architecture.docx",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    db.add(doc2)
    db.flush()

    doc2_ver = DocumentVersion(
        document_id=doc2.document_id,
        version_number=1,
        file_path="mock/path/arch.docx",
        file_size_bytes=1024 * 512, # 512KB
        uploaded_by=user.user_id,
        status=DocumentStatus.indexed
    )
    db.add(doc2_ver)
    db.flush()
    doc2.current_version_id = doc2_ver.version_id
    db.add(DocumentTeamVisibility(document_id=doc2.document_id, team_id=team_eng.team_id))

    db.commit()
    print(f"Seed complete! Project ID: {project.project_id}")
    print("User is currently in the QA team. They should see 'Public_Requirements.pdf' but NOT 'Secret_Architecture.docx'.")

if __name__ == "__main__":
    seed()
