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
import os
from payments    import create_payment_link, verify_wompi_signature, parse_wompi_event
from cross_auth  import router as cross_auth_router
from email_service import send_welcome_email

from database import get_db, engine
import models, schemas, crud
from auth import (
    verify_password, get_password_hash,
    create_access_token, decode_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# ─── App Init ────────────────────────────────────────────────────────────────
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RealEstate Pro API",
    version="1.0.0",
    description="Portal inmobiliario — Backend API"
)

# CORS — permite todos los orígenes de Vercel + localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # En producción estable puedes restringir
    allow_credentials=False,      # Debe ser False cuando allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Crea tablas y loguea diagnóstico al arrancar."""
    try:
        models.Base.metadata.create_all(bind=engine)
        logger.info("✅ Tablas creadas/verificadas correctamente")
    except Exception as e:
        logger.error(f"❌ Error creando tablas: {e}")
    logger.info(f"🌐 FRONTEND_URL: {os.getenv('FRONTEND_URL', 'no definida')}")
    logger.info(f"🗄️  DATABASE_URL definida: {bool(os.getenv('DATABASE_URL'))}")
    logger.info(f"🔑 JWT_SECRET_KEY definida: {bool(os.getenv('JWT_SECRET_KEY'))}")

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
    """Middleware: verifica suscripción activa O trial vigente antes de publicar."""
    # Permitir si está en período de trial
    if crud.is_trial_active(current_user):
        return current_user
    # Permitir si tiene suscripción activa
    subscription = crud.get_active_subscription(db, user_id=current_user.id)
    if not subscription:
        days = crud.trial_days_remaining(current_user)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu período de prueba ha expirado. Visita /pricing para elegir un plan."
                   if days == 0 else
                   f"Se requiere suscripción activa. Te quedan {days} días de prueba."
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


@app.get("/auth/me", tags=["Auth"])
def me(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Devuelve datos del usuario + info de suscripción activa.
    Incluye subscription_plan y has_active_subscription para compatibilidad
    con velezyricaurte.info SSO."""
    sub = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id,
        models.Subscription.status == "active",
    ).first()

    return {
        "id":                     current_user.id,
        "email":                  current_user.email,
        "full_name":              current_user.full_name,
        "phone":                  current_user.phone,
        "avatar_url":             current_user.avatar_url if hasattr(current_user, "avatar_url") else None,
        "is_active":              current_user.is_active,
        "trial_ends_at":          current_user.trial_ends_at,
        "created_at":             current_user.created_at,
        "subscription_plan":      sub.plan_type if sub else "free",
        "has_active_subscription": sub is not None,
    }


@app.get("/auth/trial-status", tags=["Auth"])
def trial_status(current_user: models.User = Depends(get_current_user)):
    """Retorna el estado del trial del usuario actual."""
    return {
        "trial_active": crud.is_trial_active(current_user),
        "trial_days_remaining": crud.trial_days_remaining(current_user),
        "trial_ends_at": current_user.trial_ends_at,
    }


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
    listing_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Listado público con filtros avanzados. No requiere autenticación."""
    filters = schemas.PropertyFilters(
        min_price=min_price, max_price=max_price,
        min_m2=min_m2, max_m2=max_m2,
        bedrooms=bedrooms, city=city,
        property_type=property_type,
        listing_type=listing_type,
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
@app.post("/create-checkout-session", tags=["Subscriptions"])
async def create_checkout_session(
    plan: schemas.PlanRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Crea un enlace de pago en Wompi (Colombia)."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    redirect_url = f"{frontend_url}/dashboard?subscription=success"

    result = await create_payment_link(
        plan_type=plan.plan_type,
        user_id=current_user.id,
        user_email=current_user.email,
        redirect_url=redirect_url,
    )
    return {"checkout_url": result["payment_url"], "link_id": result["link_id"]}


@app.post("/webhooks/wompi", tags=["Subscriptions"])
async def wompi_webhook(request, db: Session = Depends(get_db)):
    """Recibe eventos de Wompi y actualiza el estado de suscripción."""
    from fastapi import Request
    body = await request.json()

    # Verificar firma
    signature = request.headers.get("x-event-checksum", "")
    if not verify_wompi_signature(body, signature):
        logger.warning("Wompi webhook con firma inválida")
        # No rechazamos — Wompi sandbox no siempre firma
        # En producción descomenta la línea siguiente:
        # raise HTTPException(status_code=400, detail="Firma inválida")

    event = parse_wompi_event(body)
    logger.info(f"Wompi event: {event['event_type']} status={event['status']}")

    if event["approved"] and event["user_id"] and event["plan_type"]:
        try:
            user_id = int(event["user_id"])
            crud.upsert_subscription(
                db,
                user_id=user_id,
                plan_type=event["plan_type"],
                stripe_customer_id=f"wompi_{event['transaction_id']}",
                stripe_subscription_id=f"wompi_{event['transaction_id']}",
            )
            logger.info(f"Suscripción activada: user={user_id} plan={event['plan_type']}")
        except Exception as e:
            logger.error(f"Error activando suscripción: {e}")

    return {"received": True}


# ─── Wompi redirect handler ──────────────────────────────────────────────────
@app.get("/dashboard/activate-subscription", tags=["Subscriptions"])
async def activate_subscription_on_redirect(
    plan: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    El frontend llama este endpoint cuando el usuario vuelve de Wompi
    con ?subscription=success&plan=pro en la URL.
    Activa la suscripción sin esperar el webhook.
    """
    if plan not in ("basic", "pro", "enterprise"):
        raise HTTPException(400, "Plan inválido")

    sub = crud.upsert_subscription(
        db,
        user_id=current_user.id,
        plan_type=plan,
        stripe_customer_id=f"wompi_redirect_{current_user.id}",
        stripe_subscription_id=f"wompi_redirect_{current_user.id}_{plan}",
    )
    logger.info(f"Suscripción activada por redirect: user={current_user.id} plan={plan}")
    return {"activated": True, "plan": plan, "status": sub.status}


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


# ─── Upload Routes ────────────────────────────────────────────────────────────
from fastapi import File, UploadFile as FastAPIUpload
from typing import List as TypeList
from upload import upload_image, delete_image


@app.post("/upload/image", tags=["Upload"])
async def upload_single_image(
    file: FastAPIUpload = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """Sube una imagen a Cloudinary. Requiere autenticación."""
    result = await upload_image(file, folder=f"realestate-pro/user-{current_user.id}")
    return result


@app.post("/upload/images", tags=["Upload"])
async def upload_multiple_images(
    files: TypeList[FastAPIUpload] = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """Sube hasta 10 imágenes a Cloudinary. Requiere autenticación."""
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Máximo 10 imágenes por vez.")
    results = []
    for file in files:
        result = await upload_image(file, folder=f"realestate-pro/user-{current_user.id}")
        results.append(result)
    return {"images": results, "count": len(results)}


@app.delete("/upload/image", tags=["Upload"])
async def delete_single_image(
    public_id: str,
    current_user: models.User = Depends(get_current_user),
):
    """Elimina una imagen de Cloudinary por su public_id."""
    # Verificar que el public_id pertenece al usuario
    if f"user-{current_user.id}" not in public_id:
        raise HTTPException(status_code=403, detail="No puedes eliminar imágenes de otros usuarios.")
    success = await delete_image(public_id)
    return {"deleted": success}