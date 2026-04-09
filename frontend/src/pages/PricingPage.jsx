import React from 'react'
// src/pages/PricingPage.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Crown, Zap, Building2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/useStore'
import { subscriptionAPI } from '../lib/api'

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    icon: Zap,
    price: 49_900,
    description: 'Para propietarios que publican ocasionalmente',
    color: 'stone',
    features: [
      'Hasta 5 propiedades activas',
      '5 fotos por propiedad',
      'Listado estándar',
      'Soporte por email',
      'Panel de estadísticas básico',
    ],
    excluded: [
      'Propiedades destacadas',
      'Fotos ilimitadas',
      'Soporte prioritario',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Crown,
    price: 129_900,
    description: 'Para agentes y vendedores activos',
    color: 'amber',
    popular: true,
    features: [
      'Hasta 25 propiedades activas',
      '15 fotos por propiedad',
      '2 propiedades destacadas al mes',
      'Soporte prioritario',
      'Estadísticas avanzadas',
      'Tour virtual (link externo)',
      'Badge de vendedor verificado',
    ],
    excluded: [
      'Propiedades ilimitadas',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    price: 349_900,
    description: 'Para inmobiliarias y grandes portafolios',
    color: 'stone',
    features: [
      'Propiedades ilimitadas',
      'Fotos ilimitadas por propiedad',
      'Propiedades destacadas ilimitadas',
      'Soporte dedicado 24/7',
      'API access',
      'Dashboard de equipo',
      'Integraciones personalizadas',
      'Gestión multi-usuario',
    ],
    excluded: [],
  },
]

function PlanCard({ plan, onSelect, loading, currentPlan }) {
  const Icon = plan.icon
  const isCurrentPlan = currentPlan === plan.id
  const isLoading = loading === plan.id

  return (
    <div
      className={`card flex flex-col transition-all duration-200 relative
        ${plan.popular ? 'border-2 border-amber-400 shadow-md' : 'hover:border-stone-300'}
      `}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-amber-500 text-stone-900 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Más popular
          </span>
        </div>
      )}

      <div className="p-6 flex-1">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center
            ${plan.popular ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}
          >
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

        {/* Price */}
        <div className="mb-6">
          <span className="font-serif text-3xl font-semibold">
            ${plan.price.toLocaleString('es-CO')}
          </span>
          <span className="text-sm text-stone-400 ml-1">COP / mes</span>
        </div>

        {/* Features incluidas */}
        <ul className="space-y-2 mb-4">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-stone-700">
              <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Features excluidas */}
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

      {/* CTA */}
      <div className="px-6 pb-6">
        <button
          onClick={() => onSelect(plan.id)}
          disabled={isCurrentPlan || !!loading}
          className={`w-full justify-center py-2.5 rounded-xl text-sm font-medium transition-all
            ${isCurrentPlan
              ? 'bg-stone-100 text-stone-400 cursor-default'
              : plan.popular
                ? 'btn-gold'
                : 'btn-primary'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Redirigiendo…
            </span>
          ) : isCurrentPlan ? (
            'Plan activo'
          ) : (
            `Elegir ${plan.name} →`
          )}
        </button>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const { isAuthenticated, subscription } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)

  const currentPlan = subscription?.status === 'active' ? subscription.plan_type : null

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

      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-medium uppercase tracking-widest text-amber-600 mb-3">Planes y precios</p>
        <h1 className="font-serif text-4xl font-semibold text-stone-900 mb-3">
          Publica tus propiedades
        </h1>
        <p className="text-stone-500 max-w-md mx-auto text-sm leading-relaxed">
          Elige el plan que se adapte a tu volumen de publicaciones.
          Cancela cuando quieras, sin compromisos.
        </p>
      </div>

      {/* Error global */}
      {error && (
        <div className="max-w-lg mx-auto mb-8 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Cards */}
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

      {/* Garantía */}
      <div className="mt-12 text-center">
        <p className="text-xs text-stone-400 mb-1">🔒 Pagos seguros procesados por Stripe</p>
        <p className="text-xs text-stone-400">
          Todos los planes incluyen 7 días de garantía de devolución.
          ¿Tienes preguntas?{' '}
          <a href="mailto:soporte@realestatepro.co" className="text-amber-600 hover:underline">
            Contáctanos
          </a>
        </p>
      </div>

      {/* FAQ rápido */}
      <div className="mt-14 max-w-2xl mx-auto">
        <h2 className="font-serif text-2xl font-medium text-center mb-6">Preguntas frecuentes</h2>
        {[
          {
            q: '¿Puedo cambiar de plan en cualquier momento?',
            a: 'Sí. Puedes actualizar o degradar tu plan desde el dashboard. Los cambios aplican en el próximo ciclo de facturación.',
          },
          {
            q: '¿Qué métodos de pago aceptan?',
            a: 'Aceptamos todas las tarjetas de crédito y débito a través de Stripe. Próximamente PSE para Colombia.',
          },
          {
            q: '¿Las propiedades se eliminan si cancelo?',
            a: 'No. Tus propiedades se desactivan pero no se eliminan. Al renovar tu suscripción, vuelven a estar activas automáticamente.',
          },
        ].map(({ q, a }) => (
          <details key={q} className="border-b border-stone-200 py-4 group">
            <summary className="text-sm font-medium text-stone-800 cursor-pointer flex justify-between items-center list-none">
              {q}
              <span className="text-stone-400 group-open:rotate-180 transition-transform text-lg leading-none">
                ↓
              </span>
            </summary>
            <p className="text-sm text-stone-500 mt-2 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}