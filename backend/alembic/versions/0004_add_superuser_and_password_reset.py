"""add superuser and password reset fields

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-23

"""
from alembic import op
import sqlalchemy as sa

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users',
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users',
        sa.Column('password_reset_token', sa.String(255), nullable=True))
    op.add_column('users',
        sa.Column('password_reset_expires', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column('users', 'password_reset_expires')
    op.drop_column('users', 'password_reset_token')
    op.drop_column('users', 'is_superuser')