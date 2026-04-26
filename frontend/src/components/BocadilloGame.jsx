/**
 * BocadilloGame.jsx — Maestro Bocadillero: El Legado de Vélez
 * Componente standalone React con Tailwind encapsulado via prefijo "bg-"
 *
 * Props:
 *   portalOrigin  "com" | "info"  — identifica el portal de origen
 *   serverUrl     string          — URL base del backend (opcional, para futuros scores)
 *   onClose       () => void      — callback al salir del juego (opcional)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'

// ─── Paleta regional VelezyRicaurte ──────────────────────────────────────────
const COLORS = {
  tierra:   '#6B4E2A',
  naranja:  '#C4631A',
  verde:    '#2D6B2A',
  crema:    '#F5EFE6',
  oscuro:   '#1C1208',
  azul:     '#1e3a5f',   // info portal
}

const PORTAL_CONFIG = {
  com:  { accent: COLORS.tierra,  name: 'VelezyRicaurte Inmobiliaria', badge: '#6B4E2A' },
  info: { accent: COLORS.naranja, name: 'VelezyRicaurte Marketplace',  badge: '#C4631A' },
}

// ─── Recetas ─────────────────────────────────────────────────────────────────
const RECETAS = {
  panela: {
    id:           'panela',
    nombre:       'Bocadillo Tradicional',
    desc:         'Con panela de caña — el original de Vélez',
    emoji:        '🍬',
    ingredientes: { guayaba: 5, panela: 2, azucar: 0 },
    unidades:     12,
    precio_base:  4200,
    color:        COLORS.tierra,
  },
  azucar: {
    id:           'azucar',
    nombre:       'Bocadillo Moderno',
    desc:         'Con azúcar refinada — sabor más suave',
    emoji:        '🍭',
    ingredientes: { guayaba: 5, panela: 0, azucar: 3 },
    unidades:     10,
    precio_base:  3800,
    color:        COLORS.naranja,
  },
  mixto: {
    id:           'mixto',
    nombre:       'Bocadillo Premium',
    desc:         'Panela + azúcar — el favorito del festival',
    emoji:        '✨',
    ingredientes: { guayaba: 5, panela: 1, azucar: 2 },
    unidades:     14,
    precio_base:  4800,
    color:        COLORS.verde,
  },
}

// ─── Pool de pedidos ──────────────────────────────────────────────────────────
const ORDERS_POOL = [
  { client: 'Tienda El Cacique',        qty: 3,  price: 4500, days: 2, tipo: 'panela' },
  { client: 'Mercado de Vélez',         qty: 8,  price: 4000, days: 3, tipo: 'any'    },
  { client: 'Festival del Bocadillo',   qty: 15, price: 3800, days: 4, tipo: 'any'    },
  { client: 'Pedido Bogotá',            qty: 20, price: 3500, days: 5, tipo: 'any'    },
  { client: 'Abuela Rosa',              qty: 2,  price: 5200, days: 1, tipo: 'panela' },
  { client: 'Hotel Puente Nacional',    qty: 10, price: 4200, days: 3, tipo: 'any'    },
  { client: 'Cooperativa Moniquirá',    qty: 12, price: 3900, days: 4, tipo: 'any'    },
  { client: 'Dulcería La Guayacana',    qty: 6,  price: 4600, days: 2, tipo: 'azucar' },
  { client: 'Supermercado Barbosa',     qty: 18, price: 3700, days: 5, tipo: 'any'    },
  { client: 'Turistas Santander',       qty: 5,  price: 5500, days: 2, tipo: 'mixto'  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n => '$' + Math.round(n).toLocaleString('es-CO')

function genOrders(rep) {
  const n = Math.min(2 + Math.floor(rep / 2), 4)
  return [...ORDERS_POOL]
    .sort(() => Math.random() - 0.5)
    .slice(0, n)
    .map(o => ({ ...o, daysLeft: o.days, id: Math.random().toString(36).slice(2) }))
}

function initState() {
  return {
    money:   15000,
    guayaba: 0,
    panela:  0,
    azucar:  0,
    stock:   { panela: 0, azucar: 0, mixto: 0 },
    day:     1,
    rep:     1,
    orders:  [],
    fulfilled: 0,
    log:     ['Día 1 — La fábrica de tu abuelo está lista. ¡Empieza el legado!'],
    phase:   'intro',   // intro | game | win | lose
    recetaActiva: 'panela',
  }
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #e5e7eb',
      borderRadius: 10,
      padding: '10px 12px',
      textAlign: 'center',
      flex: 1,
      minWidth: 0,
    }}>
      <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 500, color: color || '#1a1a1a' }}>{value}</p>
    </div>
  )
}

function MeterBar({ value, max, color }) {
  return (
    <div style={{ background: '#f3f4f6', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        borderRadius: 4,
        background: color,
        width: `${Math.min(100, (value / max) * 100)}%`,
        transition: 'width .3s',
      }} />
    </div>
  )
}

function LogPanel({ logs }) {
  const ref = useRef()
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0 }, [logs])
  return (
    <div style={{
      background: '#f9fafb',
      border: '0.5px solid #e5e7eb',
      borderRadius: 10,
      padding: '10px 12px',
      maxHeight: 90,
      overflowY: 'auto',
    }} ref={ref}>
      {logs.map((l, i) => (
        <p key={i} style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.8 }}>{l}</p>
      ))}
    </div>
  )
}

function OrderCard({ order, onFulfill, stockTotal }) {
  const urgent = order.daysLeft <= 1
  const canFulfill = stockTotal >= order.qty
  return (
    <div style={{
      background: '#f9fafb',
      borderRadius: 8,
      padding: '8px 10px',
      border: urgent ? '0.5px solid #fca5a5' : '0.5px solid #e5e7eb',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>{order.client}</p>
          <p style={{ fontSize: 11, color: '#6b7280' }}>
            {order.qty} unid · {fmt(order.price)}/u
            {order.tipo !== 'any' && (
              <span style={{ marginLeft: 4, color: '#9ca3af' }}>
                · pide {order.tipo === 'panela' ? 'tradicional' : order.tipo === 'azucar' ? 'moderno' : 'premium'}
              </span>
            )}
          </p>
        </div>
        <span style={{
          fontSize: 10,
          padding: '2px 7px',
          borderRadius: 20,
          background: urgent ? '#fee2e2' : '#fef3c7',
          color: urgent ? '#dc2626' : '#92400e',
          whiteSpace: 'nowrap',
        }}>{order.daysLeft}d</span>
      </div>
      <button
        disabled={!canFulfill}
        onClick={() => onFulfill(order.id)}
        style={{
          width: '100%',
          padding: '4px 0',
          fontSize: 11,
          borderRadius: 6,
          border: `0.5px solid ${canFulfill ? COLORS.verde : '#d1d5db'}`,
          background: canFulfill ? COLORS.verde : 'transparent',
          color: canFulfill ? '#fff' : '#9ca3af',
          cursor: canFulfill ? 'pointer' : 'not-allowed',
          transition: 'all .15s',
        }}
      >
        {canFulfill ? `Entregar ${order.qty} unid →` : `Necesitas ${order.qty - stockTotal} más`}
      </button>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function BocadilloGame({
  portalOrigin = 'com',
  serverUrl    = 'https://api.velezyricaurte.com',
  onClose,
}) {
  const [G, setG] = useState(initState)
  const cfg = PORTAL_CONFIG[portalOrigin] || PORTAL_CONFIG.com

  const update = useCallback(fn => setG(prev => {
    const next = { ...prev }
    fn(next)
    return next
  }), [])

  const addLog = (g, msg) => { g.log = [msg, ...g.log].slice(0, 30) }

  const stockTotal = g => Object.values(g.stock).reduce((a, b) => a + b, 0)

  // Iniciar juego
  const startGame = () => setG({ ...initState(), phase: 'game', orders: genOrders(1) })

  // Comprar ingrediente
  const buyIngredient = (tipo) => {
    const precios = { guayaba: 800, panela: 1200, azucar: 600 }
    const nombres = { guayaba: 'guayaba', panela: 'panela', azucar: 'azúcar' }
    update(g => {
      if (g.money < precios[tipo]) { addLog(g, 'Sin fondos suficientes'); return }
      g.money -= precios[tipo]
      g[tipo] += 1
      addLog(g, `Comprado 1 ${nombres[tipo]} — ${fmt(precios[tipo])}`)
    })
  }

  // Producir según receta activa
  const producir = () => {
    update(g => {
      const receta = RECETAS[g.recetaActiva]
      const ing = receta.ingredientes
      if (g.guayaba < ing.guayaba) { addLog(g, `Necesitas ${ing.guayaba} kg de guayaba`); return }
      if (ing.panela > 0 && g.panela < ing.panela) { addLog(g, `Necesitas ${ing.panela} bloques de panela`); return }
      if (ing.azucar > 0 && g.azucar < ing.azucar) { addLog(g, `Necesitas ${ing.azucar} kg de azúcar`); return }
      g.guayaba -= ing.guayaba
      if (ing.panela) g.panela -= ing.panela
      if (ing.azucar) g.azucar -= ing.azucar
      g.stock[receta.id] = (g.stock[receta.id] || 0) + receta.unidades
      addLog(g, `+${receta.unidades} ${receta.nombre} producidos`)
    })
  }

  // Entregar pedido
  const fulfillOrder = (id) => {
    update(g => {
      const idx = g.orders.findIndex(o => o.id === id)
      if (idx < 0) return
      const order = g.orders[idx]
      const total = stockTotal(g)
      if (total < order.qty) { addLog(g, 'Stock insuficiente'); return }
      // Descontar del stock priorizando el tipo pedido
      let needed = order.qty
      const tipos = order.tipo === 'any'
        ? Object.keys(g.stock)
        : [order.tipo, ...Object.keys(g.stock).filter(k => k !== order.tipo)]
      for (const t of tipos) {
        if (needed <= 0) break
        const take = Math.min(g.stock[t] || 0, needed)
        g.stock[t] -= take
        needed -= take
      }
      const earned = order.qty * order.price
      g.money += earned
      g.fulfilled++
      g.rep = Math.min(5, g.rep + 0.4)
      g.orders.splice(idx, 1)
      addLog(g, `${order.client}: entregado +${fmt(earned)}`)
      if (g.rep >= 5 && g.fulfilled >= 5) g.phase = 'win'
    })
  }

  // Siguiente día
  const nextDay = () => {
    update(g => {
      g.day++
      const expired = g.orders.filter(o => { o.daysLeft--; return o.daysLeft <= 0 })
      expired.forEach(o => {
        addLog(g, `Pedido de ${o.client} expirado`)
        g.rep = Math.max(0.5, g.rep - 0.3)
      })
      g.orders = g.orders.filter(o => o.daysLeft > 0)
      if (g.orders.length < 2) g.orders = [...g.orders, ...genOrders(g.rep)].slice(0, 4)
      addLog(g, `— Día ${g.day} —`)
      if (g.day > 20 && g.fulfilled < 3) g.phase = 'lose'
    })
  }

  const total = stockTotal(G)
  const receta = RECETAS[G.recetaActiva]

  // ── PANTALLA INTRO ────────────────────────────────────────────────────────
  if (G.phase === 'intro') return (
    <div style={styles.wrap}>
      <div style={{ ...styles.header, background: cfg.accent }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          {cfg.name}
        </span>
      </div>
      <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: '.5rem' }}>🍬</div>
        <h1 style={styles.title}>Maestro Bocadillero</h1>
        <p style={{ fontSize: 13, color: '#6B4E2A', fontStyle: 'italic', marginBottom: '.5rem' }}>El Legado de Vélez</p>
        <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 320, margin: '0 auto 1.5rem' }}>
          Hereda la fábrica familiar de bocadillo de Vélez y conviértela
          en la más famosa de Santander. Elige tu receta, gestiona tus ingredientes
          y cumple los pedidos de la región.
        </p>
        <button onClick={startGame} style={{ ...styles.btnPrimary, background: cfg.accent, fontSize: 15, padding: '12px 32px' }}>
          Comenzar legado →
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, maxWidth: 340, margin: '1.5rem auto 0' }}>
          {[['🫙','Produce'], ['📦','Entrega'], ['⭐','Gana fama']].map(([e,l]) => (
            <div key={l} style={styles.introCard}>
              <span style={{ fontSize: 22 }}>{e}</span>
              <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── PANTALLA WIN / LOSE ───────────────────────────────────────────────────
  if (G.phase === 'win' || G.phase === 'lose') return (
    <div style={styles.wrap}>
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: '.75rem' }}>{G.phase === 'win' ? '🏆' : '😔'}</div>
        <h2 style={{ fontSize: 20, fontWeight: 500, color: '#1a1a1a', marginBottom: '.5rem' }}>
          {G.phase === 'win' ? '¡Maestro Bocadillero!' : 'La fábrica cerró...'}
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 300, margin: '0 auto 1.5rem' }}>
          {G.phase === 'win'
            ? `¡Lo lograste en ${G.day} días! Ganaste ${fmt(G.money)} y cumpliste ${G.fulfilled} pedidos. El bocadillo de Vélez ya es famoso en Colombia.`
            : `Después de ${G.day} días no alcanzaste la reputación necesaria. ¡Inténtalo de nuevo!`}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={startGame} style={{ ...styles.btnPrimary, background: cfg.accent }}>Jugar de nuevo</button>
          {onClose && <button onClick={onClose} style={styles.btn}>Salir</button>}
        </div>
      </div>
    </div>
  )

  // ── PANTALLA JUEGO ────────────────────────────────────────────────────────
  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={{ ...styles.header, background: cfg.accent }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🍬</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>Maestro Bocadillero</span>
          <span style={{ fontSize: 11, background: 'rgba(255,255,255,.2)', color: '#fff', padding: '2px 8px', borderRadius: 20 }}>
            Día {G.day}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>Reputación</span>
          <div style={{ width: 60, background: 'rgba(255,255,255,.3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#fff', width: `${G.rep / 5 * 100}%`, transition: 'width .3s', borderRadius: 4 }} />
          </div>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>{G.rep.toFixed(1)}/5</span>
        </div>
      </div>

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8 }}>
          <StatCard label="Pesos COP"   value={fmt(G.money)}   color={COLORS.verde} />
          <StatCard label="Stock total" value={total}          color={COLORS.tierra} />
          <StatCard label="Pedidos"     value={G.orders.length} />
          <StatCard label="Entregados"  value={G.fulfilled}    color={COLORS.naranja} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* Panel producción */}
          <div style={styles.panel}>
            <p style={styles.panelTitle}>Producción</p>

            {/* Ingredientes */}
            <div style={{ marginBottom: 10 }}>
              {[
                { key: 'guayaba', label: 'Guayaba', unit: 'kg',     max: 20, color: COLORS.naranja },
                { key: 'panela',  label: 'Panela',  unit: 'bloques', max: 10, color: COLORS.tierra },
                { key: 'azucar',  label: 'Azúcar',  unit: 'kg',     max: 15, color: '#f59e0b' },
              ].map(({ key, label, unit, max, color }) => (
                <div key={key} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{G[key]} {unit}</span>
                  </div>
                  <MeterBar value={G[key]} max={max} color={color} />
                </div>
              ))}
            </div>

            {/* Botones compra */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
              {[
                { key: 'guayaba', label: 'Guayaba', precio: 800 },
                { key: 'panela',  label: 'Panela',  precio: 1200 },
                { key: 'azucar',  label: 'Azúcar',  precio: 600 },
              ].map(({ key, label, precio }) => (
                <button key={key} onClick={() => buyIngredient(key)} style={{ ...styles.btn, fontSize: 10, padding: '5px 4px', textAlign: 'center' }}>
                  {label}<br /><span style={{ color: '#9ca3af' }}>${precio.toLocaleString()}</span>
                </button>
              ))}
            </div>

            {/* Selector receta */}
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Receta:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              {Object.values(RECETAS).map(r => (
                <button
                  key={r.id}
                  onClick={() => update(g => { g.recetaActiva = r.id })}
                  style={{
                    ...styles.btn,
                    fontSize: 11,
                    padding: '5px 8px',
                    textAlign: 'left',
                    background: G.recetaActiva === r.id ? r.color : 'transparent',
                    color: G.recetaActiva === r.id ? '#fff' : '#374151',
                    border: `0.5px solid ${G.recetaActiva === r.id ? r.color : '#e5e7eb'}`,
                  }}
                >
                  {r.emoji} {r.nombre}
                  <span style={{ opacity: .7, marginLeft: 4 }}>({r.ingredientes.guayaba}g
                    {r.ingredientes.panela ? ` +${r.ingredientes.panela}p` : ''}
                    {r.ingredientes.azucar ? ` +${r.ingredientes.azucar}az` : ''})
                    → {r.unidades}u
                  </span>
                </button>
              ))}
            </div>

            <button onClick={producir} style={{ ...styles.btnPrimary, background: receta.color, width: '100%', fontSize: 12 }}>
              {receta.emoji} Producir {receta.nombre}
            </button>

            {/* Stock por tipo */}
            <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
              {Object.values(RECETAS).map(r => (
                <div key={r.id} style={{ flex: 1, textAlign: 'center', background: '#f9fafb', borderRadius: 6, padding: '4px 2px' }}>
                  <p style={{ fontSize: 10, color: '#9ca3af' }}>{r.emoji}</p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: r.color }}>{G.stock[r.id] || 0}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Panel pedidos */}
          <div style={styles.panel}>
            <p style={styles.panelTitle}>Pedidos activos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8, minHeight: 160 }}>
              {G.orders.length === 0
                ? <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: '1rem' }}>Esperando pedidos...</p>
                : G.orders.map(o => (
                    <OrderCard key={o.id} order={o} onFulfill={fulfillOrder} stockTotal={total} />
                  ))
              }
            </div>
            <button onClick={nextDay} style={{ ...styles.btn, width: '100%', fontSize: 12 }}>
              Siguiente día →
            </button>
          </div>
        </div>

        {/* Log */}
        <LogPanel logs={G.log} />
      </div>
    </div>
  )
}

// ─── Estilos inline encapsulados (no chocan con Tailwind del portal) ──────────
const styles = {
  wrap: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: '#fff',
    borderRadius: 16,
    border: '0.5px solid #e5e7eb',
    overflow: 'hidden',
    maxWidth: 680,
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
  },
  title: {
    fontSize: 24,
    fontWeight: 500,
    color: '#1a1a1a',
    marginBottom: '.25rem',
  },
  panel: {
    background: '#f9fafb',
    border: '0.5px solid #e5e7eb',
    borderRadius: 12,
    padding: '12px',
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 10,
  },
  btn: {
    background: '#fff',
    border: '0.5px solid #d1d5db',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
    color: '#374151',
    transition: 'all .15s',
  },
  btnPrimary: {
    background: COLORS.tierra,
    border: 'none',
    borderRadius: 8,
    padding: '8px 20px',
    fontSize: 13,
    cursor: 'pointer',
    color: '#fff',
    transition: 'all .15s',
  },
  introCard: {
    background: '#f9fafb',
    border: '0.5px solid #e5e7eb',
    borderRadius: 10,
    padding: '12px 8px',
    textAlign: 'center',
  },
}