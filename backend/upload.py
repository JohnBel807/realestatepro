"""
upload.py — Subida de imágenes via Cloudinary
Fix: las transformaciones en uploads firmados causan Invalid Signature.
Solución: subir sin transformation, aplicar eager para procesamiento
posterior, y usar URL transformations en el frontend.
"""

import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
from fastapi import HTTPException, UploadFile

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_SIZE_MB    = 5
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024


async def upload_image(file: UploadFile, folder: str = "realestate-pro") -> dict:
    # Validar tipo
    content_type = file.content_type or ""
    if not any(content_type.startswith(t) for t in ["image/jpeg", "image/png", "image/webp"]):
        raise HTTPException(
            status_code=400,
            detail=f"Tipo no permitido: {content_type}. Usa JPG, PNG o WebP."
        )

    contents = await file.read()

    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"La imagen supera {MAX_SIZE_MB}MB."
        )

    try:
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type="image",
            # eager: Cloudinary procesa estas versiones en background sin afectar la firma
            eager=[
                {"width": 1200, "height": 800, "crop": "limit", "quality": "auto:good", "fetch_format": "auto"},
                {"width": 400,  "height": 300, "crop": "fill",  "quality": "auto:eco",  "fetch_format": "auto"},
            ],
            eager_async=True,   # no bloquea el upload esperando que termine
            # Overwrite si se vuelve a subir el mismo archivo
            unique_filename=True,
            overwrite=False,
        )
        return {
            "url":        result["secure_url"],
            "public_id":  result["public_id"],
            "width":      result.get("width"),
            "height":     result.get("height"),
            "format":     result.get("format"),
        }
    except cloudinary.exceptions.Error as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")


async def delete_image(public_id: str) -> bool:
    try:
        cloudinary.uploader.destroy(public_id)
        return True
    except Exception:
        return False