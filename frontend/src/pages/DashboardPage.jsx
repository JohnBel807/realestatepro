import React from 'react'
// src/pages/DashboardPage.jsx
// Dashboard del vendedor: mis propiedades + formulario de creación con React Hook Form

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Eye, Crown, AlertCircle } from 'lucide-react'
import { useAuthStore, usePropertiesStore } from '../store/useStore'
import { subscriptionAPI } from '../lib/api'
import { formatPrice } from '../lib/formatters'

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const propertySchema = z.object({
  title: z.string().min(10, 'Mínimo 10 caracteres').max(500),
  description: z.string().optional(),
  price: z.coerce.number().positive('El precio debe ser mayor a 0'),
  area_m2: z.coerce.number().positive('El área debe ser mayor a 0'),
  bedrooms: z.coerce.number().int().min(0).default(0),
  bathrooms: z.coerce.number().int().min(0).default(0),
  parking_spots: z.coerce.number().int().min(0).default(0),
  property_type: z.enum(['apartment', 'house', 'office', 'land', 'commercial']),
  address: z.string().min(5, 'Dirección requerida'),
  city: z.string().min(2, 'Ciudad requerida'),
  neighborhood: z.string().optional(),
})

// ─── Form Component ───────────────────────────────────────────────────────────
function PropertyForm({ onSuccess, onCancel }) {
  const { createProperty } = usePropertiesStore()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: { bedrooms: 0, bathrooms: 0, parking_spots: 0, property_type: 'apartment' },
  })

  const onSubmit = async (data) => {
    setServerError(null)
    const result = await createProperty(data)
    if (result.success) {
      reset()
      onSuccess?.()
    } else {
      setServerError(result.error)
    }
  }

  const Field = ({ name, label, type = 'text', ...rest }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-stone-700">{label}</label>
      <input
        type={type}
        {...register(name)}
        className={`text-sm px-3 py-2 border rounded-lg outline-none transition-colors bg-white
          ${errors[name] ? 'border-rose-400 focus:border-rose-500' : 'border-stone-200 focus:border-amber-400'}`}
        {...rest}
      />
      {errors[name] && (
        <p className="text-[11px] text-rose-500 flex items-center gap-1">
          <AlertCircle size={10} /> {errors[name].message}
        </p>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={15} /> {serverError}
        </div>
      )}

      {/* General */}
      <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">
          Información general
        </h3>
        <div className="space-y-3">
          <Field name="title" label="Título del anuncio *" placeholder="Ej. Apartamento moderno en Chapinero Alto" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-700">Descripción</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe las características más importantes…"
              className="text-sm px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-400 resize-none bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-700">Tipo de propiedad *</label>
            <select
              {...register('property_type')}
              className="text-sm px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-400 bg-white"
            >
              <option value="apartment">Apartamento</option>
              <option value="house">Casa</option>
              <option value="office">Oficina</option>
              <option value="land">Terreno</option>
              <option value="commercial">Local comercial</option>
            </select>
          </div>
        </div>
      </section>

      {/* Precio y métricas */}
      <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">
          Precio y métricas
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Field name="price" label="Precio (COP) *" type="number" placeholder="450000000" />
          <Field name="area_m2" label="Área m² *" type="number" placeholder="85" />
          <Field name="bedrooms" label="Habitaciones" type="number" />
          <Field name="bathrooms" label="Baños" type="number" />
          <Field name="parking_spots" label="Parqueaderos" type="number" />
        </div>
      </section>

      {/* Ubicación */}
      <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">
          Ubicación
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field name="city" label="Ciudad *" placeholder="Bogotá" />
            <Field name="neighborhood" label="Barrio" placeholder="Chapinero" />
          </div>
          <Field name="address" label="Dirección completa *" placeholder="Cra. 7 # 45-23" />
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isSubmitting ? 'Publicando…' : 'Publicar inmueble →'}
        </button>
      </div>
    </form>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, subscription } = useAuthStore()
  const navigate = useNavigate()
  const { myProperties, isLoading, fetchMyProperties, deleteProperty } = usePropertiesStore()
  const [showForm, setShowForm] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => { fetchMyProperties() }, [])

  const handleUpgrade = async (planType) => {
    setCheckoutLoading(true)
    try {
      const { data } = await subscriptionAPI.createCheckout(planType)
      window.location.href = data.checkout_url
    } finally {
      setCheckoutLoading(false)
    }
  }

  const noSubscription = !subscription || subscription.status !== 'active'

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium">Hola, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {myProperties.length} inmueble{myProperties.length !== 1 ? 's' : ''} publicado{myProperties.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={noSubscription}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-40 transition-colors"
        >
          <Plus size={15} /> Nuevo inmueble
        </button>
      </div>

      {/* Subscription banner */}
      {noSubscription && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown size={18} className="text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">Necesitas una suscripción para publicar</p>
              <p className="text-xs text-amber-700 mt-0.5">Elige un plan para empezar a publicar propiedades</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['basic', 'pro'].map((plan) => (
              <button
                key={plan}
                onClick={() => handleUpgrade(plan)}
                disabled={checkoutLoading}
                className="px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-lg transition-colors capitalize"
              >
                {plan}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subscription / Trial info */}
      {!noSubscription && (
        <div className="flex items-center gap-2 mb-6 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 w-fit">
          <Crown size={13} className="text-emerald-500" />
          <span className="text-xs font-medium capitalize">Plan {subscription.plan_type} activo</span>
          <span className="text-xs text-emerald-500">·</span>
          <span className="text-xs text-emerald-600">
            {myProperties.length} / {subscription.max_properties === -1 ? '∞' : subscription.max_properties} propiedades
          </span>
        </div>
      )}
      {noSubscription && (() => {
        const days = user?.trial_ends_at
          ? Math.max(0, Math.ceil((new Date(user.trial_ends_at) - new Date()) / 86400000))
          : 0
        return days > 0 ? (
          <div className="flex items-center gap-2 mb-6 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-fit">
            <span className="text-xs">⏱</span>
            <span className="text-xs font-medium">Trial activo — {days} días restantes</span>
            <button onClick={() => navigate('/pricing')} className="text-xs underline text-amber-600 hover:text-amber-800 ml-1">
              Elegir plan
            </button>
          </div>
        ) : null
      })()}

      {/* Form modal-like */}
      {showForm && (
        <div className="mb-8 bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-serif text-xl font-medium mb-5">Publicar propiedad</h2>
          <PropertyForm
            onSuccess={() => { setShowForm(false); fetchMyProperties() }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Properties table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-medium text-stone-900 text-sm">Mis inmuebles</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-stone-400 text-sm">Cargando…</div>
        ) : myProperties.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-stone-400 text-sm">Aún no tienes inmuebles publicados.</p>
            <button
              onClick={() => setShowForm(true)}
              disabled={noSubscription}
              className="mt-3 text-xs text-amber-600 underline disabled:opacity-40"
            >
              Publicar mi primer inmueble
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                {['Inmueble', 'Precio', 'Vistas', 'Estado', 'Publicado', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-stone-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {myProperties.map((prop) => (
                <tr key={prop.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-stone-800 max-w-xs truncate">{prop.title}</td>
                  <td className="px-4 py-3 text-stone-600 font-serif">
                    {formatPrice(prop.price, prop.price_currency)}
                  </td>
                  <td className="px-4 py-3 text-stone-500 flex items-center gap-1">
                    <Eye size={12} /> {(prop.views_count ?? 0).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      prop.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-stone-100 text-stone-500'
                    }`}>
                      {prop.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">
                    {new Date(prop.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteProperty(prop.id)}
                        className="p-1.5 rounded-md hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}