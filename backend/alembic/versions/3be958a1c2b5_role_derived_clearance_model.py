"""role_derived_clearance_model

Revision ID: 3be958a1c2b5
Revises: 8d3983d84fbf
Create Date: 2026-09-05 14:58:43.448008

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3be958a1c2b5'
down_revision: Union[str, None] = '8d3983d84fbf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Migrate users with 'restricted' to 'confidential'
    op.execute("UPDATE users SET clearance = 'confidential' WHERE clearance = 'restricted'")
    
    # 2. Update sensitivity_level enum to remove 'restricted'
    op.execute("ALTER TYPE sensitivity_level RENAME TO sensitivity_level_old")
    op.execute("CREATE TYPE sensitivity_level AS ENUM('public', 'internal', 'confidential')")
    
    op.execute("ALTER TABLE documents ALTER COLUMN sensitivity_level DROP DEFAULT")
    op.execute("ALTER TABLE documents ALTER COLUMN sensitivity_level TYPE sensitivity_level USING sensitivity_level::text::sensitivity_level")
    op.execute("ALTER TABLE documents ALTER COLUMN sensitivity_level SET DEFAULT 'internal'::sensitivity_level")
    
    op.execute("ALTER TABLE users ALTER COLUMN clearance DROP DEFAULT")
    op.execute("ALTER TABLE users ALTER COLUMN clearance TYPE sensitivity_level USING clearance::text::sensitivity_level")
    op.execute("ALTER TABLE users ALTER COLUMN clearance SET DEFAULT 'internal'::sensitivity_level")
    
    op.execute("DROP TYPE sensitivity_level_old")

    # 3. Create access_requests table
    op.create_table(
        'access_requests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('team_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('requested_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('reviewed_by', sa.UUID(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.project_id'], ),
        sa.ForeignKeyConstraint(['team_id'], ['teams.team_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.user_id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('access_requests')
    
    op.execute("ALTER TYPE sensitivity_level RENAME TO sensitivity_level_old")
    op.execute("CREATE TYPE sensitivity_level AS ENUM('public', 'internal', 'confidential', 'restricted')")
    op.execute("ALTER TABLE documents ALTER COLUMN sensitivity_level TYPE sensitivity_level USING sensitivity_level::text::sensitivity_level")
    op.execute("ALTER TABLE users ALTER COLUMN clearance TYPE sensitivity_level USING clearance::text::sensitivity_level")
    op.execute("DROP TYPE sensitivity_level_old")
