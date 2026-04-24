import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Minus, Crown, Zap, Building2, Star, X } from 'lucide-react'
import { useAuthStore } from '../store/useStore'
import { subscriptionAPI } from '../lib/api'
import WompiCheckout from '../components/WompiCheckout'

const PLANS = [
  {
    key:     'basic',
    name:    'Basic',
    icon:    <Zap size={20} />,
    color:   '#6B4E2A',
    bg:      '#F5EFE6',
    desc:    'Para propietarios que publican ocasionalmente',
    monthly: 19900,
    annual:  199000,
    features: [
      { text: 'Hasta 5 propiedades activas',     ok: true },
      { text: '5 fotos por propiedad',            ok: true },
      { text: 'Listado estándar',                 ok: true },
      { text: 'Soporte por email',                ok: true },
      { text: 'Estadísticas básicas',             ok: true },
      { text: 'Propiedades destacadas',           ok: false },
      { text: 'Fotos ilimitadas',                 ok: false },
      { text: 'Soporte prioritario',              ok: false },
    ],
  },
  {
    key:     'pro',
    name:    'Pro',
    icon:    <Crown size={20} />,
    color:   '#C4631A',
    bg:      '#FFF8F0',
    desc:    'Para agentes y vendedores activos',
    monthly: 59900,
    annual:  599000,
    popular: true,
    features: [
      { text: 'Hasta 25 propiedades activas',     ok: true },
      { text: '15 fotos por propiedad',           ok: true },
      { text: '2 propiedades destacadas al mes',  ok: true },
      { text: 'Soporte prioritario',              ok: true },
      { text: 'Estadísticas avanzadas',           ok: true },
      { text: 'Badge de vendedor verificado',     ok: true },
      { text: 'Propiedades ilimitadas',           ok: false },
      { text: 'Fotos ilimitadas',                 ok: false },
    ],
  },
  {
    key:     'enterprise',
    name:    'Enterprise',
    icon:    <Building2 size={20} />,
    color:   '#2D6B2A',
    bg:      '#F0F7F0',
    desc:    'Para inmobiliarias y grandes portafolios',
    monthly: 99000,
    annual:  990000,
    features: [
      { text: 'Propiedades ilimitadas',           ok: true },
      { text: 'Fotos ilimitadas',                 ok: true },
      { text: 'Destacados ilimitados',            ok: true },
      { text: 'Soporte dedicado 24/7',            ok: true },
      { text: 'Estadísticas avanzadas',           ok: true },
      { text: 'Badge de vendedor verificado',     ok: true },
      { text: 'API access',                       ok: true },
      { text: 'Dashboard multi-usuario',          ok: true },
    ],
  },
]

function fmtCOP(n) {
  return '$' + n.toLocaleString('es-CO')
}

