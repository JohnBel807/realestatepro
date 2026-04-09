"""
RealEstate Pro — FastAPI Backend
main.py: Entry point, routes, middleware, auth
"""

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
import stripe
import os

from database import get_db, engine
import models, schemas, crud
from auth import (
    verify_password, get_password_hash,
    create_access_token, decode_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# ─── App Init ────────────────────────────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RealEstate Pro API",
    version="1.0.0",
    description="Portal inmobiliario — Backend API"
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_...")

# Construir lista de orígenes permitidos dinámicamente
_frontend_url = os.getenv("FRONTEND_URL", "")
_allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://realestatepro-nine.vercel.app", # Tu URL actual de Vercel
]
# Agregar la URL de producción si está definida
"""if _frontend_url:
    _allowed_origins.append(_frontend_url)
    # Soportar también con/sin www y subdominios de Vercel
    if "vercel.app" in _frontend_url:
        # Permite cualquier subdominio de vercel.app para previews de PR
        _allowed_origins.append(_frontend_url.replace("https://", "https://*."))"""

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    #allow_origin_regex=r"https://.*\.vercel\.app",  # permite todos los previews de Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


# ─── Dependencies ─────────────────────────────────────────────────────────────
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = crud.get_user(db, user_id=int(user_id))
    if user is None:
        raise credentials_exception
    return user


def require_active_subscription(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> models.User:
    """Middleware: verifica suscripción activa antes de publicar propiedades."""
    subscription = crud.get_active_subscription(db, user_id=current_user.id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere una suscripción activa para publicar propiedades. "
                   "Visita /pricing para ver nuestros planes."
        )
    return current_user


# ─── Auth Routes ──────────────────────────────────────────────────────────────
@app.post("/auth/register", response_model=schemas.UserOut, tags=["Auth"])
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, email=user_in.email):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    hashed = get_password_hash(user_in.password)
    user = crud.create_user(db, user_in=user_in, hashed_password=hashed)
    return user


@app.post("/auth/token", response_model=schemas.Token, tags=["Auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.UserOut, tags=["Auth"])
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ─── Properties Routes ────────────────────────────────────────────────────────
@app.get("/properties", response_model=schemas.PropertyList, tags=["Properties"])
def list_properties(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_m2: Optional[float] = None,
    max_m2: Optional[float] = None,
    bedrooms: Optional[int] = None,
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Listado público con filtros avanzados. No requiere autenticación."""
    filters = schemas.PropertyFilters(
        min_price=min_price, max_price=max_price,
        min_m2=min_m2, max_m2=max_m2,
        bedrooms=bedrooms, city=city,
        property_type=property_type
    )
    properties, total = crud.get_properties(db, skip=skip, limit=limit, filters=filters)
    return {"items": properties, "total": total, "skip": skip, "limit": limit}


@app.get("/properties/{property_id}", response_model=schemas.PropertyOut, tags=["Properties"])
def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = crud.get_property(db, property_id=property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    return prop


@app.post("/properties", response_model=schemas.PropertyOut, status_code=201, tags=["Properties"])
def create_property(
    property_in: schemas.PropertyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_active_subscription)   # ← middleware suscripción
):
    """Crear propiedad. Requiere JWT + suscripción activa."""
    return crud.create_property(db, property_in=property_in, owner_id=current_user.id)


@app.put("/properties/{property_id}", response_model=schemas.PropertyOut, tags=["Properties"])
def update_property(
    property_id: int,
    property_in: schemas.PropertyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Editar propiedad. Solo el dueño puede modificarla."""
    prop = crud.get_property(db, property_id=property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    if prop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar esta propiedad")
    return crud.update_property(db, prop=prop, property_in=property_in)


@app.delete("/properties/{property_id}", status_code=204, tags=["Properties"])
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    prop = crud.get_property(db, property_id=property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    if prop.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permiso")
    crud.delete_property(db, prop=prop)


# ─── Stripe / Subscription Routes ─────────────────────────────────────────────
STRIPE_PRICE_IDS = {
    "basic": os.getenv("STRIPE_PRICE_BASIC", "price_basic_xxx"),
    "pro": os.getenv("STRIPE_PRICE_PRO", "price_pro_xxx"),
    "enterprise": os.getenv("STRIPE_PRICE_ENTERPRISE", "price_enterprise_xxx"),
}


@app.post("/create-checkout-session", tags=["Subscriptions"])
def create_checkout_session(
    plan: schemas.PlanRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    price_id = STRIPE_PRICE_IDS.get(plan.plan_type)
    if not price_id:
        raise HTTPException(status_code=400, detail="Plan inválido")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            customer_email=current_user.email,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{os.getenv('FRONTEND_URL')}/dashboard?subscription=success",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/pricing?canceled=true",
            metadata={"user_id": str(current_user.id), "plan_type": plan.plan_type},
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/webhooks/stripe", tags=["Subscriptions"])
async def stripe_webhook(request, db: Session = Depends(get_db)):
    """Recibe eventos de Stripe y actualiza el estado de suscripción."""
    import json
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception:
        raise HTTPException(status_code=400, detail="Webhook inválido")

    if event["type"] == "checkout.session.completed":
        session_data = event["data"]["object"]
        user_id = int(session_data["metadata"]["user_id"])
        plan_type = session_data["metadata"]["plan_type"]
        stripe_customer_id = session_data["customer"]
        stripe_subscription_id = session_data["subscription"]
        crud.upsert_subscription(db, user_id=user_id, plan_type=plan_type,
                                  stripe_customer_id=stripe_customer_id,
                                  stripe_subscription_id=stripe_subscription_id)

    elif event["type"] in ("customer.subscription.deleted", "customer.subscription.paused"):
        sub_data = event["data"]["object"]
        crud.deactivate_subscription(db, stripe_subscription_id=sub_data["id"])

    return {"received": True}


# ─── Dashboard ────────────────────────────────────────────────────────────────
@app.get("/dashboard/my-properties", response_model=List[schemas.PropertyOut], tags=["Dashboard"])
def my_properties(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_properties_by_owner(db, owner_id=current_user.id)


@app.get("/dashboard/subscription", response_model=schemas.SubscriptionOut, tags=["Dashboard"])
def my_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sub = crud.get_active_subscription(db, user_id=current_user.id)
    if not sub:
        raise HTTPException(status_code=404, detail="Sin suscripción activa")
    return sub