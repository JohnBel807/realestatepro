"""
payments.py — Integración Wompi para velezyricaurte.com
Cambios:
  - Firma de integridad en checkout (requerida en producción)
  - Webhook unificado recibe reenvíos desde .info
  - Precios mensual y anual (2 meses gratis en anual)
"""

import os
import hmac
import hashlib
import secrets
import httpx
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

WOMPI_ENV              = os.getenv("WOMPI_ENV", "production")
WOMPI_PUBLIC_KEY       = os.getenv("WOMPI_PUBLIC_KEY", "")
WOMPI_PRIVATE_KEY      = os.getenv("WOMPI_PRIVATE_KEY", "")
WOMPI_EVENTS_SECRET    = os.getenv("WOMPI_EVENTS_SECRET", "")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET", "")  # ← NUEVO

BASE_URL = (
    "https://sandbox.wompi.co/v1"
    if WOMPI_ENV == "sandbox"
    else "https://production.wompi.co/v1"
)

# ─── Precios en centavos de COP ───────────────────────────────────────────────
PLAN_PRICES = {
    # Mensual
    "basic_monthly":       1_990_000,
    "pro_monthly":         5_990_000,
    "enterprise_monthly":  9_900_000,
    # Anual (10 meses = 2 gratis)
    "basic_annual":       19_900_000,
    "pro_annual":         59_900_000,
    "enterprise_annual":  99_000_000,
    # Aliases sin sufijo → mensual
    "basic":               1_990_000,
    "pro":                 5_990_000,
    "enterprise":          9_900_000,
}

PLAN_NAMES = {
    "basic_monthly":      "VelezyRicaurte Basic Mensual",
    "pro_monthly":        "VelezyRicaurte Pro Mensual",
    "enterprise_monthly": "VelezyRicaurte Enterprise Mensual",
    "basic_annual":       "VelezyRicaurte Basic Anual (2 meses gratis)",
    "pro_annual":         "VelezyRicaurte Pro Anual (2 meses gratis)",
    "enterprise_annual":  "VelezyRicaurte Enterprise Anual (2 meses gratis)",
    "basic":              "VelezyRicaurte Basic",
    "pro":                "VelezyRicaurte Pro",
    "enterprise":         "VelezyRicaurte Enterprise",
}


def _generate_integrity(reference: str, amount_in_cents: int) -> str:
    """
    Firma de integridad requerida por Wompi en producción.
    Se agrega al checkout URL como &signature:integrity=...
    Docs: https://docs.wompi.co/docs/colombia/widget-checkout-colombia
    """
    if not WOMPI_INTEGRITY_SECRET:
        return ""
    string = f"{reference}{amount_in_cents}COP{WOMPI_INTEGRITY_SECRET}"
    return hashlib.sha256(string.encode()).hexdigest()


async def create_payment_link(
    plan_type: str,
    user_id: int,
    user_email: str,
    redirect_url: str,
) -> dict:
    if plan_type not in PLAN_PRICES:
        raise HTTPException(400, f"Plan inválido: {plan_type}")

    if not WOMPI_PRIVATE_KEY:
        raise HTTPException(500, "Wompi no está configurado.")

    amount_in_cents = PLAN_PRICES[plan_type]

    # Referencia única — formato reconocible por el webhook de .info
    reference = f"COM_{user_id}_{plan_type}_{secrets.token_urlsafe(6)}"

    headers = {
        "Authorization": f"Bearer {WOMPI_PRIVATE_KEY}",
        "Content-Type":  "application/json",
    }

    redirect_with_params = (
        f"{redirect_url}"
        f"&user_id={user_id}"
        f"&plan={plan_type}"
        f"&reference={reference}"
    )

    payload = {
        "name":             PLAN_NAMES.get(plan_type, plan_type),
        "description":      f"Suscripción {plan_type} — VelezyRicaurte Inmobiliaria",
        "single_use":       True,
        "collect_shipping": False,
        "currency":         "COP",
        "amount_in_cents":  amount_in_cents,
        "redirect_url":     redirect_with_params,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{BASE_URL}/payment_links",
            json=payload,
            headers=headers,
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(502, f"Error Wompi: {resp.text}")

    data    = resp.json().get("data", {})
    link_id = data.get("id", "")

    # Generar URL del checkout con firma de integridad
    checkout_url = f"https://checkout.wompi.co/l/{link_id}"
    integrity    = _generate_integrity(reference, amount_in_cents)
    if integrity:
        checkout_url += f"&signature:integrity={integrity}"

    logger.info(f"Wompi link creado: {link_id} plan={plan_type} ref={reference}")

    return {
        "payment_url": checkout_url,
        "link_id":     link_id,
        "reference":   reference,
        "amount":      amount_in_cents,
        "plan":        plan_type,
    }


def verify_wompi_signature(payload: dict, signature_received: str) -> bool:
    """Verifica firma HMAC del evento webhook."""
    if not WOMPI_EVENTS_SECRET or not signature_received:
        return True
    transaction  = payload.get("data", {}).get("transaction", {})
    checksum_str = (
        str(transaction.get("id", "")) +
        str(transaction.get("status", "")) +
        str(transaction.get("amount_in_cents", "")) +
        str(transaction.get("currency", "")) +
        WOMPI_EVENTS_SECRET
    )
    expected = hashlib.sha256(checksum_str.encode()).hexdigest()
    return hmac.compare_digest(expected, signature_received)


def parse_wompi_event(payload: dict) -> dict:
    """Extrae datos relevantes del evento webhook."""
    transaction = payload.get("data", {}).get("transaction", {})
    status      = transaction.get("status", "")
    reference   = transaction.get("reference", "")

    # Extraer user_id y plan de la referencia COM_{user_id}_{plan}_{token}
    user_id   = None
    plan_type = None
    if reference.startswith("COM_"):
        parts = reference.split("_")
        if len(parts) >= 3:
            try:
                user_id   = parts[1]
                plan_type = "_".join(parts[2:-1])  # ej: pro_annual
            except Exception:
                pass

    # También intentar extraer de redirect_url como fallback
    redirect = transaction.get("redirect_url", "")
    if not user_id and "user_id=" in redirect:
        try:
            user_id = redirect.split("user_id=")[1].split("&")[0]
        except Exception:
            pass
    if not plan_type and "plan=" in redirect:
        try:
            plan_type = redirect.split("plan=")[1].split("&")[0]
        except Exception:
            pass

    return {
        "event_type":     payload.get("event", ""),
        "status":         status,
        "reference":      reference,
        "amount":         transaction.get("amount_in_cents", 0),
        "user_id":        user_id,
        "plan_type":      plan_type,
        "transaction_id": transaction.get("id"),
        "approved":       status == "APPROVED",
    }