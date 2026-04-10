import React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Eye, Crown, AlertCircle, Clock } from 'lucide-react'
import { useAuthStore, usePropertiesStore } from '../store/useStore'
import { subscriptionAPI } from '../lib/api'
import { formatPrice } from '../lib/formatters'
import ImageUploader from '../components/ImageUploader'

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
  photos: z.array(z.object({ url: z.string(), public_id: z.string().optional() })).default([]),
})

// ─── Property Form ────────────────────────────────────────────────────────────
function PropertyForm({ onSuccess, onCancel }) {
  const { createProperty } = usePropertiesStore()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: { bedrooms: 0, bathrooms: 0, parking_spots: 0, property_type: 'apartment', photos: [] },
  })

  const onSubmit = async (data) => {
    setServerError(null)
    // Extraer URLs de fotos y definir foto principal
    const photoUrls = (data.photos || []).map(p => p.url)
    const propertyData = {
      ...data,
      photos: photoUrls,
      main_photo: photoUrls[0] || null,
    }
    const result = await createProperty(propertyData)
    if (result.success) {
      reset()
      onSuccess?.()
    } else {
      setServerError(result.error)
    }
  }

  const Field = ({ name, label, type = 'text', ...rest }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-stone-700">{label}</label>
      <input
        type={type}
        {...register(name)}
        className={`text-sm px-3 py-2 border rounded-lg outline-none transition-colors bg-white
          ${errors[name] ? 'border-rose-400' : 'border-stone-200 focus:border-amber-400'}`}
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
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
          <AlertCircle size={15} className="shrink-0" /> {serverError}
        </div>
      )}

      <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">Información general</h3>
        <div className="space-y-3">
          <Field name="title" label="Título del anuncio *" placeholder="Ej. Apartamento moderno en Chapinero Alto" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone-700">Descripción</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe las características más importantes…"
              className="text-sm px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-400 resize-none bg-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
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

      <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">Precio y métricas</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field name="price" label="Precio (COP) *" type="number" placeholder="450000000" />
          <Field name="area_m2" label="Área m² *" type="number" placeholder="85" />
          <Field name="bedrooms" label="Habitaciones" type="number" />
          <Field name="bathrooms" label="Baños" type="number" />
          <Field name="parking_spots" label="Parqueaderos" type="number" />
        </div>
      </section>

      <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">Fotos de la propiedad</h3>
        <Controller
          name="photos"
          control={control}
          render={({ field }) => (
            <ImageUploader
              value={field.value}
              onChange={field.onChange}
              maxImages={10}
            />
          )}
        />
      </section>

      <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">Ubicación</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field name="city" label="Ciudad *" placeholder="Bogotá" />
            <Field name="neighborhood" label="Barrio" placeholder="Chapinero" />
          </div>
          <Field name="address" label="Dirección completa *" placeholder="Cra. 7 # 45-23" />
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
        >
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTrialDaysRemaining(user) {
  if (!user?.trial_ends_at) return 0
  const delta = new Date(user.trial_ends_at) - new Date()
  return Math.max(0, Math.ceil(delta / (1000 * 60 * 60 * 24)))
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, subscription } = useAuthStore()
  const navigate = useNavigate()
  const { myProperties, isLoading, fetchMyProperties, deleteProperty } = usePropertiesStore()
  const [showForm, setShowForm] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => { fetchMyProperties() }, [])

  // ── Lógica de acceso ──────────────────────────────────────────────────────
  const trialDays = getTrialDaysRemaining(user)
  const trialActive = trialDays > 0
  const hasActiveSub = subscription?.status === 'active'
  const canPublish = trialActive || hasActiveSub   // ← trial O suscripción activa
  const trialExpired = !trialActive && !hasActiveSub

  const handleUpgrade = async (planType) => {
    setCheckoutLoading(true)
    try {
      const { data } = await subscriptionAPI.createCheckout(planType)
      window.location.href = data.checkout_url
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium">
            Hola, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {myProperties.length} inmueble{myProperties.length !== 1 ? 's' : ''} publicado{myProperties.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={!canPublish}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={15} /> Nuevo inmueble
        </button>
      </div>

      {/* ── Banner: Trial activo ── */}
      {trialActive && !hasActiveSub && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Clock size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">
                Período de prueba activo — {trialDays} día{trialDays !== 1 ? 's' : ''} restante{trialDays !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Puedes publicar propiedades libremente durante el trial. Elige un plan antes de que expire.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="shrink-0 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-stone-900 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Ver planes →
          </button>
        </div>
      )}

      {/* ── Banner: Trial expirado / sin suscripción ── */}
      {trialExpired && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Crown size={18} className="text-rose-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-rose-900">Tu período de prueba ha expirado</p>
              <p className="text-xs text-rose-700 mt-0.5">
                Elige un plan para volver a publicar propiedades. Tus anuncios están guardados.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {['basic', 'pro'].map((plan) => (
              <button
                key={plan}
                onClick={() => handleUpgrade(plan)}
                disabled={checkoutLoading}
                className="px-3 py-1.5 text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors capitalize disabled:opacity-50"
              >
                {plan}
              </button>
            ))}
            <button
              onClick={() => navigate('/pricing')}
              className="px-3 py-1.5 text-xs font-medium border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
            >
              Ver todos
            </button>
          </div>
        </div>
      )}

      {/* ── Badge: Suscripción activa ── */}
      {hasActiveSub && (
        <div className="flex items-center gap-2 mb-6 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 w-fit">
          <Crown size={13} className="text-emerald-500" />
          <span className="text-xs font-medium capitalize">Plan {subscription.plan_type} activo</span>
          <span className="text-xs text-emerald-400">·</span>
          <span className="text-xs text-emerald-600">
            {myProperties.length} / {subscription.max_properties === -1 ? '∞' : subscription.max_properties} propiedades
          </span>
        </div>
      )}

      {/* ── Formulario ── */}
      {showForm && (
        <div className="mb-8 bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-serif text-xl font-medium mb-5">Publicar propiedad</h2>
          <PropertyForm
            onSuccess={() => { setShowForm(false); fetchMyProperties() }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* ── Tabla de propiedades ── */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-medium text-stone-900 text-sm">Mis inmuebles</h2>
          {canPublish && myProperties.length === 0 && (
            <p className="text-xs text-stone-400">Aún no tienes inmuebles — ¡publica el primero!</p>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-stone-400 text-sm">Cargando…</div>
        ) : myProperties.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-4xl mb-3">🏠</p>
            <p className="text-stone-500 text-sm font-medium mb-1">Sin propiedades publicadas</p>
            <p className="text-stone-400 text-xs mb-4">
              {canPublish
                ? 'Haz click en "Nuevo inmueble" para publicar tu primer anuncio.'
                : 'Activa un plan para empezar a publicar.'}
            </p>
            {canPublish && (
              <button
                onClick={() => setShowForm(true)}
                className="text-xs text-amber-600 underline hover:text-amber-800"
              >
                Publicar ahora →
              </button>
            )}
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
                  <td className="px-4 py-3 text-stone-500">
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {(prop.views_count ?? 0).toLocaleString('es-CO')}
                    </span>
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
                    {new Date(prop.created_at).toLocaleDateString('es-CO', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
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