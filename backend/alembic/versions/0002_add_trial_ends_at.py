"""add trial_ends_at to users

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade():
    # Verificar si la columna ya existe antes de agregarla
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [c['name'] for c in inspector.get_columns('users')]
    if 'trial_ends_at' not in columns:
        op.add_column('users',
            sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column('users', 'trial_ends_at')