-- ═══════════════════════════════════════════════════════════════════════════
-- RealEstate Pro — PostgreSQL Setup Script
-- Ejecutar: psql -U postgres -f setup_db.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Crear usuario y base de datos
CREATE USER realestate_user WITH PASSWORD 'change_me_in_production';
CREATE DATABASE realestate_pro OWNER realestate_user;
GRANT ALL PRIVILEGES ON DATABASE realestate_pro TO realestate_user;

\c realestate_pro

-- 2. Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;  -- Para consultas geoespaciales (opcional)

-- 3. Tipos ENUM
CREATE TYPE plan_type AS ENUM ('basic', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'canceled', 'past_due');
CREATE TYPE property_type AS ENUM ('apartment', 'house', 'office', 'land', 'commercial');

-- 4. Tabla: users
CREATE TABLE IF NOT EXISTS users (
    id                SERIAL PRIMARY KEY,
    email             VARCHAR(255) UNIQUE NOT NULL,
    full_name         VARCHAR(255) NOT NULL,
    hashed_password   VARCHAR(255) NOT NULL,
    phone             VARCHAR(50),
    avatar_url        VARCHAR(500),
    is_active         BOOLEAN DEFAULT TRUE,
    is_verified       BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);

-- 5. Tabla: subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id                          SERIAL PRIMARY KEY,
    user_id                     INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id          VARCHAR(255) UNIQUE,
    stripe_subscription_id      VARCHAR(255) UNIQUE,
    plan_type                   plan_type NOT NULL,
    status                      subscription_status DEFAULT 'active',
    max_properties              INTEGER DEFAULT 5,
    max_photos_per_property     INTEGER DEFAULT 5,
    current_period_start        TIMESTAMPTZ,
    current_period_end          TIMESTAMPTZ,
    canceled_at                 TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 6. Tabla: properties
CREATE TABLE IF NOT EXISTS properties (
    id                  SERIAL PRIMARY KEY,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    price               FLOAT NOT NULL,
    price_currency      VARCHAR(3) DEFAULT 'COP',
    area_m2             FLOAT NOT NULL,
    bedrooms            INTEGER DEFAULT 0,
    bathrooms           INTEGER DEFAULT 0,
    parking_spots       INTEGER DEFAULT 0,
    floor               INTEGER,
    total_floors        INTEGER,
    property_type       property_type DEFAULT 'apartment',

    -- Ubicación
    address             VARCHAR(500) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    neighborhood        VARCHAR(100),
    latitude            FLOAT,
    longitude           FLOAT,

    -- Media (arrays en JSON)
    photos              JSONB DEFAULT '[]'::jsonb,
    main_photo          VARCHAR(500),
    virtual_tour_url    VARCHAR(500),

    -- Características
    features            JSONB DEFAULT '[]'::jsonb,
    is_furnished        BOOLEAN DEFAULT FALSE,
    has_balcony         BOOLEAN DEFAULT FALSE,
    has_elevator        BOOLEAN DEFAULT FALSE,
    pet_friendly        BOOLEAN DEFAULT FALSE,

    -- Status
    is_active           BOOLEAN DEFAULT TRUE,
    is_featured         BOOLEAN DEFAULT FALSE,
    views_count         INTEGER DEFAULT 0,

    -- FK
    owner_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ
);

CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_active ON properties(is_active);
CREATE INDEX idx_properties_type ON properties(property_type);
-- Índice compuesto para filtros más comunes
CREATE INDEX idx_properties_active_city ON properties(is_active, city);

-- ─── Función: auto-actualizar updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER properties_updated_at
    BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Seed: datos de prueba ────────────────────────────────────────────────────
INSERT INTO users (email, full_name, hashed_password, is_verified) VALUES
    ('admin@realestatepro.co', 'Admin RealEstate', '$2b$12$placeholder_hash', TRUE),
    ('carlos@example.com', 'Carlos Medina', '$2b$12$placeholder_hash', TRUE);

INSERT INTO subscriptions (user_id, plan_type, status, max_properties) VALUES
    (1, 'enterprise', 'active', -1),
    (2, 'pro', 'active', 25);

INSERT INTO properties (title, price, area_m2, bedrooms, bathrooms, property_type, address, city, neighborhood, is_featured, owner_id) VALUES
    ('Apartamento moderno en Chapinero Alto', 480000000, 82, 3, 2, 'apartment', 'Cra. 7 # 45-23', 'Bogotá', 'Chapinero', TRUE, 2),
    ('Casa colonial en El Poblado', 1200000000, 210, 5, 4, 'house', 'Cll. 8 # 43-50', 'Medellín', 'El Poblado', FALSE, 1),
    ('Penthouse vista Parque 93', 2100000000, 165, 4, 3, 'apartment', 'Cra. 15 # 93-47 PH', 'Bogotá', 'Parque 93', TRUE, 1);

-- ─── Verificación ─────────────────────────────────────────────────────────────
SELECT 'Setup completado exitosamente ✓' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_properties FROM properties;
