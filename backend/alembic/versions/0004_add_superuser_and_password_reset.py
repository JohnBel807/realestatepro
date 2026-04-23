"""add superuser and password reset fields

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-23

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    existing = [c['name'] for c in inspector.get_columns('users')]

    if 'is_superuser' not in existing:
        op.add_column('users',
            sa.Column('is_superuser', sa.Boolean(),
                      nullable=False, server_default='false'))

    if 'password_reset_token' not in existing:
        op.add_column('users',
            sa.Column('password_reset_token', sa.String(255), nullable=True))

    if 'password_reset_expires' not in existing:
        op.add_column('users',
            sa.Column('password_reset_expires',
                      sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column('users', 'password_reset_expires')
    op.drop_column('users', 'password_reset_token')
    op.drop_column('users', 'is_superuser')