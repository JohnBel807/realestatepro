"""
RealEstate Pro — FastAPI Backend
main.py: Entry point, routes, middleware, auth
"""

from fastapi import FastAPI, Depends, HTTPException, status, Query, Request
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
    """Crea/verifica tablas y loguea diagnóstico al arrancar."""
    try:
        # checkfirst=True evita error si la tabla ya existe
        models.Base.metadata.create_all(bind=engine, checkfirst=True)
        logger.info("✅ Tablas creadas/verificadas correctamente")

        # Agregar columnas nuevas si no existen (reemplaza alembic)
        _apply_schema_patches()
    except Exception as e:
        logger.error(f"❌ Error en startup: {e}")

    logger.info(f"🌐 FRONTEND_URL: {os.getenv('FRONTEND_URL', 'no definida')}")
    logger.info(f"🗄️  DATABASE_URL definida: {bool(os.getenv('DATABASE_URL'))}")
    logger.info(f"🔑 JWT_SECRET_KEY definida: {bool(os.getenv('JWT_SECRET_KEY'))}")


def _apply_schema_patches():
    """Aplica columnas nuevas que no existían en el schema original.
    Seguro de correr múltiples veces — verifica antes de agregar."""
    from sqlalchemy import text, inspect as sa_inspect
    with engine.connect() as conn:
        inspector = sa_inspect(engine)
        user_cols = [c['name'] for c in inspector.get_columns('users')]
        prop_cols = [c['name'] for c in inspector.get_columns('properties')]

        patches = []

        # Columnas de usuario
        if 'trial_ends_at' not in user_cols:
            patches.append("ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMPTZ")
        if 'is_superuser' not in user_cols:
            patches.append("ALTER TABLE users ADD COLUMN is_superuser BOOLEAN NOT NULL DEFAULT false")
        if 'password_reset_token' not in user_cols:
            patches.append("ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255)")
        if 'password_reset_expires' not in user_cols:
            patches.append("ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMPTZ")

        # Columnas de propiedades
        if 'listing_type' not in prop_cols:
            # Crear enum si no existe
            result = conn.execute(text(
                "SELECT 1 FROM pg_type WHERE typname = 'listing_type'"
            ))
            if not result.fetchone():
                conn.execute(text(
                    "CREATE TYPE listing_type AS ENUM ('sale', 'rent', 'rent_sale')"
                ))
                conn.commit()
            patches.append(
                "ALTER TABLE properties ADD COLUMN listing_type listing_type DEFAULT 'sale'"
            )
        if 'rental_price' not in prop_cols:
            patches.append("ALTER TABLE properties ADD COLUMN rental_price FLOAT")
        if 'rental_deposit' not in prop_cols:
            patches.append("ALTER TABLE properties ADD COLUMN rental_deposit FLOAT")
        if 'rental_min_months' not in prop_cols:
            patches.append("ALTER TABLE properties ADD COLUMN rental_min_months INTEGER")
        if 'rental_includes_admin' not in prop_cols:
            patches.append(
                "ALTER TABLE properties ADD COLUMN rental_includes_admin BOOLEAN DEFAULT false"
            )
        if 'admin_fee' not in prop_cols:
            patches.append("ALTER TABLE properties ADD COLUMN admin_fee FLOAT")
        if 'available_from' not in prop_cols:
            patches.append(
                "ALTER TABLE properties ADD COLUMN available_from TIMESTAMPTZ"
            )

        for sql in patches:
            try:
                conn.execute(text(sql))
                conn.commit()
                logger.info(f"✅ Patch aplicado: {sql[:60]}")
            except Exception as e:
                logger.warning(f"⚠️  Patch omitido (ya existe?): {e}")
                conn.rollback()

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
@app.post("/auth/register", tags=["Auth"])
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, email=user_in.email):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    hashed = get_password_hash(user_in.password)
    new_user = crud.create_user(db, user_in=user_in, hashed_password=hashed)
    # Correo de bienvenida (no bloquea el response)
    try:
        send_welcome_email(new_user.email, new_user.full_name or "")
    except Exception as e:
        logger.warning(f"No se pudo enviar correo de bienvenida: {e}")
    return {
        "id": new_user.id, "email": new_user.email,
        "full_name": new_user.full_name, "is_active": new_user.is_active,
        "trial_ends_at": new_user.trial_ends_at, "created_at": new_user.created_at,
    }


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


