"""
models.py — SQLAlchemy ORM Models
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class PlanType(str, enum.Enum):
    basic = "basic"
    pro = "pro"
    enterprise = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    canceled = "canceled"
    past_due = "past_due"
    trialing = "trialing"


class ListingType(str, enum.Enum):
    sale = "sale"           # Venta
    rent = "rent"           # Arriendo
    rent_sale = "rent_sale" # Arriendo y venta


class PropertyType(str, enum.Enum):
    apartment = "apartment"
    house = "house"
    office = "office"
    land = "land"
    commercial = "commercial"


# ─── User ─────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)          # Admin sin restricciones
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    # Recuperación de contraseña
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False)


# ─── Property ─────────────────────────────────────────────────────────────────
class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False, index=True)
    price_currency = Column(String(3), default="COP")
    area_m2 = Column(Float, nullable=False)
    bedrooms = Column(Integer, default=0)
    bathrooms = Column(Integer, default=0)
    parking_spots = Column(Integer, default=0)
    floor = Column(Integer, nullable=True)
    total_floors = Column(Integer, nullable=True)
    property_type = Column(Enum(PropertyType), default=PropertyType.apartment)

    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    neighborhood = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    photos = Column(JSON, default=list)
    main_photo = Column(String(500), nullable=True)
    virtual_tour_url = Column(String(500), nullable=True)

    features = Column(JSON, default=list)
    is_furnished = Column(Boolean, default=False)
    has_balcony = Column(Boolean, default=False)
    has_elevator = Column(Boolean, default=False)
    pet_friendly = Column(Boolean, default=False)

    # ─── Tipo de negocio ─────────────────────────────────────────────────────
    listing_type = Column(Enum(ListingType), default=ListingType.sale, index=True)

    # ─── Campos de arriendo ───────────────────────────────────────────────────
    rental_price = Column(Float, nullable=True)           # precio mensual arriendo
    rental_deposit = Column(Float, nullable=True)         # depósito / fianza
    rental_min_months = Column(Integer, nullable=True)    # mínimo de meses
    rental_includes_admin = Column(Boolean, default=False) # administración incluida
    admin_fee = Column(Float, nullable=True)              # valor administración
    available_from = Column(DateTime(timezone=True), nullable=True)

    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    views_count = Column(Integer, default=0)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="properties")


# ─── Subscription ─────────────────────────────────────────────────────────────
class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    stripe_customer_id = Column(String(255), unique=True, nullable=True)
    stripe_subscription_id = Column(String(255), unique=True, nullable=True)

    plan_type = Column(Enum(PlanType), nullable=False)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.active)

    max_properties = Column(Integer, default=5)
    max_photos_per_property = Column(Integer, default=5)

    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    canceled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="subscription")