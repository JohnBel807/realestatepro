import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Crown, Zap, Building2, AlertCircle, Clock } from 'lucide-react'
import { useAuthStore } from '../store/useStore'
import { subscriptionAPI } from '../lib/api'

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    icon: Zap,
    price: 19_900,
    description: 'Para propietarios que publican ocasionalmente',
    features: [
      'Hasta 5 propiedades activas',
      '5 fotos por propiedad',
      'Listado estándar',
      'Soporte por email',
      'Estadísticas básicas',
    ],
    excluded: ['Propiedades destacadas', 'Fotos ilimitadas', 'Soporte prioritario'],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Crown,
    price: 59_900,
    description: 'Para agentes y vendedores activos',
    popular: true,
    features: [
      'Hasta 25 propiedades activas',
      '15 fotos por propiedad',
      '2 propiedades destacadas al mes',
      'Soporte prioritario',
      'Estadísticas avanzadas',
      'Badge de vendedor verificado',
    ],
    excluded: ['Propiedades ilimitadas'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    price: 99_000,
    description: 'Para inmobiliarias y grandes portafolios',
    features: [
      'Propiedades ilimitadas',
      'Fotos ilimitadas',
      'Destacados ilimitados',
      'Soporte dedicado 24/7',
      'API access',
      'Dashboard multi-usuario',
    ],
    excluded: [],
  },
]

function TrialBanner({ daysRemaining }) {
  if (daysRemaining <= 0) return null
  return (
    <div className="max-w-2xl mx-auto mb-10 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <Clock size={18} className="text-amber-600" />
      </div>
      <div>
        <p className="font-medium text-amber-900 text-sm">
          Estás en tu período de prueba gratuita
        </p>
        <p className="text-amber-700 text-xs mt-0.5">
          Te quedan <span className="font-semibold">{daysRemaining} días</span> para explorar
          todas las funciones. Elige un plan antes de que expire para no perder el acceso.
        </p>
      </div>
      <div className="ml-auto shrink-0 bg-amber-500 text-stone-900 text-xs font-semibold px-3 py-1.5 rounded-full">
        {daysRemaining}d restantes
      </div>
    </div>
  )
}