# ─── Recuperar contraseña ────────────────────────────────────────────────────
import secrets as secrets_module

@app.post("/auth/forgot-password", tags=["Auth"])
async def forgot_password(body: dict, db: Session = Depends(get_db)):
    email = (body.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(400, "Email requerido")

    user = crud.get_user_by_email(db, email=email)
    # Siempre 200 aunque no exista — seguridad
    if not user:
        return {"message": "Si el correo existe, recibirás un enlace en breve."}

    token = secrets_module.token_urlsafe(32)
    user.password_reset_token   = token
    from datetime import timezone
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=2)
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "https://www.velezyricaurte.com")
    reset_link   = f"{frontend_url}/reset-password?token={token}"

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h2 style="color:#6B4E2A;font-family:Georgia,serif;">VelezyRicaurte Inmobiliaria</h2>
      <p>Hola <strong>{user.full_name}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p style="margin:24px 0;">
        <a href="{reset_link}"
           style="background:#C4631A;color:#fff;padding:12px 24px;border-radius:8px;
                  text-decoration:none;font-weight:bold;display:inline-block;">
          Restablecer contraseña →
        </a>
      </p>
      <p style="color:#888;font-size:13px;">
        Este enlace expira en 2 horas. Si no solicitaste este cambio, ignora este correo.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#aaa;font-size:11px;">VelezyRicaurte Inmobiliaria · johnroa@velezyricaurte.com</p>
    </div>
    """
    try:
        from email_service import _send
        _send(email, "Restablecer contraseña — VelezyRicaurte Inmobiliaria", html)
    except Exception as e:
        logger.error(f"Error enviando correo reset: {e}")

    return {"message": "Si el correo existe, recibirás un enlace en breve."}


@app.post("/auth/reset-password", tags=["Auth"])
def reset_password(body: dict, db: Session = Depends(get_db)):
    token    = (body.get("token") or "").strip()
    password = (body.get("password") or "").strip()

    if not token or not password:
        raise HTTPException(400, "Token y contraseña son requeridos")
    if len(password) < 8:
        raise HTTPException(400, "Mínimo 8 caracteres")

    user = db.query(models.User).filter(
        models.User.password_reset_token == token
    ).first()

    if not user:
        raise HTTPException(400, "Token inválido o ya utilizado")
    # Comparar fechas con timezone consistente
    from datetime import timezone
    expires = user.password_reset_expires
    now     = datetime.now(timezone.utc)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        raise HTTPException(400, "El enlace expiró. Solicita uno nuevo.")

    user.hashed_password        = get_password_hash(password)
    user.password_reset_token   = None
    user.password_reset_expires = None
    db.commit()

    return {"message": "¡Contraseña actualizada! Ya puedes iniciar sesión."}


# ─── Game Score ──────────────────────────────────────────────────────────────
@app.post("/game/score", tags=["Game"])
async def save_game_score(
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Guarda el score del juego Maestro Bocadillero."""
    logger.info(
        f"Score juego: user={current_user.email} "
        f"portal={body.get('portal')} score={body.get('score')} "
        f"days={body.get('days')} money={body.get('money')}"
    )
    return {
        "saved":  True,
        "player": current_user.full_name or current_user.email,
        "score":  body.get("score", 0),
    }

@app.get("/game/scores", tags=["Game"])
async def get_game_scores():
    """Top scores públicos (placeholder para ranking futuro)."""
    return {"scores": [], "message": "Ranking próximamente"}


# ─── Admin / Superusuario ─────────────────────────────────────────────────────
def get_superuser(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(403, "Acción reservada para administradores")
    return current_user


@app.get("/admin/users", tags=["Admin"])
def admin_list_users(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_superuser),
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return [
        {
            "id":            u.id,
            "email":         u.email,
            "full_name":     u.full_name,
            "is_active":     u.is_active,
            "is_superuser":  u.is_superuser,
            "trial_ends_at": u.trial_ends_at,
            "created_at":    u.created_at,
        }
        for u in users
    ]


@app.delete("/admin/properties/{property_id}", tags=["Admin"])
def admin_delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_superuser),
):
    prop = db.query(models.Property).filter(
        models.Property.id == property_id
    ).first()
    if not prop:
        raise HTTPException(404, "Propiedad no encontrada")
    db.delete(prop)
    db.commit()
    logger.info(f"Admin {admin.email} eliminó propiedad #{property_id}")
    return {"deleted": True, "property_id": property_id}


