import React from 'react'
// src/components/PropertyCard.jsx
// Tarjeta de propiedad con skeleton loading, favoritos y navegación

import { useState } from 'react'
import { Heart, MapPin, BedDouble, Bath, Maximize, Eye } from 'lucide-react'
import { formatPrice } from '../lib/formatters'

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden animate-pulse">
      <div className="h-48 bg-stone-100" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-stone-100 rounded w-1/2" />
        <div className="h-4 bg-stone-100 rounded w-3/4" />
        <div className="h-3 bg-stone-100 rounded w-2/3" />
        <div className="flex gap-3 pt-2">
          <div className="h-3 bg-stone-100 rounded w-12" />
          <div className="h-3 bg-stone-100 rounded w-12" />
          <div className="h-3 bg-stone-100 rounded w-12" />
        </div>
      </div>
    </div>
  )
}

// ─── PropertyCard ─────────────────────────────────────────────────────────────
export default function PropertyCard({ property, onNavigate }) {
  const [isSaved, setIsSaved] = useState(false)

  const {
    id,
    title,
    price,
    price_currency = 'COP',
    listing_type = 'sale',
    rental_price,
    rental_includes_admin,
    admin_fee,
    area_m2,
    bedrooms,
    bathrooms,
    city,
    neighborhood,
    main_photo,
    property_type,
    is_featured,
    views_count,
    owner,
  } = property

  const isRent = listing_type === 'rent'
  const isRentSale = listing_type === 'rent_sale'
  const displayPrice = isRent ? rental_price : price
  const displayCurrency = price_currency

  const locationStr = [neighborhood, city].filter(Boolean).join(' · ')
  const ownerInitials = owner?.full_name
    ? owner.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('')
    : '?'

  const handleSave = (e) => {
    e.stopPropagation()
    setIsSaved((s) => !s)
  }

  return (
    <article
      onClick={() => onNavigate?.(`/properties/${id}`)}
      className={`
        group bg-white rounded-xl border overflow-hidden cursor-pointer
        transition-all duration-200 hover:-translate-y-1 hover:shadow-lg
        ${is_featured ? 'border-amber-400' : 'border-stone-200'}
      `}
    >
      {/* ── Image ── */}
      <div className="relative h-48 bg-stone-100 overflow-hidden">
        {main_photo ? (
          <img
            src={main_photo}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-6xl select-none">
            ⌂
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {is_featured && (
            <span className="bg-amber-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-sm tracking-wide">
              Destacado
            </span>
          )}
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-sm
            ${isRent ? 'bg-amber-600 text-white' : isRentSale ? 'bg-purple-600 text-white' : 'bg-stone-800/70 text-white'}`}>
            {isRent ? 'Arriendo' : isRentSale ? 'Arr. y Venta' : 'Venta'}
          </span>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          aria-label={isSaved ? 'Quitar de favoritos' : 'Guardar'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-colors hover:bg-white"
        >
          <Heart
            size={14}
            className={isSaved ? 'fill-rose-500 stroke-rose-500' : 'stroke-stone-400'}
          />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="p-4">
        <div className="mb-0.5">
          {isRentSale ? (
            <div className="flex flex-col gap-0">
              <p className="font-serif text-lg font-semibold text-stone-900 leading-tight">
                {formatPrice(price, price_currency)}
              </p>
              <p className="text-xs text-amber-700 font-medium">
                {formatPrice(rental_price, price_currency)}<span className="text-stone-400 font-normal">/mes</span>
              </p>
            </div>
          ) : (
            <p className="font-serif text-xl font-semibold text-stone-900">
              {formatPrice(displayPrice, displayCurrency)}
              {isRent && <span className="text-sm font-normal text-stone-400">/mes</span>}
            </p>
          )}
        </div>

        <h3 className="text-sm font-medium text-stone-800 truncate mb-1">{title}</h3>

        <p className="flex items-center gap-1 text-xs text-stone-500 mb-3">
          <MapPin size={11} className="shrink-0" />
          {locationStr}
        </p>

        {/* Specs */}
        <div className="flex gap-4 pt-3 border-t border-stone-100">
          {bedrooms > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-stone-500">
              <BedDouble size={12} /> {bedrooms} hab.
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-stone-500">
            <Maximize size={12} /> {area_m2}m²
          </span>
          {bathrooms > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-stone-500">
              <Bath size={12} /> {bathrooms}
            </span>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-2.5 border-t border-stone-100 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[9px] font-semibold shrink-0">
          {ownerInitials}
        </div>
        <span className="text-[11px] text-stone-500 flex-1 truncate">
          {owner?.full_name ?? 'Propietario'}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-stone-400">
          <Eye size={11} />
          {(views_count ?? 0).toLocaleString('es-CO')}
        </span>
      </div>
    </article>
  )
}