function PricingCard({ plan, annual, onChoose, loading, isCurrent }) {
  const price    = annual ? plan.annual  : plan.monthly
  const perMonth = annual ? Math.round(plan.annual / 12) : plan.monthly
  const savings  = plan.monthly * 2

  return (
    <div className={`relative rounded-2xl border flex flex-col transition-shadow
      ${plan.popular
        ? 'border-amber-400 shadow-xl shadow-amber-100 scale-[1.02]'
        : 'border-stone-200 shadow-sm hover:shadow-md'}`}
      style={{ background: plan.bg }}>

      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 bg-amber-500 text-stone-900 text-xs font-semibold px-3 py-1 rounded-full">
            <Star size={11} className="fill-stone-900" /> Más popular
          </span>
        </div>
      )}

      <div className="p-6 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span style={{ color: plan.color }}>{plan.icon}</span>
          <h3 className="font-serif text-xl font-semibold" style={{ color: plan.color }}>
            {plan.name}
          </h3>
        </div>
        <p className="text-sm text-stone-500 mb-5">{plan.desc}</p>

        <div className="mb-1">
          {annual ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-3xl font-bold text-stone-900">{fmtCOP(price)}</span>
                <span className="text-stone-400 text-sm">/año</span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {fmtCOP(perMonth)}/mes ·{' '}
                <span className="text-emerald-600 font-medium">ahorras {fmtCOP(savings)}</span>
              </p>
            </>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-3xl font-bold text-stone-900">{fmtCOP(price)}</span>
              <span className="text-stone-400 text-sm">/mes</span>
            </div>
          )}
        </div>

        {annual && (
          <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700
            text-xs font-medium px-2.5 py-1 rounded-full mb-4">
            🎁 2 meses gratis incluidos
          </div>
        )}

        <ul className="space-y-2.5 mt-4">
          {plan.features.map(({ text, ok }) => (
            <li key={text} className="flex items-center gap-2.5 text-sm">
              {ok
                ? <Check size={14} className="shrink-0" style={{ color: plan.color }} />
                : <Minus size={14} className="shrink-0 text-stone-300" />}
              <span className={ok ? 'text-stone-700' : 'text-stone-400'}>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 pt-0">
        {isCurrent ? (
          <div className="w-full text-center py-2.5 text-sm font-medium text-stone-400
            border border-stone-200 rounded-xl bg-stone-50">
            Plan actual
          </div>
        ) : (
          <button
            onClick={() => onChoose(annual ? `${plan.key}_annual` : `${plan.key}_monthly`)}
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold rounded-xl transition-all
              hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            style={{ background: plan.color, color: '#fff' }}>
            {loading ? 'Procesando…' : `Elegir ${plan.name} →`}
          </button>
        )}
      </div>
    </div>
  )
}

export default function PricingPage() {
  const { isAuthenticated, subscription, user } = useAuthStore()
  const navigate = useNavigate()

  // ── Todos los hooks PRIMERO, antes de cualquier JSX ──
  const [annual,       setAnnual]       = useState(false)
  const [loading,      setLoading]      = useState(null)
  const [checkoutData, setCheckoutData] = useState(null)

  const authed   = isAuthenticated()
  const inTrial  = user?.trial_ends_at && new Date(user.trial_ends_at) > new Date()
  const hasSub   = subscription?.status === 'active'
  const currPlan = subscription?.plan_type ?? null

  const handleChoose = async (planKey) => {
    if (!authed) { navigate('/register'); return }
    setLoading(planKey)
    try {
      const { data } = await subscriptionAPI.createCheckout(planKey)
      if (data.integrity && data.reference) {
        setCheckoutData(data)
        setLoading(null)
      } else {
        window.location.href = data.checkout_url
      }
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-10">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-600 mb-2">
            Planes y precios
          </p>
          <h1 className="font-serif text-4xl font-semibold text-stone-900 mb-3">
            Publica tus propiedades
          </h1>
          <p className="text-stone-500 text-sm max-w-md mx-auto">
            30 días de prueba gratuita al registrarte. Sin tarjeta de crédito.
          </p>
        </div>

        {/* Toggle mensual / anual */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium ${!annual ? 'text-stone-900' : 'text-stone-400'}`}>
            Mensual
          </span>
          <button
            onClick={() => setAnnual(a => !a)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200
              ${annual ? 'bg-emerald-500' : 'bg-stone-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow
              transition-transform duration-200
              ${annual ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-stone-900' : 'text-stone-400'}`}>
            Anual
          </span>
          {annual && (
            <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              2 meses gratis 🎁
            </span>
          )}
        </div>

        {/* Trial banner */}
        {inTrial && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5
            flex items-center gap-3 mb-8 max-w-lg mx-auto">
            <Crown size={16} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Período de prueba activo</strong> —{' '}
              {Math.max(0, Math.ceil(
                (new Date(user.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)
              ))} días restantes.
            </p>
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map(plan => (
            <PricingCard
              key={plan.key}
              plan={plan}
              annual={annual}
              onChoose={handleChoose}
              loading={loading === (annual ? `${plan.key}_annual` : `${plan.key}_monthly`)}
              isCurrent={hasSub && currPlan === plan.key}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 space-y-3">
          <p className="text-xs text-stone-400">
            🔒 Pagos seguros · Wompi · PSE · Tarjetas · Nequi · Bancolombia
          </p>
          <p className="text-xs text-stone-400">
            Todos los planes incluyen 7 días de garantía de devolución.
          </p>
          {!authed && (
            <div className="mt-6">
              <p className="text-sm text-stone-500 mb-3">¿Todavía no tienes cuenta?</p>
              <Link to="/register"
                className="inline-block bg-stone-900 text-white text-sm font-semibold
                  px-6 py-3 rounded-xl hover:bg-stone-800 transition-colors">
                Comenzar prueba gratuita de 30 días →
              </Link>
            </div>
          )}
          <p className="text-xs text-stone-400 pt-2">
            ¿Preguntas?{' '}
            <a href="mailto:johnroa@velezyricaurte.com"
              className="text-amber-600 hover:underline font-medium">
              johnroa@velezyricaurte.com
            </a>
          </p>
        </div>

      </div>

      {/* Modal de pago Wompi */}
      {checkoutData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={e => { if (e.target === e.currentTarget) setCheckoutData(null) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                Confirmar pago
              </h3>
              <button onClick={() => setCheckoutData(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100">
                <X size={16} />
              </button>
            </div>
            <div className="bg-stone-50 rounded-xl p-4 mb-4 text-sm text-stone-600 space-y-1">
              <p>
                <span className="font-medium text-stone-800">Monto: </span>
                {fmtCOP(Math.round(checkoutData.amount / 100))} COP
              </p>
              <p className="font-mono text-xs text-stone-400 truncate">
                Ref: {checkoutData.reference}
              </p>
            </div>
            <WompiCheckout
              amount={checkoutData.amount}
              reference={checkoutData.reference}
              integrity={checkoutData.integrity}
              redirectUrl={checkoutData.redirect_url}
            />
            <p className="text-xs text-center text-stone-400 mt-3">
              🔒 Pago seguro procesado por Wompi
            </p>
          </div>
        </div>
      )}
    </div>
  )
}