@app.put("/admin/users/{user_id}/toggle-active", tags=["Admin"])
def admin_toggle_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_superuser),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if user.is_superuser:
        raise HTTPException(403, "No puedes desactivar otro superusuario")
    user.is_active = not user.is_active
    db.commit()
    return {"user_id": user_id, "is_active": user.is_active}


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
    """Crea sesión de pago Wompi — devuelve URL, referencia e integridad."""
    import hashlib
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    redirect_url = (
        f"{frontend_url}/dashboard?subscription=success&plan={plan.plan_type}"
    )

    result = await create_payment_link(
        plan_type=plan.plan_type,
        user_id=current_user.id,
        user_email=current_user.email,
        redirect_url=redirect_url,
    )

    # Calcular firma de integridad para el widget del frontend
    integrity_secret = os.getenv("WOMPI_INTEGRITY_SECRET", "")
    integrity = ""
    if integrity_secret:
        raw = f"{result['reference']}{result['amount']}COP{integrity_secret}"
        integrity = hashlib.sha256(raw.encode()).hexdigest()

    return {
        "checkout_url": result["payment_url"],
        "link_id":      result["link_id"],
        "reference":    result["reference"],
        "amount":       result["amount"],
        "integrity":    integrity,
        "redirect_url": redirect_url,
    }


@app.post("/webhooks/wompi", tags=["Subscriptions"])
@app.post("/api/subscriptions/wompi-webhook", tags=["Subscriptions"])
async def wompi_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint de webhook unificado para Wompi.
    Recibe eventos directos de Wompi Y reenvíos desde velezyricaurte.info.
    El backend de .info detecta referencias COM_ y las reenvía aquí.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Payload inválido")

    # Verificar firma (no bloqueamos si no está configurada)
    signature = request.headers.get("x-event-checksum", "")
    if not verify_wompi_signature(body, signature):
        logger.warning("Wompi webhook: firma inválida — ignorando")
        return {"received": True}

    event = parse_wompi_event(body)
    logger.info(
        f"Wompi webhook: event={event['event_type']} "
        f"status={event['status']} ref={event['reference']}"
    )

    if event["approved"] and event["user_id"] and event["plan_type"]:
        try:
            user_id = int(event["user_id"])
            plan    = event["plan_type"]

            # Normalizar plan — quitar sufijo _monthly/_annual para el modelo
            base_plan = plan.replace("_monthly", "").replace("_annual", "")

            crud.upsert_subscription(
                db,
                user_id=user_id,
                plan_type=base_plan,
                stripe_customer_id=f"wompi_{event['transaction_id']}",
                stripe_subscription_id=f"wompi_{event['transaction_id']}_{plan}",
            )
            logger.info(
                f"✅ Suscripción activada: user={user_id} "
                f"plan={base_plan} ref={event['reference']}"
            )
        except Exception as e:
            logger.error(f"Error activando suscripción: {e}")

    return {"received": True}


# ─── Recuperar contraseña ────────────────────────────────────────────────────
import secrets as secrets_module

