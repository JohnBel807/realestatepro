"""
create_superuser.py
Crea el superusuario admin en la base de datos.
Ejecutar UNA VEZ en Railway con:
  python create_superuser.py

O en el Procfile como comando de inicialización.
"""
import os, sys
from datetime import datetime, timedelta

# Asegurar que encuentra los módulos del proyecto
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
import models
from auth import get_password_hash

SUPERUSER_EMAIL    = "johnbel807@gmail.com"
SUPERUSER_PASSWORD = "Alejo@2013"
SUPERUSER_NAME     = "John Edinson Beltrán — Admin"

def create_superuser():
    # Crear tablas si no existen
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(
            models.User.email == SUPERUSER_EMAIL
        ).first()

        if existing:
            # Actualizar a superusuario si ya existe
            existing.is_superuser    = True
            existing.is_active       = True
            existing.hashed_password = get_password_hash(SUPERUSER_PASSWORD)
            existing.trial_ends_at   = datetime(2099, 12, 31)  # nunca expira
            db.commit()
            print(f"✅ Superusuario actualizado: {SUPERUSER_EMAIL}")
        else:
            superuser = models.User(
                email            = SUPERUSER_EMAIL,
                full_name        = SUPERUSER_NAME,
                hashed_password  = get_password_hash(SUPERUSER_PASSWORD),
                is_active        = True,
                is_superuser     = True,
                is_verified      = True,
                trial_ends_at    = datetime(2099, 12, 31),  # nunca expira
            )
            db.add(superuser)
            db.commit()
            db.refresh(superuser)

            # Suscripción enterprise gratuita y permanente
            sub = models.Subscription(
                user_id                  = superuser.id,
                plan_type                = models.PlanType.enterprise,
                status                   = models.SubscriptionStatus.active,
                stripe_customer_id       = "admin_free",
                stripe_subscription_id   = "admin_free_enterprise",
                max_properties           = -1,   # ilimitado
                max_photos_per_property  = -1,
                current_period_start     = datetime.utcnow(),
                current_period_end       = datetime(2099, 12, 31),
            )
            db.add(sub)
            db.commit()
            print(f"✅ Superusuario creado: {SUPERUSER_EMAIL}")
            print(f"   Plan: Enterprise (ilimitado, gratuito, permanente)")

    finally:
        db.close()

if __name__ == "__main__":
    create_superuser()