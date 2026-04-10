// src/pages/HomePage.jsx — VelezyRicaurte Inmobiliaria
import React, { useEffect, useState } from 'react'
import { Search, MapPin, Home, Leaf } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard'
import SEOHead from '../components/SEOHead'
import { usePropertiesStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'

// ─── Paleta regional ──────────────────────────────────────────────────────────
const COLORS = {
  tierra:    '#6B4E2A',   // Marrón tierra Santander
  verde:     '#2D6B2A',   // Verde cordillera
  naranja:   '#C4631A',   // Naranja atardecer
  crema:     '#F5EFE6',   // Crema cálido
  oscuro:    '#1C1208',   // Oscuro tierra
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ total, localFilters, setLocalFilters, onSearch }) {
  const { t } = useTranslation()

  return (
    <section style={{ background: `linear-gradient(160deg, ${COLORS.oscuro} 0%, #2A1A08 55%, #1A2808 100%)` }}
      className="relative pt-14 pb-12 px-4 overflow-hidden">

      {/* Decoración — silueta de montañas */}
      <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path d="M0,120 L0,80 L120,40 L240,70 L360,20 L480,60 L600,10 L720,50 L840,15 L960,55 L1080,25 L1200,65 L1320,30 L1440,70 L1440,120 Z"
          fill={COLORS.verde} />
        <path d="M0,120 L0,95 L180,65 L360,90 L540,50 L720,80 L900,45 L1080,75 L1260,55 L1440,85 L1440,120 Z"
          fill={COLORS.naranja} opacity="0.6" />
      </svg>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-4">
          <Leaf size={12} style={{ color: COLORS.verde }} />
          <span className="text-xs tracking-widest uppercase font-medium" style={{ color: COLORS.verde }}>
            {t('hero.eyebrow')}
          </span>
          <Leaf size={12} style={{ color: COLORS.verde }} />
        </div>

        {/* Título con tipografía serif y colores regionales */}
        <h1 className="font-serif font-semibold leading-tight mb-3" style={{ fontSize: 'clamp(2rem,5vw,3.2rem)' }}>
          <span style={{ color: '#F5EFE6' }}>{t('hero.title')}</span>{' '}
          <span style={{ color: COLORS.naranja }}>{t('hero.title_highlight')}</span>
        </h1>

        <p className="text-sm mb-8 max-w-lg mx-auto leading-relaxed" style={{ color: 'rgba(245,239,230,0.6)' }}>
          {t('hero.subtitle')}
        </p>

        {/* Search box */}
        <form onSubmit={onSearch}
          className="rounded-2xl p-3 grid gap-2 text-left shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.97)', gridTemplateColumns: '1fr 1fr 1fr auto' }}>

          {/* Ciudad */}
          <div className="flex flex-col gap-1 px-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: COLORS.tierra }}>
              {t('hero.search_label_city')}
            </label>
            <input type="text"
              placeholder={t('hero.search_placeholder_city')}
              value={localFilters.city}
              onChange={e => setLocalFilters(f => ({ ...f, city: e.target.value }))}
              className="text-sm border-none outline-none bg-transparent text-stone-800 placeholder:text-stone-300" />
          </div>

          <div className="w-px bg-stone-100 my-1" />

          {/* Modalidad */}
          <div className="flex flex-col gap-1 px-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: COLORS.tierra }}>
              {t('hero.search_label_mode')}
            </label>
            <select value={localFilters.listing_type}
              onChange={e => setLocalFilters(f => ({ ...f, listing_type: e.target.value }))}
              className="text-sm border-none outline-none bg-transparent text-stone-800 appearance-none cursor-pointer">
              <option value="">{t('listing.all')}</option>
              <option value="sale">{t('listing.sale')}</option>
              <option value="rent">{t('listing.rent')}</option>
              <option value="rent_sale">{t('listing.rent_sale')}</option>
            </select>
          </div>

          <div className="w-px bg-stone-100 my-1" />

          {/* Tipo */}
          <div className="flex flex-col gap-1 px-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: COLORS.tierra }}>
              {t('hero.search_label_type')}
            </label>
            <select value={localFilters.property_type}
              onChange={e => setLocalFilters(f => ({ ...f, property_type: e.target.value }))}
              className="text-sm border-none outline-none bg-transparent text-stone-800 appearance-none cursor-pointer">
              <option value="">{t('property_types.all')}</option>
              <option value="house">{t('property_types.house')}</option>
              <option value="land">{t('property_types.land')}</option>
              <option value="apartment">{t('property_types.apartment')}</option>
              <option value="commercial">{t('property_types.commercial')}</option>
            </select>
          </div>

          {/* Botón */}
          <button type="submit"
            className="flex items-center justify-center gap-2 px-5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: COLORS.naranja, color: '#fff', minWidth: 110 }}>
            <Search size={15} />
            {t('hero.search_btn')}
          </button>
        </form>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-6">
          {[
            { n: total.toLocaleString('es-CO'), l: t('hero.stats_properties') },
            { n: '100%', l: t('hero.stats_verified') },
          ].map(({ n, l }) => (
            <div key={l} className="text-center">
              <p className="font-serif text-xl font-semibold" style={{ color: COLORS.naranja }}>{n}</p>
              <p className="text-xs" style={{ color: 'rgba(245,239,230,0.5)' }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Quick filters chips ───────────────────────────────────────────────────────
function QuickFilter({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className="text-xs px-4 py-2 rounded-full border font-medium transition-all"
      style={active
        ? { background: COLORS.tierra, color: '#fff', borderColor: COLORS.tierra }
        : { background: '#fff', color: '#6B6456', borderColor: '#E8E2D9' }}>
      {label}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { properties, total, isLoading, fetchProperties, setFilters, filters, page, limit, nextPage, prevPage } =
    usePropertiesStore()

  const [localFilters, setLocalFilters] = useState({ city: '', listing_type: '', property_type: '' })
  const [activeChip, setActiveChip] = useState('all')

  useEffect(() => { fetchProperties(true) }, [filters])
  useEffect(() => { fetchProperties() }, [page])

  const handleSearch = (e) => {
    e?.preventDefault()
    const applied = {}
    if (localFilters.city) applied.city = localFilters.city
    if (localFilters.listing_type) applied.listing_type = localFilters.listing_type
    if (localFilters.property_type) applied.property_type = localFilters.property_type
    setFilters(applied)
    setActiveChip('all')
  }

  const applyChip = (key, value) => {
    setActiveChip(key)
    if (key === 'all') { setFilters({}); return }
    setFilters({ [key.startsWith('lt_') ? 'listing_type' : 'property_type']: value })
  }

  const totalPages = Math.ceil(total / limit)

  const chips = [
    { key: 'all',        label: t('listing.all') },
    { key: 'lt_sale',    label: t('listing.sale'),   value: 'sale',  filter: 'lt' },
    { key: 'lt_rent',    label: t('listing.rent'),   value: 'rent',  filter: 'lt' },
    { key: 'pt_house',   label: t('property_types.house'), value: 'house', filter: 'pt' },
    { key: 'pt_land',    label: t('property_types.land'),  value: 'land',  filter: 'pt' },
  ]

  return (
    <main className="min-h-screen" style={{ background: COLORS.crema }}>
      <SEOHead />

      <Hero total={total} localFilters={localFilters}
        setLocalFilters={setLocalFilters} onSearch={handleSearch} />

      {/* Chips de filtro rápido */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2 flex gap-2 flex-wrap">
        {chips.map(c => (
          <QuickFilter key={c.key} label={c.label} active={activeChip === c.key}
            onClick={() => applyChip(c.key, c.value)} />
        ))}
        {Object.keys(filters).length > 0 && (
          <button onClick={() => { setFilters({}); setActiveChip('all') }}
            className="text-xs px-3 py-2 text-stone-500 hover:text-stone-800 underline">
            {t('listing.clear_filters')}
          </button>
        )}
      </div>

      {/* Grid de propiedades */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-medium" style={{ color: COLORS.oscuro }}>
            {Object.keys(filters).length > 0 ? 'Resultados' : t('listing.featured')}
            <span className="ml-2 text-sm font-normal text-stone-400 font-sans">
              {total.toLocaleString('es-CO')} {t('listing.found')}
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)
            : properties.map(prop => (
                <PropertyCard key={prop.id} property={prop}
                  onNavigate={path => navigate(path)} />
              ))}
        </div>

        {!isLoading && properties.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🏔️</p>
            <p className="text-stone-500 text-sm font-medium">{t('listing.no_results')}</p>
            <button onClick={() => { setFilters({}); setActiveChip('all') }}
              className="mt-3 text-xs underline" style={{ color: COLORS.naranja }}>
              {t('listing.clear_filters')}
            </button>
          </div>
        )}

        {/* Paginación */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button onClick={prevPage} disabled={page === 0}
              className="px-4 py-2 text-sm border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-100 bg-white transition-colors">
              ← Anterior
            </button>
            <span className="text-sm text-stone-500">{page + 1} / {totalPages}</span>
            <button onClick={nextPage} disabled={page + 1 >= totalPages}
              className="px-4 py-2 text-sm border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-100 bg-white transition-colors">
              Siguiente →
            </button>
          </div>
        )}
      </section>

      {/* Footer regional */}
      <footer className="mt-12 py-8 border-t border-stone-200 text-center">
        <p className="font-serif text-lg mb-1" style={{ color: COLORS.tierra }}>
          <span style={{ color: COLORS.tierra }}>Velez</span>
          <span style={{ color: COLORS.verde }}>&</span>
          <span style={{ color: COLORS.naranja }}>Ricaurte</span>
          <span className="text-stone-400 font-sans text-sm font-normal ml-2">Inmobiliaria</span>
        </p>
        <p className="text-xs text-stone-400">
          Provincias de Vélez (Santander) y Ricaurte (Boyacá), Colombia
        </p>
        <div className="flex justify-center gap-4 mt-3 text-xs text-stone-400">
          {['Barbosa', 'Vélez', 'Moniquirá', 'Puente Nacional', 'Landázuri'].map(city => (
            <button key={city} onClick={() => { setFilters({ city: city.toLowerCase() }); window.scrollTo(0, 0) }}
              className="hover:text-stone-700 transition-colors">
              {city}
            </button>
          ))}
        </div>
      </footer>
    </main>
  )
}