@app.post("/auth/forgot-password", tags=["Auth"])
async def forgot_password(body: dict, db: Session = Depends(get_db)):
    email = (body.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(400, "Email requerido")

    user = crud.get_user_by_email(db, email=email)
    # Siempre 200 aunque no exista — seguridad
    if not user:
        return {"message": "Si el correo existe, recibirás un enlace en breve."}

    token = secrets_module.token_urlsafe(32)
    user.password_reset_token   = token
    from datetime import timezone
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=2)
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "https://www.velezyricaurte.com")
    reset_link   = f"{frontend_url}/reset-password?token={token}"

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h2 style="color:#6B4E2A;font-family:Georgia,serif;">VelezyRicaurte Inmobiliaria</h2>
      <p>Hola <strong>{user.full_name}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p style="margin:24px 0;">
        <a href="{reset_link}"
           style="background:#C4631A;color:#fff;padding:12px 24px;border-radius:8px;
                  text-decoration:none;font-weight:bold;display:inline-block;">
          Restablecer contraseña →
        </a>
      </p>
      <p style="color:#888;font-size:13px;">
        Este enlace expira en 2 horas. Si no solicitaste este cambio, ignora este correo.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#aaa;font-size:11px;">VelezyRicaurte Inmobiliaria · johnroa@velezyricaurte.com</p>
    </div>
    """
    try:
        from email_service import _send
        _send(email, "Restablecer contraseña — VelezyRicaurte Inmobiliaria", html)
    except Exception as e:
        logger.error(f"Error enviando correo reset: {e}")

    return {"message": "Si el correo existe, recibirás un enlace en breve."}


@app.post("/auth/reset-password", tags=["Auth"])
def reset_password(body: dict, db: Session = Depends(get_db)):
    token    = (body.get("token") or "").strip()
    password = (body.get("password") or "").strip()

    if not token or not password:
        raise HTTPException(400, "Token y contraseña son requeridos")
    if len(password) < 8:
        raise HTTPException(400, "Mínimo 8 caracteres")

    user = db.query(models.User).filter(
        models.User.password_reset_token == token
    ).first()

    if not user:
        raise HTTPException(400, "Token inválido o ya utilizado")
    # Comparar fechas con timezone consistente
    from datetime import timezone
    expires = user.password_reset_expires
    now     = datetime.now(timezone.utc)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        raise HTTPException(400, "El enlace expiró. Solicita uno nuevo.")

    user.hashed_password        = get_password_hash(password)
    user.password_reset_token   = None
    user.password_reset_expires = None
    db.commit()

    return {"message": "¡Contraseña actualizada! Ya puedes iniciar sesión."}


# ─── Game Score ──────────────────────────────────────────────────────────────
@app.post("/game/score", tags=["Game"])
async def save_game_score(
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Guarda el score del juego Maestro Bocadillero."""
    logger.info(
        f"Score juego: user={current_user.email} "
        f"portal={body.get('portal')} score={body.get('score')} "
        f"days={body.get('days')} money={body.get('money')}"
    )
    return {
        "saved":  True,
        "player": current_user.full_name or current_user.email,
        "score":  body.get("score", 0),
    }

@app.get("/game/scores", tags=["Game"])
async def get_game_scores():
    """Top scores públicos (placeholder para ranking futuro)."""
    return {"scores": [], "message": "Ranking próximamente"}


# ─── Admin / Superusuario ─────────────────────────────────────────────────────
def get_superuser(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(403, "Acción reservada para administradores")
    return current_user


@app.get("/admin/users", tags=["Admin"])
def admin_list_users(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_superuser),
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return [
        {
            "id":            u.id,
            "email":         u.email,
            "full_name":     u.full_name,
            "is_active":     u.is_active,
            "is_superuser":  u.is_superuser,
            "trial_ends_at": u.trial_ends_at,
            "created_at":    u.created_at,
        }
        for u in users
    ]


@app.delete("/admin/properties/{property_id}", tags=["Admin"])
def admin_delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_superuser),
):
    prop = db.query(models.Property).filter(
        models.Property.id == property_id
    ).first()
    if not prop:
        raise HTTPException(404, "Propiedad no encontrada")
    db.delete(prop)
    db.commit()
    logger.info(f"Admin {admin.email} eliminó propiedad #{property_id}")
    return {"deleted": True, "property_id": property_id}


@app.put("/admin/users/{user_id}/toggle-active", tags=["Admin"])
def admin_toggle_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_superuser),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if user.is_superuser:
        raise HTTPException(403, "No puedes desactivar otro superusuario")
    user.is_active = not user.is_active
    db.commit()
    return {"user_id": user_id, "is_active": user.is_active}


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


@app.get("/dashboard/subscription", tags=["Dashboard"])
def my_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retorna la suscripción activa o null si no tiene — nunca 404."""
    sub = crud.get_active_subscription(db, user_id=current_user.id)
    if not sub:
        return {
            "status": "none",
            "plan_type": None,
            "trial_active": crud.is_trial_active(current_user),
            "trial_days_remaining": crud.trial_days_remaining(current_user),
            "trial_ends_at": current_user.trial_ends_at,
        }
    return {
        "status":               sub.status,
        "plan_type":            sub.plan_type,
        "current_period_end":   sub.current_period_end,
        "trial_active":         False,
        "trial_days_remaining": 0,
        "trial_ends_at":        current_user.trial_ends_at,
    }


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