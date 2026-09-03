"""Add RBAC and ABAC schema

Revision ID: 333333333333
Revises: 975958034b69
Create Date: 2026-09-03 18:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '333333333333'
down_revision: Union[str, None] = '522f44ffb7e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add clearance to users (using existing sensitivity_level enum)
    sensitivity_level = postgresql.ENUM('public', 'internal', 'confidential', 'restricted', name='sensitivity_level', create_type=False)
    op.add_column('users', sa.Column('clearance', sensitivity_level, server_default='internal', nullable=False))

    # 2. Modify document_versions (drop file_data, add file_path)
    op.add_column('document_versions', sa.Column('file_path', sa.String(length=1000), server_default='', nullable=False))
    op.drop_column('document_versions', 'file_data')


def downgrade() -> None:
    # 1. Revert document_versions
    op.add_column('document_versions', sa.Column('file_data', sa.LargeBinary(), server_default=b'', nullable=False))
    op.drop_column('document_versions', 'file_path')

    # 2. Remove clearance from users
    op.drop_column('users', 'clearance')
