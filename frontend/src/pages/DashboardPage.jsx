import React, { useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Eye, Crown, AlertCircle, Clock, Home, Key } from 'lucide-react'
import { useAuthStore, usePropertiesStore } from '../store/useStore'
import { subscriptionAPI } from '../lib/api'
import { formatPrice } from '../lib/formatters'
import ImageUploader from '../components/ImageUploader'

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const propertySchema = z.object({
  listing_type: z.enum(['sale', 'rent', 'rent_sale']),
  title: z.string().min(10, 'Mínimo 10 caracteres').max(500),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  rental_price: z.coerce.number().positive('Ingresa el precio de arriendo').optional(),
  rental_deposit: z.coerce.number().min(0).optional(),
  rental_min_months: z.coerce.number().int().min(1).optional(),
  rental_includes_admin: z.boolean().default(false),
  admin_fee: z.coerce.number().min(0).optional(),
  area_m2: z.coerce.number().positive('El área debe ser mayor a 0'),
  bedrooms: z.coerce.number().int().min(0).default(0),
  bathrooms: z.coerce.number().int().min(0).default(0),
  parking_spots: z.coerce.number().int().min(0).default(0),
  property_type: z.enum(['apartment', 'house', 'office', 'land', 'commercial']),
  address: z.string().min(5, 'Dirección requerida'),
  city: z.string().min(2, 'Ciudad requerida'),
  neighborhood: z.string().optional(),
  photos: z.array(z.object({ url: z.string(), public_id: z.string().optional() })).default([]),
}).refine((d) => {
  if (d.listing_type === 'sale' || d.listing_type === 'rent_sale') {
    return d.price && d.price > 0
  }
  return true
}, { message: 'El precio de venta es requerido', path: ['price'] })
.refine((d) => {
  if (d.listing_type === 'rent' || d.listing_type === 'rent_sale') {
    return d.rental_price && d.rental_price > 0
  }
  return true
}, { message: 'El precio de arriendo es requerido', path: ['rental_price'] })

// ─── Field helper ─────────────────────────────────────────────────────────────
function Field({ register, errors, name, label, type = 'text', optional = false, prefix, ...rest }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-stone-700">
        {label}{optional && <span className="text-stone-400 font-normal ml-1">(opcional)</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">{prefix}</span>
        )}
        <input
          type={type}
          {...register(name)}
          className={`w-full text-sm py-2 border rounded-lg outline-none transition-colors bg-white
            ${prefix ? 'pl-10 pr-3' : 'px-3'}
            ${errors[name] ? 'border-rose-400 focus:border-rose-500' : 'border-stone-200 focus:border-amber-400'}`}
          {...rest}
        />
      </div>
      {errors[name] && (
        <p className="text-[11px] text-rose-500 flex items-center gap-1">
          <AlertCircle size={10} /> {errors[name].message}
        </p>
      )}
    </div>
  )
}

