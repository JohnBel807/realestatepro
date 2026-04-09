"""Initial migration — create all tables

Revision ID: 0001
Revises: 
Create Date: 2025-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enums
    plan_type = postgresql.ENUM('basic', 'pro', 'enterprise', name='plan_type')
    sub_status = postgresql.ENUM('active', 'inactive', 'canceled', 'past_due', name='subscription_status')
    prop_type = postgresql.ENUM('apartment', 'house', 'office', 'land', 'commercial', name='property_type')
    plan_type.create(op.get_bind())
    sub_status.create(op.get_bind())
    prop_type.create(op.get_bind())

    # users
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('is_verified', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('idx_users_email', 'users', ['email'])

    # subscriptions
    op.create_table('subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('stripe_customer_id', sa.String(255), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(255), nullable=True),
        sa.Column('plan_type', sa.Enum('basic', 'pro', 'enterprise', name='plan_type'), nullable=False),
        sa.Column('status', sa.Enum('active', 'inactive', 'canceled', 'past_due', name='subscription_status'), server_default='active'),
        sa.Column('max_properties', sa.Integer(), server_default='5'),
        sa.Column('max_photos_per_property', sa.Integer(), server_default='5'),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('canceled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        sa.UniqueConstraint('stripe_customer_id'),
        sa.UniqueConstraint('stripe_subscription_id'),
    )

    # properties
    op.create_table('properties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('price_currency', sa.String(3), server_default='COP'),
        sa.Column('area_m2', sa.Float(), nullable=False),
        sa.Column('bedrooms', sa.Integer(), server_default='0'),
        sa.Column('bathrooms', sa.Integer(), server_default='0'),
        sa.Column('parking_spots', sa.Integer(), server_default='0'),
        sa.Column('floor', sa.Integer(), nullable=True),
        sa.Column('total_floors', sa.Integer(), nullable=True),
        sa.Column('property_type', sa.Enum('apartment', 'house', 'office', 'land', 'commercial', name='property_type'), server_default='apartment'),
        sa.Column('address', sa.String(500), nullable=False),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('neighborhood', sa.String(100), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('photos', postgresql.JSONB(), server_default='[]'),
        sa.Column('main_photo', sa.String(500), nullable=True),
        sa.Column('virtual_tour_url', sa.String(500), nullable=True),
        sa.Column('features', postgresql.JSONB(), server_default='[]'),
        sa.Column('is_furnished', sa.Boolean(), server_default='false'),
        sa.Column('has_balcony', sa.Boolean(), server_default='false'),
        sa.Column('has_elevator', sa.Boolean(), server_default='false'),
        sa.Column('pet_friendly', sa.Boolean(), server_default='false'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('is_featured', sa.Boolean(), server_default='false'),
        sa.Column('views_count', sa.Integer(), server_default='0'),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_properties_city', 'properties', ['city'])
    op.create_index('idx_properties_price', 'properties', ['price'])
    op.create_index('idx_properties_owner', 'properties', ['owner_id'])
    op.create_index('idx_properties_active', 'properties', ['is_active'])
    op.create_index('idx_properties_active_city', 'properties', ['is_active', 'city'])


def downgrade() -> None:
    op.drop_table('properties')
    op.drop_table('subscriptions')
    op.drop_table('users')
    op.execute("DROP TYPE IF EXISTS property_type")
    op.execute("DROP TYPE IF EXISTS subscription_status")
    op.execute("DROP TYPE IF EXISTS plan_type")
