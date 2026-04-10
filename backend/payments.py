"""
payments.py — Integración con Wompi (Colombia)
Documentación: https://docs.wompi.co
"""

import os
import hmac
import hashlib
import httpx
from fastapi import HTTPException

WOMPI_ENV           = os.getenv("WOMPI_ENV", "production")
WOMPI_PUBLIC_KEY    = os.getenv("WOMPI_PUBLIC_KEY", "")
WOMPI_PRIVATE_KEY   = os.getenv("WOMPI_PRIVATE_KEY", "")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET", "")

BASE_URL = (
    "https://sandbox.wompi.co/v1"
    if WOMPI_ENV == "sandbox"
    else "https://production.wompi.co/v1"
)

# Precios en centavos de COP
PLAN_PRICES = {
    "basic":      1_990_000,   # $19.900 COP
    "pro":        5_990_000,   # $59.900 COP
    "enterprise": 9_900_000,   # $99.000 COP
}

PLAN_NAMES = {
    "basic":      "VelezyRicaurte Basic",
    "pro":        "VelezyRicaurte Pro",
    "enterprise": "VelezyRicaurte Enterprise",
}


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

    headers = {
        "Authorization": f"Bearer {WOMPI_PRIVATE_KEY}",
        "Content-Type": "application/json",
    }

    # Wompi producción — sin customer_data en payment_links
    # Pasamos user_id y plan en la redirect_url como query params
    redirect_with_params = (
        f"{redirect_url}"
        f"&user_id={user_id}"
        f"&plan={plan_type}"
    )

    payload = {
        "name":            PLAN_NAMES[plan_type],
        "description":     f"Suscripción {plan_type} — VelezyRicaurte Inmobiliaria",
        "single_use":      True,
        "collect_shipping": False,
        "currency":        "COP",
        "amount_in_cents": amount_in_cents,
        "redirect_url":    redirect_with_params,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{BASE_URL}/payment_links",
            json=payload,
            headers=headers,
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(502, f"Error Wompi: {resp.text}")

    data = resp.json().get("data", {})
    link_id = data.get("id", "")

    return {
        "payment_url": f"https://checkout.wompi.co/l/{link_id}",
        "link_id":     link_id,
        "amount":      amount_in_cents,
        "plan":        plan_type,
    }


def verify_wompi_signature(payload: dict, signature_received: str) -> bool:
    if not WOMPI_EVENTS_SECRET or not signature_received:
        return True  # En producción sin secret configurado, aceptamos
    transaction = payload.get("data", {}).get("transaction", {})
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
    """Extrae datos del evento webhook de Wompi."""
    transaction = payload.get("data", {}).get("transaction", {})
    status      = transaction.get("status", "")

    # user_id y plan vienen en la redirect_url que Wompi nos reenvía
    # como metadata en la transacción
    metadata = transaction.get("redirect_url", "")
    user_id  = None
    plan_type = None

    # Extraer de query params de redirect_url
    if "user_id=" in metadata:
        try:
            user_id = metadata.split("user_id=")[1].split("&")[0]
        except Exception:
            pass
    if "plan=" in metadata:
        try:
            plan_type = metadata.split("plan=")[1].split("&")[0]
        except Exception:
            pass

    return {
        "event_type":     payload.get("event", ""),
        "status":         status,
        "amount":         transaction.get("amount_in_cents", 0),
        "user_id":        user_id,
        "plan_type":      plan_type,
        "transaction_id": transaction.get("id"),
        "approved":       status == "APPROVED",
    }