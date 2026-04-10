"""
upload.py — Manejo de subida de imágenes vía Cloudinary
"""

import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
from fastapi import HTTPException, UploadFile

# Configurar Cloudinary con variables de entorno
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 5
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024


async def upload_image(file: UploadFile, folder: str = "realestate-pro") -> dict:
    """
    Sube una imagen a Cloudinary y retorna la URL y public_id.
    """
    # Validar tipo
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido: {file.content_type}. Usa JPG, PNG o WebP."
        )

    # Leer contenido
    contents = await file.read()

    # Validar tamaño
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"El archivo supera el límite de {MAX_SIZE_MB}MB."
        )

    # Subir a Cloudinary
    try:
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            transformation=[
                {"width": 1200, "height": 800, "crop": "limit"},  # máximo 1200x800
                {"quality": "auto:good"},                           # compresión automática
                {"fetch_format": "auto"},                           # WebP si el browser lo soporta
            ],
            resource_type="image",
        )
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "width": result.get("width"),
            "height": result.get("height"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")


async def delete_image(public_id: str) -> bool:
    """Elimina una imagen de Cloudinary por su public_id."""
    try:
        cloudinary.uploader.destroy(public_id)
        return True
    except Exception:
        return False