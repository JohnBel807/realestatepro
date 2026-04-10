"""
upload.py — Cloudinary upload via URL directo (unsigned)
Evita completamente el problema de firma usando un upload preset sin firmar.
El preset se configura una vez en el dashboard de Cloudinary.
"""

import cloudinary
import cloudinary.uploader
import os
import httpx
import base64
from fastapi import HTTPException, UploadFile

CLOUD_NAME    = os.getenv("CLOUDINARY_CLOUD_NAME", "")
UPLOAD_PRESET = os.getenv("CLOUDINARY_UPLOAD_PRESET", "realestate_unsigned")

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024


async def upload_image(file: UploadFile, folder: str = "realestate-pro") -> dict:
    ct = (file.content_type or "").lower()
    if not any(ct.startswith(t) for t in ALLOWED_TYPES):
        raise HTTPException(400, f"Tipo no permitido: '{ct}'. Usa JPG, PNG o WebP.")

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(400, "La imagen supera 5MB.")

    if not CLOUD_NAME:
        raise HTTPException(500, "CLOUDINARY_CLOUD_NAME no configurado.")

    # Convertir a base64 data URI
    b64 = base64.b64encode(contents).decode()
    data_uri = f"data:{ct};base64,{b64}"

    # Upload unsigned via REST API — NO requiere firma
    url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, data={
            "file":           data_uri,
            "upload_preset":  UPLOAD_PRESET,
            "folder":         folder,
        })

    if resp.status_code != 200:
        detail = resp.json().get("error", {}).get("message", resp.text)
        raise HTTPException(500, f"Cloudinary: {detail}")

    result = resp.json()
    return {
        "url":       result["secure_url"],
        "public_id": result["public_id"],
        "width":     result.get("width"),
        "height":    result.get("height"),
    }


async def delete_image(public_id: str) -> bool:
    """
    Delete requiere API key/secret — lo hacemos signed solo para borrar.
    Si las credenciales no están, simplemente omitimos el borrado.
    """
    api_key    = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    if not api_key or not api_secret:
        return False
    try:
        cloudinary.config(
            cloud_name=CLOUD_NAME,
            api_key=api_key,
            api_secret=api_secret,
            secure=True,
        )
        cloudinary.uploader.destroy(public_id)
        return True
    except Exception:
        return False