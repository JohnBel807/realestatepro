"""
schemas.py — Pydantic schemas (request/response validation)
"""

from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Any
from datetime import datetime
from models import PlanType, SubscriptionStatus, PropertyType, ListingType


# ─── Auth ─────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    phone: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    avatar_url: Optional[str]
    is_active: bool
    trial_ends_at: Optional[datetime]
    created_at: datetime
    class Config: from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str


# ─── Property ─────────────────────────────────────────────────────────────────
class PropertyBase(BaseModel):
    title: str
    description: Optional[str] = None
    listing_type: ListingType = ListingType.sale
    price: float
    price_currency: str = "COP"
    area_m2: float
    bedrooms: int = 0
    bathrooms: int = 0
    parking_spots: int = 0
    property_type: PropertyType = PropertyType.apartment
    address: str
    city: str
    neighborhood: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photos: List[str] = []
    main_photo: Optional[str] = None
    features: List[str] = []
    is_furnished: bool = False
    has_balcony: bool = False
    has_elevator: bool = False
    pet_friendly: bool = False
    # Campos de arriendo
    rental_price: Optional[float] = None
    rental_deposit: Optional[float] = None
    rental_min_months: Optional[int] = None
    rental_includes_admin: bool = False
    admin_fee: Optional[float] = None
    available_from: Optional[datetime] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    listing_type: Optional[str] = None
    price: Optional[float] = None
    area_m2: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    photos: Optional[List[str]] = None
    main_photo: Optional[str] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None
    rental_price: Optional[float] = None
    rental_deposit: Optional[float] = None
    rental_min_months: Optional[int] = None
    rental_includes_admin: Optional[bool] = None
    admin_fee: Optional[float] = None
    available_from: Optional[datetime] = None

class PropertyOut(PropertyBase):
    id: int
    owner_id: int
    is_active: bool
    is_featured: bool
    views_count: int
    created_at: datetime
    owner: Optional[UserOut] = None
    class Config: from_attributes = True

class PropertyList(BaseModel):
    items: List[PropertyOut]
    total: int
    skip: int
    limit: int

class PropertyFilters(BaseModel):
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_m2: Optional[float] = None
    max_m2: Optional[float] = None
    bedrooms: Optional[int] = None
    city: Optional[str] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = None


# ─── Subscription ─────────────────────────────────────────────────────────────
class SubscriptionOut(BaseModel):
    id: int
    plan_type: PlanType
    status: SubscriptionStatus
    max_properties: int
    current_period_end: Optional[datetime]
    class Config: from_attributes = True

class PlanRequest(BaseModel):
    plan_type: str

    @validator("plan_type")
    def validate_plan(cls, v):
        if v not in ("basic", "pro", "enterprise"):
            raise ValueError("Plan debe ser: basic, pro, o enterprise")
        return v