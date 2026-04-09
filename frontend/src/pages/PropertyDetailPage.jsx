import React from 'react'
// src/pages/PropertyDetailPage.jsx

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MapPin, BedDouble, Bath, Maximize, Car, Building2,
  Eye, Heart, Share2, ChevronLeft, ChevronRight,
  CheckCircle2, Phone, MessageCircle, AlertCircle,
} from 'lucide-react'
import { propertiesAPI } from '../lib/api'
import { formatPrice, formatRelativeDate } from '../lib/formatters'

// Skeleton para la página de detalle
function DetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-5 bg-stone-100 rounded w-40 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-80 bg-stone-100 rounded-2xl" />
          <div className="h-6 bg-stone-100 rounded w-3/4" />
          <div className="h-4 bg-stone-100 rounded w-1/2" />
          <div className="h-32 bg-stone-100 rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-stone-100 rounded-2xl" />
          <div className="h-32 bg-stone-100 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

// Galería de fotos simple con navegación
function PhotoGallery({ photos, title }) {
  const [idx, setIdx] = useState(0)
  const hasPhotos = photos && photos.length > 0
  const current = hasPhotos ? photos[idx] : null

  return (
    <div className="relative rounded-2xl overflow-hidden bg-stone-100 h-72 md:h-96 group">
      {current ? (
        <img src={current} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="font-serif text-8xl text-stone-300 select-none">⌂</span>
        </div>
      )}

      {hasPhotos && photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % photos.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Conteo */}
      {hasPhotos && (
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {idx + 1}/{photos.length}
        </div>
      )}
    </div>
  )
}

