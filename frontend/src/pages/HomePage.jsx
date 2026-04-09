import React from 'react'
// src/pages/HomePage.jsx
// Home: hero search + grid dinámico con filtros y paginación

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard'
import { usePropertiesStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'

const PROPERTY_TYPES = [
  { label: 'Todos', value: '' },
  { label: 'Apartamento', value: 'apartment' },
  { label: 'Casa', value: 'house' },
  { label: 'Oficina', value: 'office' },
  { label: 'Terreno', value: 'land' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { properties, total, isLoading, fetchProperties, setFilters, filters, page, limit, nextPage, prevPage } =
    usePropertiesStore()

  // Local search state (applied on submit)
  const [localFilters, setLocalFilters] = useState({
    city: '',
    property_type: '',
    max_price: '',
  })

  useEffect(() => {
    fetchProperties(true)
  }, [filters])  // re-fetch when global filters change

  useEffect(() => {
    fetchProperties()
  }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    const applied = {}
    if (localFilters.city) applied.city = localFilters.city
    if (localFilters.property_type) applied.property_type = localFilters.property_type
    if (localFilters.max_price) applied.max_price = Number(localFilters.max_price)
    setFilters(applied)
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = page + 1

  return (
    <main className="min-h-screen bg-stone-50">
      {/* ── Hero ── */}
      <section className="bg-stone-900 pt-16 pb-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-amber-400 text-xs tracking-widest uppercase font-medium mb-3">
            Colombia · {total.toLocaleString('es-CO')} propiedades
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-white leading-tight mb-2">
            Encuentra tu lugar <span className="text-amber-400">perfecto</span>
          </h1>
          <p className="text-stone-400 text-sm mb-8 font-light">
            Propiedades verificadas de propietarios reales en toda Colombia
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-left"
          >
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                Ciudad
              </label>
              <input
                type="text"
                placeholder="Bogotá, Medellín…"
                value={localFilters.city}
                onChange={(e) => setLocalFilters((f) => ({ ...f, city: e.target.value }))}
                className="text-sm border-none outline-none bg-transparent text-stone-800 placeholder:text-stone-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                Tipo
              </label>
              <select
                value={localFilters.property_type}
                onChange={(e) => setLocalFilters((f) => ({ ...f, property_type: e.target.value }))}
                className="text-sm border-none outline-none bg-transparent text-stone-800 appearance-none"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
                Precio máx (COP)
              </label>
              <input
                type="number"
                placeholder="Sin límite"
                value={localFilters.max_price}
                onChange={(e) => setLocalFilters((f) => ({ ...f, max_price: e.target.value }))}
                className="text-sm border-none outline-none bg-transparent text-stone-800 placeholder:text-stone-300"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-stone-900 font-medium text-sm rounded-lg transition-colors"
            >
              <Search size={15} /> Buscar
            </button>
          </form>
        </div>
      </section>

      {/* ── Results ── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-medium text-stone-900">
            {Object.keys(filters).length > 0 ? 'Resultados' : 'Propiedades destacadas'}
            <span className="ml-2 text-sm font-normal text-stone-400 font-sans">
              {total.toLocaleString('es-CO')} encontradas
            </span>
          </h2>
          {Object.keys(filters).length > 0 && (
            <button
              onClick={() => setFilters({})}
              className="text-xs text-amber-600 hover:text-amber-800 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)
            : properties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  onNavigate={(path) => navigate(path)}
                />
              ))}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={prevPage}
              disabled={page === 0}
              className="px-4 py-2 text-sm border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-100 transition-colors"
            >
              ← Anterior
            </button>
            <span className="text-sm text-stone-500">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 text-sm border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-100 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        )}
      </section>
    </main>
  )
}