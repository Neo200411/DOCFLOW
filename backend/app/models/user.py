import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


from app.models.document import SensitivityLevel
from sqlalchemy import Enum

class User(Base):
    """
    Minimal user record. Authentication (login/session) is handled by an
    external provider (choice deferred, per Phase 0) — this table just
    stores the verified identity + org-level role used by our own ABAC logic.
    """
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    is_org_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    clearance: Mapped[SensitivityLevel] = mapped_column(
        Enum(SensitivityLevel, name="sensitivity_level", create_type=False),
        default=SensitivityLevel.internal,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
