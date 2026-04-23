"""Add rental fields to properties

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-09
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    prop_cols = [c['name'] for c in inspector.get_columns('properties')]

    # Crear enum listing_type solo si no existe
    result = bind.execute(text(
        "SELECT 1 FROM pg_type WHERE typname = 'listing_type'"
    ))
    if not result.fetchone():
        op.execute("CREATE TYPE listing_type AS ENUM ('sale', 'rent', 'rent_sale')")

    # Agregar columnas solo si no existen
    if 'listing_type' not in prop_cols:
        op.add_column('properties', sa.Column('listing_type',
            sa.Enum('sale', 'rent', 'rent_sale', name='listing_type'),
            nullable=True, server_default='sale'))

    if 'rental_price' not in prop_cols:
        op.add_column('properties', sa.Column('rental_price', sa.Float(), nullable=True))

    if 'rental_deposit' not in prop_cols:
        op.add_column('properties', sa.Column('rental_deposit', sa.Float(), nullable=True))

    if 'rental_min_months' not in prop_cols:
        op.add_column('properties', sa.Column('rental_min_months', sa.Integer(), nullable=True))

    if 'rental_includes_admin' not in prop_cols:
        op.add_column('properties', sa.Column('rental_includes_admin',
            sa.Boolean(), server_default='false'))

    if 'admin_fee' not in prop_cols:
        op.add_column('properties', sa.Column('admin_fee', sa.Float(), nullable=True))

    if 'available_from' not in prop_cols:
        op.add_column('properties', sa.Column('available_from',
            sa.DateTime(timezone=True), nullable=True))

    # Índice solo si no existe
    indexes = [idx['name'] for idx in inspector.get_indexes('properties')]
    if 'idx_properties_listing_type' not in indexes:
        op.create_index('idx_properties_listing_type', 'properties', ['listing_type'])


def downgrade() -> None:
    op.drop_index('idx_properties_listing_type', 'properties')
    op.drop_column('properties', 'available_from')
    op.drop_column('properties', 'admin_fee')
    op.drop_column('properties', 'rental_includes_admin')
    op.drop_column('properties', 'rental_min_months')
    op.drop_column('properties', 'rental_deposit')
    op.drop_column('properties', 'rental_price')
    op.drop_column('properties', 'listing_type')
    op.execute("DROP TYPE listing_type")