// ─── Listing Type Selector ────────────────────────────────────────────────────
function ListingTypeSelector({ value, onChange }) {
  const options = [
    { value: 'sale',      label: 'Venta',            icon: Home,  desc: 'Propiedad en venta' },
    { value: 'rent',      label: 'Arriendo',          icon: Key,   desc: 'Propiedad en arriendo' },
    { value: 'rent_sale', label: 'Arriendo y Venta',  icon: null,  desc: 'Ambas modalidades' },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const Icon = opt.icon
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all
              ${active
                ? 'border-amber-400 bg-amber-50 text-amber-800'
                : 'border-stone-200 hover:border-stone-300 text-stone-600'
              }`}
          >
            {Icon && <Icon size={16} className={active ? 'text-amber-600' : 'text-stone-400'} />}
            {!Icon && <span className="text-base">🏷️</span>}
            <span className="text-xs font-medium leading-tight">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

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
    defaultValues: {
      listing_type: 'sale',
      bedrooms: 0,
      bathrooms: 0,
      parking_spots: 0,
      property_type: 'apartment',
      rental_includes_admin: false,
      photos: [],
    },
  })

  const listingType = useWatch({ control, name: 'listing_type' })
  const includesAdmin = useWatch({ control, name: 'rental_includes_admin' })

  const isSale = listingType === 'sale' || listingType === 'rent_sale'
  const isRent = listingType === 'rent' || listingType === 'rent_sale'

  const onSubmit = async (data) => {
    setServerError(null)
    const photoUrls = (data.photos || []).map(p => p.url)
    const propertyData = {
      ...data,
      photos: photoUrls,
      main_photo: photoUrls[0] || null,
      price: isSale ? (data.price || 0) : 0,
    }
    const result = await createProperty(propertyData)
    if (result.success) {
      reset()
      onSuccess?.()
    } else {
      setServerError(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
          <AlertCircle size={15} className="shrink-0" /> {serverError}
        </div>
      )}

      {/* ── Tipo de operación ── */}
      <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">Tipo de operación</h3>
        <Controller
          name="listing_type"
          control={control}
          render={({ field }) => (
            <ListingTypeSelector value={field.value} onChange={field.onChange} />
          )}
        />
      </section>

      {/* ── Información general ── */}
      <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">Información general</h3>
        <div className="space-y-3">
          <Field register={register} errors={errors} name="title"
            label="Título del anuncio *"
            placeholder="Ej. Finca en Puente Nacional con piscina" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone-700">Descripción <span className="text-stone-400 font-normal">(opcional)</span></label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe las características más importantes…"
              className="text-sm px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-400 resize-none bg-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone-700">Tipo de propiedad *</label>
            <select {...register('property_type')}
              className="text-sm px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-amber-400 bg-white">
              <option value="apartment">Apartamento</option>
              <option value="house">Casa / Finca</option>
              <option value="office">Oficina</option>
              <option value="land">Terreno / Lote</option>
              <option value="commercial">Local comercial</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Precio de venta (solo si aplica) ── */}
      {isSale && (
        <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
          <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">
            Precio de venta
          </h3>
          <Field register={register} errors={errors} name="price"
            label="Precio de venta (COP) *" type="number"
            prefix="$" placeholder="250000000" />
        </section>
      )}

      {/* ── Condiciones de arriendo (solo si aplica) ── */}
      {isRent && (
        <section className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <Key size={13} className="text-amber-600" />
            <h3 className="text-[10px] font-medium uppercase tracking-wider text-amber-700">Condiciones de arriendo</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field register={register} errors={errors} name="rental_price"
              label="Canon mensual (COP) *" type="number"
              prefix="$" placeholder="1500000" />
            <Field register={register} errors={errors} name="rental_deposit"
              label="Depósito" type="number" optional
              prefix="$" placeholder="3000000" />
            <Field register={register} errors={errors} name="rental_min_months"
              label="Meses mínimos" type="number" optional placeholder="12" />
            <Field register={register} errors={errors} name="admin_fee"
              label="Administración (COP)" type="number" optional
              prefix="$" placeholder="180000" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="rental_includes_admin"
              {...register('rental_includes_admin')}
              className="w-4 h-4 rounded border-stone-300 accent-amber-500"
            />
            <label htmlFor="rental_includes_admin" className="text-xs text-stone-700 cursor-pointer">
              Administración incluida en el canon
            </label>
          </div>
        </section>
      )}

      {/* ── Métricas ── */}
      <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">Métricas</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field register={register} errors={errors} name="area_m2"
            label="Área m² *" type="number" placeholder="85" />
          <Field register={register} errors={errors} name="bedrooms"
            label="Habitaciones" type="number" />
          <Field register={register} errors={errors} name="bathrooms"
            label="Baños" type="number" />
          <Field register={register} errors={errors} name="parking_spots"
            label="Parqueaderos" type="number" />
        </div>
      </section>

      {/* ── Fotos ── */}
      <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">Fotos</h3>
        <Controller
          name="photos"
          control={control}
          render={({ field }) => (
            <ImageUploader value={field.value} onChange={field.onChange} maxImages={10} />
          )}
        />
      </section>

      {/* ── Ubicación ── */}
      <section className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-stone-500 mb-3">Ubicación</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field register={register} errors={errors} name="city" label="Ciudad *" placeholder="Bogotá" />
            <Field register={register} errors={errors} name="neighborhood" label="Barrio" optional placeholder="Chapinero" />
          </div>
          <Field register={register} errors={errors} name="address" label="Dirección *" placeholder="Cra. 7 # 45-23" />
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting}
          className="px-5 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors flex items-center gap-2">
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

const LISTING_LABELS = { sale: 'Venta', rent: 'Arriendo', rent_sale: 'Arriendo y Venta' }
const LISTING_COLORS = {
  sale:      'bg-blue-50 text-blue-700',
  rent:      'bg-amber-50 text-amber-700',
  rent_sale: 'bg-purple-50 text-purple-700',
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, subscription } = useAuthStore()
  const navigate = useNavigate()
  const { myProperties, isLoading, fetchMyProperties, deleteProperty } = usePropertiesStore()
  const [showForm, setShowForm] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => { fetchMyProperties() }, [])

  const trialDays = getTrialDaysRemaining(user)
  const trialActive = trialDays > 0
  const hasActiveSub = subscription?.status === 'active'
  const canPublish = trialActive || hasActiveSub
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

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium">Hola, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {myProperties.length} inmueble{myProperties.length !== 1 ? 's' : ''} publicado{myProperties.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} disabled={!canPublish}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <Plus size={15} /> Nuevo inmueble
        </button>
      </div>

      {/* Banner trial activo */}
      {trialActive && !hasActiveSub && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Clock size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">
                Trial activo — {trialDays} día{trialDays !== 1 ? 's' : ''} restante{trialDays !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Puedes publicar propiedades en venta y arriendo durante el trial.
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/pricing')}
            className="shrink-0 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-stone-900 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            Ver planes →
          </button>
        </div>
      )}

      {/* Banner trial expirado */}
      {trialExpired && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Crown size={18} className="text-rose-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-rose-900">Tu período de prueba ha expirado</p>
              <p className="text-xs text-rose-700 mt-0.5">Elige un plan para volver a publicar.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {['basic', 'pro'].map((plan) => (
              <button key={plan} onClick={() => handleUpgrade(plan)} disabled={checkoutLoading}
                className="px-3 py-1.5 text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors capitalize disabled:opacity-50">
                {plan}
              </button>
            ))}
            <button onClick={() => navigate('/pricing')}
              className="px-3 py-1.5 text-xs border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors">
              Ver todos
            </button>
          </div>
        </div>
      )}

      {/* Badge suscripción activa */}
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

      {/* Formulario */}
      {showForm && (
        <div className="mb-8 bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-serif text-xl font-medium mb-5">Publicar inmueble</h2>
          <PropertyForm
            onSuccess={() => { setShowForm(false); fetchMyProperties() }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-medium text-stone-900 text-sm">Mis inmuebles</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-stone-400 text-sm">Cargando…</div>
        ) : myProperties.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-4xl mb-3">🏠</p>
            <p className="text-stone-500 text-sm font-medium mb-1">Sin propiedades publicadas</p>
            <p className="text-stone-400 text-xs mb-4">
              {canPublish ? 'Publica propiedades en venta o arriendo.' : 'Activa un plan para empezar.'}
            </p>
            {canPublish && (
              <button onClick={() => setShowForm(true)}
                className="text-xs text-amber-600 underline hover:text-amber-800">
                Publicar ahora →
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                {['Inmueble', 'Modalidad', 'Precio', 'Vistas', 'Estado', 'Fecha', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-stone-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {myProperties.map((prop) => (
                <tr key={prop.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-stone-800 max-w-[200px] truncate">{prop.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${LISTING_COLORS[prop.listing_type] || LISTING_COLORS.sale}`}>
                      {LISTING_LABELS[prop.listing_type] || 'Venta'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600 text-xs">
                    {prop.listing_type === 'rent'
                      ? <span>{formatPrice(prop.rental_price, prop.price_currency)}<span className="text-stone-400">/mes</span></span>
                      : prop.listing_type === 'rent_sale'
                        ? <span className="flex flex-col">
                            <span>{formatPrice(prop.price, prop.price_currency)}</span>
                            <span className="text-stone-400">{formatPrice(prop.rental_price, prop.price_currency)}/mes</span>
                          </span>
                        : formatPrice(prop.price, prop.price_currency)
                    }
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    <span className="flex items-center gap-1"><Eye size={12} />{(prop.views_count ?? 0).toLocaleString('es-CO')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${prop.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                      {prop.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">
                    {new Date(prop.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteProperty(prop.id)}
                        className="p-1.5 rounded-md hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors">
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