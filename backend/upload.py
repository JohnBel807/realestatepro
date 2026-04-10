"""
upload.py — Cloudinary upload SIMPLIFICADO
Raíz del problema: cualquier parámetro extra (transformation, eager, overwrite,
unique_filename) modifica el string-to-sign y rompe la firma cuando el SDK
los serializa diferente a lo esperado por la API.

Solución: upload mínimo — solo folder + resource_type.
Las optimizaciones se aplican en la URL del frontend via Cloudinary URL API.
"""

import cloudinary
import cloudinary.uploader
import os
from fastapi import HTTPException, UploadFile

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5MB


async def upload_image(file: UploadFile, folder: str = "realestate-pro") -> dict:
    # Validar tipo MIME
    ct = (file.content_type or "").lower()
    if not any(ct.startswith(t) for t in ALLOWED_TYPES):
        raise HTTPException(
            status_code=400,
            detail=f"Tipo no permitido: '{ct}'. Usa JPG, PNG o WebP."
        )

    contents = await file.read()

    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="La imagen supera el límite de 5MB."
        )

    try:
        # Upload MÍNIMO — solo los 2 parámetros que no rompen la firma
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type="image",
        )
        return {
            "url":       result["secure_url"],
            "public_id": result["public_id"],
            "width":     result.get("width"),
            "height":    result.get("height"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al subir imagen: {str(e)}"
        )


async def delete_image(public_id: str) -> bool:
    try:
        cloudinary.uploader.destroy(public_id)
        return True
    except Exception:
        return False