// Mapa placeholder (sustituir por Leaflet o Google Maps)
function MapPlaceholder({ latitude, longitude, address }) {
  if (!latitude || !longitude) return null
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

  return (
    <div className="card overflow-hidden">
      <div
        className="h-44 bg-stone-100 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-stone-200 transition-colors"
        onClick={() => window.open(mapsUrl, '_blank')}
      >
        <MapPin size={28} className="text-amber-500" />
        <p className="text-xs text-stone-500 text-center px-4">{address}</p>
        <span className="text-xs font-medium text-amber-600 underline">Ver en Google Maps →</span>
      </div>
    </div>
  )
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [contactSent, setContactSent] = useState(false)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await propertiesAPI.get(id)
        setProperty(data)
      } catch {
        navigate('/', { replace: true })
      } finally {
        setLoading(false)
      }
    }
    fetchProperty()
  }, [id])

  if (loading) return <DetailSkeleton />
  if (!property) return null

  const {
    title, description, price, price_currency, area_m2, bedrooms, bathrooms,
    parking_spots, property_type, address, city, neighborhood, latitude, longitude,
    photos, features, is_furnished, has_balcony, has_elevator, pet_friendly,
    views_count, is_featured, created_at, owner,
  } = property

  const locationStr = [neighborhood, city].filter(Boolean).join(', ')

  const specs = [
    { icon: BedDouble,  label: 'Habitaciones', value: bedrooms,      show: bedrooms > 0 },
    { icon: Bath,       label: 'Baños',         value: bathrooms,     show: bathrooms > 0 },
    { icon: Maximize,   label: 'Área',          value: `${area_m2} m²`, show: true },
    { icon: Car,        label: 'Parqueaderos',  value: parking_spots, show: parking_spots > 0 },
  ]

  const extras = [
    { label: 'Amoblado',        ok: is_furnished },
    { label: 'Balcón',          ok: has_balcony },
    { label: 'Ascensor',        ok: has_elevator },
    { label: 'Pet friendly',    ok: pet_friendly },
  ].filter((e) => e.ok)

  const typeLabels = {
    apartment: 'Apartamento', house: 'Casa', office: 'Oficina',
    land: 'Terreno', commercial: 'Local comercial',
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-up">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-stone-400 mb-6">
        <button onClick={() => navigate(-1)} className="hover:text-stone-700 flex items-center gap-1">
          <ChevronLeft size={14} /> Volver
        </button>
        <span>/</span>
        <span>{city}</span>
        <span>/</span>
        <span className="text-stone-600 truncate max-w-xs">{title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Columna principal ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Galería */}
          <PhotoGallery photos={photos} title={title} />

          {/* Título y metadatos */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="font-serif text-2xl md:text-3xl font-semibold leading-tight">{title}</h1>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setSaved((s) => !s)}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                    saved ? 'bg-rose-50 border-rose-200 text-rose-500' : 'border-stone-200 text-stone-400 hover:border-stone-300'
                  }`}
                >
                  <Heart size={15} className={saved ? 'fill-rose-500' : ''} />
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  className="w-9 h-9 rounded-full border border-stone-200 text-stone-400 flex items-center justify-center hover:border-stone-300 transition-colors"
                  title="Copiar enlace"
                >
                  <Share2 size={15} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500 mb-1">
              <span className="flex items-center gap-1"><MapPin size={13} />{locationStr}</span>
              <span className="flex items-center gap-1"><Building2 size={13} />{typeLabels[property_type] ?? property_type}</span>
              <span className="flex items-center gap-1"><Eye size={13} />{(views_count ?? 0).toLocaleString('es-CO')} vistas</span>
            </div>

            <p className="text-xs text-stone-400">
              Publicado {formatRelativeDate(created_at)}
              {is_featured && <span className="ml-2 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-medium">Destacado</span>}
            </p>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {specs.filter((s) => s.show).map(({ icon: Icon, label, value }) => (
              <div key={label} className="card p-4 text-center">
                <Icon size={18} className="mx-auto mb-1.5 text-amber-500" />
                <p className="font-serif text-xl font-semibold">{value}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Descripción */}
          {description && (
            <div className="card p-5">
              <h2 className="font-serif text-lg font-medium mb-3">Descripción</h2>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          )}

          {/* Características y extras */}
          {(features?.length > 0 || extras.length > 0) && (
            <div className="card p-5">
              <h2 className="font-serif text-lg font-medium mb-4">Características</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {extras.map(({ label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-stone-700">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    {label}
                  </div>
                ))}
                {features?.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-stone-700">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapa */}
          <MapPlaceholder latitude={latitude} longitude={longitude} address={address} />
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Precio + CTA */}
          <div className="card p-5 sticky top-20">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Precio</p>
            <p className="font-serif text-3xl font-semibold mb-0.5">
              {formatPrice(price, price_currency)}
            </p>
            <p className="text-xs text-stone-400 mb-5">
              {price_currency} · {(price / area_m2).toLocaleString('es-CO', { maximumFractionDigits: 0 })} por m²
            </p>

            {/* Botones de contacto */}
            {contactSent ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl text-sm">
                <CheckCircle2 size={16} /> ¡Solicitud enviada! El vendedor te contactará pronto.
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setContactSent(true)}
                  className="btn-primary w-full justify-center"
                >
                  Contactar al vendedor
                </button>
                {owner?.phone && (
                  <a
                    href={`https://wa.me/${owner.phone.replace(/\D/g, '')}?text=Hola, estoy interesado en la propiedad: ${title}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary w-full justify-center flex items-center gap-2"
                  >
                    <MessageCircle size={15} className="text-emerald-500" />
                    WhatsApp
                  </a>
                )}
                {owner?.phone && (
                  <a
                    href={`tel:${owner.phone}`}
                    className="btn-secondary w-full justify-center flex items-center gap-2"
                  >
                    <Phone size={15} /> Llamar
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Info del agente */}
          {owner && (
            <div className="card p-5">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-3">Publicado por</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-semibold text-sm shrink-0">
                  {owner.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-sm text-stone-900">{owner.full_name}</p>
                  {owner.phone && (
                    <p className="text-xs text-stone-400 mt-0.5">{owner.phone}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Aviso legal */}
          <div className="flex gap-2 text-[11px] text-stone-400 leading-relaxed">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-stone-300" />
            Verifica siempre la identidad del vendedor y la documentación legal antes de realizar cualquier pago.
          </div>
        </div>
      </div>
    </div>
  )
}