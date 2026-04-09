"""
crud.py — Database operations (Create, Read, Update, Delete)
"""

from sqlalchemy.orm import Session
from typing import Optional, Tuple, List
import models, schemas
from models import SubscriptionStatus


PLAN_LIMITS = {
    "basic":      {"max_properties": 5,  "max_photos": 5},
    "pro":        {"max_properties": 25, "max_photos": 15},
    "enterprise": {"max_properties": -1, "max_photos": -1},
}


# ─── User CRUD ────────────────────────────────────────────────────────────────
def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user_in: schemas.UserCreate, hashed_password: str) -> models.User:
    user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        phone=user_in.phone,
        hashed_password=hashed_password,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user: models.User, data: dict) -> models.User:
    for key, value in data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


# ─── Property CRUD ────────────────────────────────────────────────────────────
def get_property(db: Session, property_id: int) -> Optional[models.Property]:
    return db.query(models.Property).filter(
        models.Property.id == property_id,
        models.Property.is_active == True
    ).first()

def get_properties(db: Session, skip: int, limit: int, filters: schemas.PropertyFilters) -> Tuple[List[models.Property], int]:
    query = db.query(models.Property).filter(models.Property.is_active == True)
    if filters.min_price is not None:
        query = query.filter(models.Property.price >= filters.min_price)
    if filters.max_price is not None:
        query = query.filter(models.Property.price <= filters.max_price)
    if filters.min_m2 is not None:
        query = query.filter(models.Property.area_m2 >= filters.min_m2)
    if filters.max_m2 is not None:
        query = query.filter(models.Property.area_m2 <= filters.max_m2)
    if filters.bedrooms is not None:
        query = query.filter(models.Property.bedrooms == filters.bedrooms)
    if filters.city:
        query = query.filter(models.Property.city.ilike(f"%{filters.city}%"))
    if filters.property_type:
        query = query.filter(models.Property.property_type == filters.property_type)
    total = query.count()
    props = query.order_by(
        models.Property.is_featured.desc(),
        models.Property.created_at.desc()
    ).offset(skip).limit(limit).all()
    return props, total

def get_properties_by_owner(db: Session, owner_id: int) -> List[models.Property]:
    return db.query(models.Property).filter(
        models.Property.owner_id == owner_id
    ).order_by(models.Property.created_at.desc()).all()

def create_property(db: Session, property_in: schemas.PropertyCreate, owner_id: int) -> models.Property:
    prop = models.Property(**property_in.dict(), owner_id=owner_id)
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop

def update_property(db: Session, prop: models.Property, property_in: schemas.PropertyUpdate) -> models.Property:
    update_data = property_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prop, field, value)
    db.commit()
    db.refresh(prop)
    return prop

def delete_property(db: Session, prop: models.Property):
    prop.is_active = False
    db.commit()

def increment_views(db: Session, property_id: int):
    db.query(models.Property).filter(
        models.Property.id == property_id
    ).update({"views_count": models.Property.views_count + 1})
    db.commit()


# ─── Subscription CRUD ────────────────────────────────────────────────────────
def get_active_subscription(db: Session, user_id: int) -> Optional[models.Subscription]:
    return db.query(models.Subscription).filter(
        models.Subscription.user_id == user_id,
        models.Subscription.status == SubscriptionStatus.active
    ).first()

def upsert_subscription(db: Session, user_id: int, plan_type: str,
                         stripe_customer_id: str, stripe_subscription_id: str) -> models.Subscription:
    sub = db.query(models.Subscription).filter(models.Subscription.user_id == user_id).first()
    limits = PLAN_LIMITS.get(plan_type, PLAN_LIMITS["basic"])
    if sub:
        sub.plan_type = plan_type
        sub.status = SubscriptionStatus.active
        sub.stripe_customer_id = stripe_customer_id
        sub.stripe_subscription_id = stripe_subscription_id
        sub.max_properties = limits["max_properties"]
        sub.max_photos_per_property = limits["max_photos"]
    else:
        sub = models.Subscription(
            user_id=user_id, plan_type=plan_type,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=stripe_subscription_id,
            status=SubscriptionStatus.active,
            max_properties=limits["max_properties"],
            max_photos_per_property=limits["max_photos"],
        )
        db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

def deactivate_subscription(db: Session, stripe_subscription_id: str):
    sub = db.query(models.Subscription).filter(
        models.Subscription.stripe_subscription_id == stripe_subscription_id
    ).first()
    if sub:
        sub.status = SubscriptionStatus.canceled
        db.commit()
