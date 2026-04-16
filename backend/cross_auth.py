"""
cross_auth.py — SSO y descuentos cruzados — Backend velezyricaurte.COM
Compatible con el cross_auth.py de velezyricaurte.INFO

Flujo completo:
  .info llama POST /cross-auth/cross-verify   → verifica token de .com
  .info llama POST /cross-auth/cross-register → crea sesión cross-portal
  .info llama GET  /cross-auth/discount       → consulta descuento
  .com  llama POST /cross-auth/verify-for-com → verifica usuarios de .info
"""

import os
import logging
from datetime import datetime, timedelta

import httpx
from fastapi        import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic       import BaseModel, EmailStr
from typing         import Optional

import models, crud
from database import get_db
from auth     import create_access_token, get_password_hash

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cross-auth", tags=["Cross Portal SSO"])

CROSS_PORTAL_SECRET  = os.getenv("CROSS_PORTAL_SECRET", "")
INFO_PORTAL_API_URL  = os.getenv("INFO_PORTAL_API_URL", "https://api.velezyricaurte.info")

# Misma tabla que usa .info — deben ser idénticas
DISCOUNT_TABLE = {
    "free":     0,
    "basic":    30,
    "pro":      50,
    "premium":  70,
    "enterprise": 70,
}


def _check_secret(secret: str):
    """Valida el X-Portal-Secret de la request."""
    if not CROSS_PORTAL_SECRET:
        logger.warning("CROSS_PORTAL_SECRET no configurado — SSO deshabilitado")
        raise HTTPException(503, "SSO no configurado en este portal")
    if secret != CROSS_PORTAL_SECRET:
        raise HTTPException(403, "Portal secret inválido")


def _get_discount(plan: str, has_active: bool) -> int:
    if not has_active:
        return 0
    return DISCOUNT_TABLE.get(plan, 0)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class CrossVerifyRequest(BaseModel):
    token: str

class CrossLoginRequest(BaseModel):
    email: EmailStr
    source_portal: str   # "com" o "info"
    cross_token: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/cross-verify")
async def cross_verify(
    payload: CrossVerifyRequest,
    x_portal_secret: str = Header(..., alias="X-Portal-Secret"),
    db: Session = Depends(get_db),
):
    """
    .info envía un JWT de .com → validamos con GET /auth/me propio.
    Devuelve datos del usuario + plan + descuento aplicable en .info.
    Espejo exacto del endpoint en .info.
    """
    _check_secret(x_portal_secret)

    # Validar el token llamando a nuestro propio /auth/me
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "http://localhost:8000/auth/me",
                headers={"Authorization": f"Bearer {payload.token}"},
            )
        if resp.status_code != 200:
            return {"valid": False}
        user_data = resp.json()
    except Exception as e:
        logger.error(f"cross_verify error: {e}")
        return {"valid": False}

    has_active = user_data.get("has_active_subscription", False)
    plan       = user_data.get("subscription_plan", "free")
    discount   = _get_discount(plan, has_active)

    return {
        "valid":                   True,
        "user_email":              user_data["email"],
        "user_name":               user_data.get("full_name"),
        "plan":                    plan,
        "has_active_subscription": has_active,
        "discount_percent":        discount,
        "portal":                  "velezyricaurte.com",
    }


@router.post("/cross-register")
async def cross_register(
    payload: CrossLoginRequest,
    x_portal_secret: str = Header(..., alias="X-Portal-Secret"),
    db: Session = Depends(get_db),
):
    """
    Un usuario de .info quiere acceder a .com sin registrarse.
    Verificamos su token con .info y creamos/actualizamos la sesión aquí.
    """
    _check_secret(x_portal_secret)

    # Verificar token con .info
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"{INFO_PORTAL_API_URL}/auth/me",
                headers={"Authorization": f"Bearer {payload.cross_token}"},
            )
        if resp.status_code != 200:
            raise HTTPException(401, "Token externo inválido")
        info_user = resp.json()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(502, "No se pudo contactar velezyricaurte.info")

    if info_user.get("email") != payload.email:
        raise HTTPException(400, "Email no coincide con el token")

    # Buscar si ya existe en .com
    existing = db.query(models.User).filter(
        models.User.email == payload.email
    ).first()

    if existing:
        # Ya existe — generar token de .com y devolver descuento
        token    = create_access_token({"sub": existing.email})
        sub      = db.query(models.Subscription).filter(
            models.Subscription.user_id == existing.id,
            models.Subscription.status  == "active",
        ).first()
        has_active = sub is not None
        plan       = sub.plan_type if sub else "free"
        discount   = _get_discount(plan, has_active)
        return {
            "access_token":    token,
            "token_type":      "bearer",
            "cross_login":     True,
            "new_account":     False,
            "discount_percent": discount,
            "message": f"Bienvenido de vuelta. Tienes {discount}% de descuento por tu plan en .info" if discount else "Sesión iniciada desde velezyricaurte.info",
        }

    # No existe — crear cuenta espejo en .com
    new_user = models.User(
        email      = info_user["email"],
        full_name  = info_user.get("full_name", ""),
        phone      = info_user.get("phone"),
        hashed_password = get_password_hash(f"cross_{info_user['email']}_vyr"),
        is_active  = True,
        trial_ends_at = datetime.utcnow() + timedelta(days=30),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token    = create_access_token({"sub": new_user.email})
    has_active = info_user.get("has_active_subscription", False)
    plan       = info_user.get("subscription_plan", "free")
    discount   = _get_discount(plan, has_active)

    return {
        "access_token":     token,
        "token_type":       "bearer",
        "cross_login":      True,
        "new_account":      True,
        "discount_percent": discount,
        "message": f"Cuenta creada desde velezyricaurte.info. {discount}% de descuento aplicado." if discount else "Cuenta creada desde velezyricaurte.info",
    }


@router.post("/verify-for-com")
async def verify_for_com(
    payload: dict,
    x_portal_secret: str = Header(..., alias="X-Portal-Secret"),
    db: Session = Depends(get_db),
):
    """
    .info llama aquí para verificar si un email existe en .com
    y qué descuento tiene. Espejo del endpoint en .info.
    """
    _check_secret(x_portal_secret)

    email = payload.get("email")
    if not email:
        raise HTTPException(400, "Email requerido")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return {
            "found":                   False,
            "has_active_subscription": False,
            "plan":                    "free",
            "discount_percent":        0,
        }

    sub = db.query(models.Subscription).filter(
        models.Subscription.user_id == user.id,
        models.Subscription.status  == "active",
    ).first()

    has_active = sub is not None
    plan       = sub.plan_type if sub else "free"
    discount   = _get_discount(plan, has_active)

    return {
        "found":                   True,
        "has_active_subscription": has_active,
        "plan":                    plan,
        "discount_percent":        discount,
        "message": f"Plan {plan} activo en velezyricaurte.com",
    }