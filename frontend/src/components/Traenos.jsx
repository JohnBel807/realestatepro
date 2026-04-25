// src/components/TraeNos.jsx
// Integración completa de TraeNos en velezyricaurte.com
// 4 componentes: Banner, BotonPropiedad, Widget flotante, FooterCard

import React, { useState } from 'react'

const TRAENOS_URL  = 'https://traenos.velezyricaurte.com'
const UTM_BASE     = '?utm_source=com&utm_medium='
const AZUL         = '#1e3a5f'
const AZUL_OSCURO  = '#0f2744'
const AZUL_TEXTO   = '#1e6db5'

function link(medium) {
  return `${TRAENOS_URL}${UTM_BASE}${medium}`
}

// ─── 1. Banner Home ───────────────────────────────────────────────────────────
export function TraeNosBanner() {
  return (
    <a
      href={link('banner_home')}
      target="_blank"
      rel="noreferrer"
      className="block w-full no-underline group"
    >
      <div
        className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center
          gap-4 transition-all duration-200 group-hover:brightness-110"
        style={{ background: AZUL }}
      >
        {/* Izquierda */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-3xl shrink-0 mt-0.5">🛵</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-white text-lg leading-none">TraeNos</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#22c55e', color: '#fff' }}>
                Nuevo aliado
              </span>
            </div>
            <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Domicilios colaborativos para zonas rurales.
              Ahorra hasta 80% en envíos compartiendo ruta con vecinos de tu zona.
            </p>
          </div>
        </div>

        {/* Métrica */}
        <div className="flex sm:flex-col items-center gap-2 shrink-0">
          <div className="text-center">
            <p className="text-2xl font-bold text-white leading-none">80%</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Ahorro promedio</p>
          </div>
        </div>

        {/* Botón */}
        <div className="shrink-0">
          <span
            className="inline-block text-sm font-semibold px-4 py-2.5 rounded-xl transition-all
              group-hover:scale-105"
            style={{ background: '#fff', color: AZUL }}>
            Pedir domicilio →
          </span>
        </div>
      </div>
    </a>
  )
}

// ─── 2. Botón en propiedad ────────────────────────────────────────────────────
export function TraeNosBotonPropiedad() {
  return (
    <a
      href={link('listing')}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl
        text-sm font-medium border transition-all hover:brightness-95 no-underline"
      style={{
        background:   '#f0f7ff',
        border:       `1.5px solid ${AZUL}`,
        color:        AZUL,
      }}
    >
      🛵 Solicitar envío con TraeNos
    </a>
  )
}

// ─── 3. Widget flotante ───────────────────────────────────────────────────────
export function TraeNosWidget() {
  const [open,   setOpen]   = useState(false)
  const [hidden, setHidden] = useState(false)

  if (hidden) return null

  return (
    <div
      className="fixed z-40 flex flex-col items-end gap-2"
      style={{ bottom: '6rem', right: '1.5rem' }}
    >
      {/* Card expandida */}
      {open && (
        <div
          className="rounded-2xl shadow-2xl p-4 w-64 animate-fade-up"
          style={{ background: AZUL }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛵</span>
              <span className="font-bold text-white text-base">TraeNos</span>
            </div>
            <button
              onClick={() => setHidden(true)}
              className="text-white/50 hover:text-white text-lg leading-none transition-colors"
              title="Cerrar"
            >
              ×
            </button>
          </div>

          <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Domicilios colaborativos para zonas rurales. Comparte ruta con vecinos y ahorra.
          </p>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { n: '1,200+', l: 'Usuarios' },
              { n: '45',     l: 'Zonas' },
              { n: '2-4h',   l: 'Entrega' },
            ].map(({ n, l }) => (
              <div key={l} className="text-center">
                <p className="text-sm font-bold text-white leading-none">{n}</p>
                <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{l}</p>
              </div>
            ))}
          </div>

          {/* Botón */}
          <a
            href={link('widget_flotante')}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-sm font-semibold py-2 rounded-xl no-underline
              transition-all hover:brightness-110"
            style={{ background: '#fff', color: AZUL }}
          >
            Pedir domicilio →
          </a>
        </div>
      )}

      {/* Botón circular */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg
          transition-all hover:scale-110 active:scale-95 text-xl"
        style={{ background: AZUL }}
        title="TraeNos — Domicilios rurales"
      >
        🛵
      </button>
    </div>
  )
}

// ─── 4. Footer card ───────────────────────────────────────────────────────────
export function TraeNosFooterCard() {
  return (
    <a
      href={link('footer')}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl p-3 no-underline transition-all hover:brightness-110 group"
      style={{ background: AZUL }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🛵</span>
        <span className="font-semibold text-white text-sm">TraeNos</span>
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-auto"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>
          Aliado
        </span>
      </div>
      <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.65)' }}>
        Domicilios colaborativos para zonas rurales
      </p>
    </a>
  )
}