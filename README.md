# RealEstate Pro — Portal Inmobiliario

Stack: **FastAPI + PostgreSQL + React + Tailwind + Stripe**

## Estructura de carpetas

```
realestate-pro/
├── backend/
│   ├── main.py              ← FastAPI: rutas, auth, middleware
│   ├── models.py            ← SQLAlchemy ORM (User, Property, Subscription)
│   ├── schemas.py           ← Pydantic schemas (validación)
│   ├── crud.py              ← Operaciones DB + auth.py integrado
│   ├── database.py          ← Engine, Session, Base
│   ├── setup_db.sql         ← Script PostgreSQL con seed
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── PropertyCard.jsx      ← Tarjeta reutilizable + Skeleton
    │   ├── pages/
    │   │   ├── HomePage.jsx          ← Hero + búsqueda + grid
    │   │   └── DashboardPage.jsx     ← Dashboard + React Hook Form
    │   ├── store/
    │   │   └── useStore.js           ← Zustand (auth + properties)
    │   ├── lib/
    │   │   ├── api.js                ← Axios instance + interceptors
    │   │   └── formatters.js         ← Utilidades de formato
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## Inicio rápido

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Crear base de datos
psql -U postgres -f setup_db.sql

# Iniciar servidor
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## Variables de entorno (backend)

```env
DATABASE_URL=postgresql://realestate_user:password@localhost:5432/realestate_pro
JWT_SECRET_KEY=tu-clave-secreta-super-segura
ACCESS_TOKEN_EXPIRE_MINUTES=1440

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_xxx
STRIPE_PRICE_PRO=price_yyy
STRIPE_PRICE_ENTERPRISE=price_zzz

FRONTEND_URL=http://localhost:5173
```

## Dependencias frontend adicionales
```bash
npm install zustand axios react-router-dom react-hook-form @hookform/resolvers zod lucide-react
```

## Flujo de autenticación

```
POST /auth/register → 201 Created
POST /auth/token    → { access_token, token_type }
GET  /auth/me       → UserOut (requiere Bearer token)
```

## Flujo de suscripción (Stripe)

```
POST /create-checkout-session → { checkout_url }
    ↓ (usuario paga en Stripe)
POST /webhooks/stripe         ← Stripe llama este endpoint
    ↓ (evento: checkout.session.completed)
    → Subscription activada en DB
    ↓
POST /properties              ← Ahora permitido ✓
```

## Endpoints resumen

| Método | Ruta | Auth | Suscripción |
|--------|------|------|-------------|
| GET | /properties | No | No |
| POST | /properties | ✓ JWT | ✓ Activa |
| PUT | /properties/{id} | ✓ JWT (dueño) | No |
| DELETE | /properties/{id} | ✓ JWT (dueño) | No |
| POST | /create-checkout-session | ✓ JWT | No |
| GET | /dashboard/my-properties | ✓ JWT | No |
| GET | /dashboard/subscription | ✓ JWT | No |

## Documentación automática
- Swagger UI: http://localhost:8000/docs
- ReDoc:       http://localhost:8000/redoc