function PlanCard({ plan, onSelect, loading, currentPlan }) {
  const Icon = plan.icon
  const isCurrentPlan = currentPlan === plan.id
  const isLoading = loading === plan.id

  return (
    <div className={`bg-white rounded-2xl flex flex-col relative transition-all duration-200
      ${plan.popular
        ? 'border-2 border-amber-400 shadow-lg shadow-amber-100'
        : 'border border-stone-200 hover:border-stone-300'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-amber-500 text-stone-900 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Más popular
          </span>
        </div>
      )}

      <div className="p-6 flex-1">
        <div className="flex items-center gap-2.5 mb-1">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center
            ${plan.popular ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
            <Icon size={16} />
          </div>
          <h3 className="font-serif text-xl font-semibold">{plan.name}</h3>
          {isCurrentPlan && (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
              Plan actual
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 mb-4">{plan.description}</p>

        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-3xl font-semibold">
              ${plan.price.toLocaleString('es-CO')}
            </span>
            <span className="text-sm text-stone-400">COP / mes</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            ≈ ${Math.round(plan.price / 4200).toLocaleString('en-US')} USD · IVA incluido
          </p>
        </div>

        <ul className="space-y-2 mb-4">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-stone-700">
              <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {plan.excluded.length > 0 && (
          <ul className="space-y-2">
            {plan.excluded.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-stone-300 line-through">
                <span className="w-3.5 mt-0.5 shrink-0">—</span>
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-6 pb-6">
        <button
          onClick={() => onSelect(plan.id)}
          disabled={isCurrentPlan || !!loading}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
            ${isCurrentPlan
              ? 'bg-stone-100 text-stone-400 cursor-default'
              : plan.popular
                ? 'bg-amber-500 hover:bg-amber-600 text-stone-900'
                : 'bg-stone-900 hover:bg-stone-800 text-white'
            } disabled:opacity-50`}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Redirigiendo…
            </>
          ) : isCurrentPlan ? 'Plan actual' : `Elegir ${plan.name} →`}
        </button>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const { isAuthenticated, subscription, user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)

  const currentPlan = subscription?.status === 'active' ? subscription.plan_type : null

  // Calcular días restantes de trial
  const trialDaysRemaining = React.useMemo(() => {
    if (!user?.trial_ends_at) return 0
    const delta = new Date(user.trial_ends_at) - new Date()
    return Math.max(0, Math.ceil(delta / (1000 * 60 * 60 * 24)))
  }, [user])

  const handleSelect = async (planId) => {
    if (!isAuthenticated()) {
      navigate('/register', { state: { from: { pathname: '/pricing' } } })
      return
    }
    setError(null)
    setLoading(planId)
    try {
      const { data } = await subscriptionAPI.createCheckout(planId)
      window.location.href = data.checkout_url
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al procesar el pago. Intenta de nuevo.')
      setLoading(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-up">
      <div className="text-center mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-amber-600 mb-3">Planes y precios</p>
        <h1 className="font-serif text-4xl font-semibold text-stone-900 mb-3">
          Publica tus propiedades
        </h1>
        <p className="text-stone-500 max-w-md mx-auto text-sm leading-relaxed">
          30 días de prueba gratuita al registrarte. Sin tarjeta de crédito. Cancela cuando quieras.
        </p>
      </div>

      {/* Banner trial */}
      {isAuthenticated() && <TrialBanner daysRemaining={trialDaysRemaining} />}

      {error && (
        <div className="max-w-lg mx-auto mb-8 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={15} className="shrink-0" />{error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSelect={handleSelect}
            loading={loading}
            currentPlan={currentPlan}
          />
        ))}
      </div>

      {/* Trial CTA para no autenticados */}
      {!isAuthenticated() && (
        <div className="mt-10 text-center bg-stone-50 border border-stone-200 rounded-2xl p-8">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock size={22} className="text-amber-600" />
          </div>
          <h3 className="font-serif text-xl font-medium mb-2">Empieza gratis hoy</h3>
          <p className="text-stone-500 text-sm mb-4 max-w-sm mx-auto">
            Regístrate y obtén 30 días de acceso completo sin necesidad de tarjeta de crédito.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-stone-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Comenzar prueba gratuita →
          </button>
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-xs text-stone-400 mb-1">🔒 Pagos seguros procesados por Stripe</p>
        <p className="text-xs text-stone-400">
          Todos los planes incluyen 7 días de garantía de devolución.{' '}
          <a href="mailto:johnroa@velezyricaurte.com" className="text-amber-600 hover:underline font-medium">
            johnroa@velezyricaurte.com
          </a>
        </p>
      </div>

      <div className="mt-14 max-w-2xl mx-auto">
        <h2 className="font-serif text-2xl font-medium text-center mb-6">Preguntas frecuentes</h2>
        {[
          { q: '¿Necesito tarjeta de crédito para el trial?', a: 'No. Los 30 días de prueba son completamente gratuitos y no requieren ningún método de pago.' },
          { q: '¿Qué pasa cuando termina el trial?', a: 'Tus propiedades se pausan automáticamente. Al activar un plan se reactivan sin perder ningún dato.' },
          { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Puedes actualizar o degradar desde el dashboard. Los cambios aplican en el próximo ciclo.' },
          { q: '¿Qué métodos de pago aceptan?', a: 'Tarjetas de crédito y débito vía Stripe. Próximamente PSE para Colombia.' },
        ].map(({ q, a }) => (
          <details key={q} className="border-b border-stone-200 py-4 group">
            <summary className="text-sm font-medium text-stone-800 cursor-pointer flex justify-between items-center list-none">
              {q}
              <span className="text-stone-400 group-open:rotate-180 transition-transform text-lg leading-none">↓</span>
            </summary>
            <p className="text-sm text-stone-500 mt-2 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}