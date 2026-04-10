"""
payments.py — Integración con Wompi (Colombia)
Documentación: https://docs.wompi.co
"""

import os
import hmac
import hashlib
import httpx
from fastapi import HTTPException

WOMPI_ENV         = os.getenv("WOMPI_ENV", "sandbox")   # sandbox | production
WOMPI_PUBLIC_KEY  = os.getenv("WOMPI_PUBLIC_KEY", "")
WOMPI_PRIVATE_KEY = os.getenv("WOMPI_PRIVATE_KEY", "")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET", "")

BASE_URL = (
    "https://sandbox.wompi.co/v1"
    if WOMPI_ENV == "sandbox"
    else "https://production.wompi.co/v1"
)

# Precios en centavos de COP (Wompi usa centavos)
PLAN_PRICES = {
    "basic":      1_990_000,   # $19.900 COP = 1.990.000 centavos
    "pro":        5_990_000,   # $59.900 COP
    "enterprise": 9_900_000,   # $99.000 COP
}

PLAN_NAMES = {
    "basic":      "VelezyRicaurte Basic — 5 propiedades/mes",
    "pro":        "VelezyRicaurte Pro — 25 propiedades/mes",
    "enterprise": "VelezyRicaurte Enterprise — propiedades ilimitadas",
}


async def create_payment_link(
    plan_type: str,
    user_id: int,
    user_email: str,
    redirect_url: str,
) -> dict:
    """
    Crea un enlace de pago en Wompi.
    El usuario es redirigido a la URL de Wompi para completar el pago.
    """
    if plan_type not in PLAN_PRICES:
        raise HTTPException(400, f"Plan inválido: {plan_type}")

    if not WOMPI_PUBLIC_KEY or not WOMPI_PRIVATE_KEY:
        raise HTTPException(500, "Wompi no está configurado. Contacta al administrador.")

    amount_in_cents = PLAN_PRICES[plan_type]

    # Wompi Payment Link API
    headers = {
        "Authorization": f"Bearer {WOMPI_PRIVATE_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "name": PLAN_NAMES[plan_type],
        "description": f"Suscripción mensual plan {plan_type.capitalize()} — VelezyRicaurte Inmobiliaria",
        "single_use": True,                    # Un solo uso por link
        "collect_shipping": False,
        "currency": "COP",
        "amount_in_cents": amount_in_cents,
        "redirect_url": redirect_url,
        "customer_data": {
            "customer_references": [
                {
                    "label": "user_id",
                    "value": str(user_id),
                },
                {
                    "label": "plan_type",
                    "value": plan_type,
                }
            ]
        }
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{BASE_URL}/payment_links",
            json=payload,
            headers=headers,
        )

    if resp.status_code not in (200, 201):
        detail = resp.json().get("error", {}).get("message", resp.text)
        raise HTTPException(502, f"Error Wompi: {detail}")

    data = resp.json().get("data", {})
    return {
        "payment_url": f"https://checkout.wompi.co/l/{data.get('id')}",
        "link_id":     data.get("id"),
        "amount":      amount_in_cents,
        "plan":        plan_type,
    }


def verify_wompi_signature(payload: dict, signature_received: str) -> bool:
    """
    Verifica la firma HMAC-SHA256 del evento webhook de Wompi.
    """
    if not WOMPI_EVENTS_SECRET:
        return False

    # Wompi firma concatenando: transaction_id + status + amount + currency + secret
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
    """
    Extrae información relevante de un evento de Wompi.
    """
    event_type  = payload.get("event", "")
    transaction = payload.get("data", {}).get("transaction", {})
    status      = transaction.get("status", "")          # APPROVED | DECLINED | VOIDED
    reference   = transaction.get("reference", "")
    amount      = transaction.get("amount_in_cents", 0)

    # Extraemos user_id y plan_type de customer_data
    customer_data = transaction.get("customer_data", {})
    refs = {r["label"]: r["value"] for r in customer_data.get("customer_references", [])}

    return {
        "event_type":  event_type,
        "status":      status,
        "reference":   reference,
        "amount":      amount,
        "user_id":     refs.get("user_id"),
        "plan_type":   refs.get("plan_type"),
        "transaction_id": transaction.get("id"),
        "approved":    status == "APPROVED",
    }
