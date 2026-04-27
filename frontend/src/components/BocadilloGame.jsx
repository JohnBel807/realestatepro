/**
 * BocadilloGame.jsx v2 — Maestro Bocadillero: El Legado de Vélez
 * Gameplay loop: Tritura → Temperatura → Empaca → Mercado
 *
 * Props:
 *   portalOrigin  "com" | "info"
 *   serverUrl     string
 *   onClose       () => void
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'

const TIERRA  = '#6B4E2A'
const NARANJA = '#C4631A'
const VERDE   = '#2D6B2A'

const PORTAL_CFG = {
  com:  { accent: TIERRA,  name: 'VelezyRicaurte Inmobiliaria' },
  info: { accent: NARANJA, name: 'VelezyRicaurte Marketplace'  },
}

const ORDERS_POOL = [
  { client: 'Tienda El Cacique',       qty: 6,  price: 4500, days: 3 },
  { client: 'Mercado de Vélez',        qty: 10, price: 4000, days: 4 },
  { client: 'Festival Bocadillo',      qty: 18, price: 3900, days: 5 },
  { client: 'Abuela Rosa',             qty: 3,  price: 5200, days: 2 },
  { client: 'Hotel Puente Nacional',   qty: 12, price: 4300, days: 4 },
  { client: 'Turistas Santander',      qty: 5,  price: 5500, days: 2 },
  { client: 'Cooperativa Moniquirá',   qty: 15, price: 3800, days: 5 },
]

const fmt = n => '$' + Math.round(n).toLocaleString('es-CO')

function genOrders(rep) {
  const n = Math.min(2 + Math.floor(rep / 2), 4)
  return [...ORDERS_POOL].sort(() => Math.random() - .5).slice(0, n)
    .map(o => ({ ...o, daysLeft: o.days, id: Math.random().toString(36).slice(2) }))
}

function initG() {
  return {
    phase: 'intro',
    money: 15000, stock: 0, day: 1, rep: 1, fulfilled: 0,
    log: [],
    tri: { progress: 0, clicks: 0, needed: 30 },
    paila: { temp: 45, progress: 0, time: 20, active: false },
    pack: { slots: [], items: 0, needed: 8, score: 0, active: false },
    orders: [],
  }
}

// ─── Sub-componentes puros ────────────────────────────────────────────────────

function Header({ day, rep, accent }) {
  return (
    <div style={{ background: '#1C1208', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🍬</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#F5EFE6' }}>Maestro Bocadillero</span>
        <span style={{ fontSize: 11, background: 'rgba(255,255,255,.15)', color: '#fff', padding: '2px 9px', borderRadius: 20 }}>
          Día {day}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: 'rgba(245,239,230,.6)' }}>Rep</span>
        <div style={{ width: 64, background: 'rgba(255,255,255,.2)', borderRadius: 3, height: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#fff', width: `${rep / 5 * 100}%`, borderRadius: 3, transition: 'width .3s' }} />
        </div>
        <span style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>{rep.toFixed(1)}/5</span>
      </div>
    </div>
  )
}

function StatRow({ money, stock, orders, fulfilled }) {
  const stats = [
    { l: 'Pesos', v: fmt(money), c: VERDE },
    { l: 'Stock', v: stock, c: TIERRA },
    { l: 'Pedidos', v: orders },
    { l: 'Entregados', v: fulfilled, c: NARANJA },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '10px 16px' }}>
      {stats.map(({ l, v, c }) => (
        <div key={l} style={{ background: '#f9fafb', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{l}</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: c || '#1a1a1a' }}>{v}</p>
        </div>
      ))}
    </div>
  )
}

function StepBar({ phase }) {
  const steps = ['tri', 'paila', 'pack', 'mercado']
  const idx = steps.indexOf(phase)
  const labels = ['Tritura', 'Temperatura', 'Empaca', 'Mercado']
  return (
    <div style={{ padding: '0 16px 10px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= idx ? TIERRA : '#e5e7eb', transition: 'background .3s' }} />
        ))}
      </div>
      <p style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
        {labels[idx] || ''}
      </p>
    </div>
  )
}

function ProgressBar({ value, max = 100, color = TIERRA, height = 10 }) {
  return (
    <div style={{ background: '#e5e7eb', borderRadius: 4, height, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, Math.round(value / max * 100))}%`, background: color, borderRadius: 4, transition: 'width .15s' }} />
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: '#f9fafb', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: 16, ...style }}>
      {children}
    </div>
  )
}

function Btn({ children, onClick, primary, color, disabled, style = {} }) {
  const bg = primary ? (color || TIERRA) : '#fff'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: `0.5px solid ${primary ? (color || TIERRA) : '#d1d5db'}`,
        borderRadius: 8, padding: '8px 16px', fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#f3f4f6' : bg,
        color: disabled ? '#9ca3af' : primary ? '#fff' : '#374151',
        transition: 'all .1s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ─── Fases ────────────────────────────────────────────────────────────────────

function PhaseTritura({ tri, onClic }) {
  const pct = Math.round(tri.progress)
  return (
    <Card>
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>
        1 — Tritura la guayaba
      </p>
      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
        Golpea la fruta hasta reducirla a pulpa — {pct}% listo
      </p>
      <ProgressBar value={tri.clicks} max={tri.needed} color={TIERRA} />
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button
          onClick={onClic}
          style={{
            width: 140, height: 140, borderRadius: '50%',
            background: TIERRA, border: 'none',
            fontSize: 40, cursor: 'pointer', color: '#fff',
            transition: 'transform .08s',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(.93)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          🍈
        </button>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10 }}>
          {Math.max(0, tri.needed - tri.clicks)} golpes restantes
        </p>
      </div>
    </Card>
  )
}

function PhasePaila({ paila, onAdjust }) {
  const pct = Math.round(((paila.temp - 30) / 70) * 100)
  const inZone = paila.temp >= 65 && paila.temp <= 80
  const tooHot = paila.temp > 80
  const col = inZone ? VERDE : tooHot ? '#E24B4A' : NARANJA
  const zoneMsg = inZone ? '¡Zona perfecta!' : tooHot ? 'Demasiado caliente — baja el fuego' : 'Muy frío — sube el fuego'

  return (
    <Card>
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>
        2 — Controla la temperatura
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Zona ideal: 65–80°C</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{Math.round(paila.time)}s</span>
      </div>

      <div style={{ position: 'relative', marginBottom: 8 }}>
        <ProgressBar value={paila.temp - 30} max={70} color={col} height={14} />
        <div style={{
          position: 'absolute', top: 0,
          left: `${Math.round((65 - 30) / 70 * 100)}%`,
          width: `${Math.round((80 - 65) / 70 * 100)}%`,
          height: '100%', border: `2px solid ${VERDE}`, borderRadius: 4,
          pointerEvents: 'none',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>30°C</span>
        <span style={{ fontSize: 20, fontWeight: 500, color: col }}>{Math.round(paila.temp)}°C</span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>100°C</span>
      </div>

      <p style={{ fontSize: 12, fontWeight: 500, textAlign: 'center', color: col, marginBottom: 14 }}>{zoneMsg}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <Btn onClick={() => onAdjust(-6)} style={{ fontSize: 18, padding: 12 }}>🔽 Bajar</Btn>
        <Btn onClick={() => onAdjust(6)} primary style={{ fontSize: 18, padding: 12 }}>🔼 Subir</Btn>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>Cocción</span>
          <span style={{ fontSize: 11, fontWeight: 500 }}>{Math.round(paila.progress)}%</span>
        </div>
        <ProgressBar value={paila.progress} color={VERDE} />
      </div>
    </Card>
  )
}

function PhaseEmpaque({ pack, onCatch }) {
  return (
    <Card>
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>
        3 — Empaca el bocadillo
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Toca antes de que expire — verde es perfecto</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: TIERRA }}>{pack.items}/{pack.needed}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 90, alignItems: 'center', marginBottom: 14 }}>
        {pack.slots.length === 0 && (
          <p style={{ fontSize: 12, color: '#9ca3af' }}>Esperando bocadillos...</p>
        )}
        {pack.slots.map(s => {
          const pct = Math.round(s.progress)
          const col = pct < 40 ? VERDE : pct < 70 ? NARANJA : '#E24B4A'
          return (
            <div key={s.id} style={{ flex: '1 0 60px', maxWidth: 90 }}>
              <div
                onClick={() => onCatch(s.id)}
                style={{
                  height: 70, background: '#fff', border: '0.5px solid #e5e7eb',
                  borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', fontSize: 24,
                  transition: 'transform .08s',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(.92)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                🍬
              </div>
              <div style={{ marginTop: 4, height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 2, transition: 'width .05s' }} />
              </div>
            </div>
          )
        })}
      </div>

      <ProgressBar value={pack.items} max={pack.needed} color={VERDE} />
    </Card>
  )
}

function PhaseMercado({ orders, stock, onFulfill, onProducir, onNextDay }) {
  return (
    <Card>
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 10 }}>
        Mercado — entrega tus pedidos
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {orders.length === 0 && (
          <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>Sin pedidos activos</p>
        )}
        {orders.map(o => (
          <div key={o.id} style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{o.client}</p>
                <p style={{ fontSize: 11, color: '#6b7280' }}>{o.qty} und · {fmt(o.price)}/u · total {fmt(o.qty * o.price)}</p>
              </div>
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 20,
                background: o.daysLeft <= 1 ? '#fee2e2' : '#fef3c7',
                color: o.daysLeft <= 1 ? '#dc2626' : '#92400e',
              }}>{o.daysLeft}d</span>
            </div>
            <Btn
              onClick={() => onFulfill(o.id)}
              disabled={stock < o.qty}
              primary={stock >= o.qty}
              color={VERDE}
              style={{ width: '100%', fontSize: 11, padding: '5px 0' }}
            >
              {stock >= o.qty ? `Entregar ${o.qty} →` : `Necesitas ${o.qty - stock} más`}
            </Btn>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Btn onClick={onProducir} primary style={{ fontSize: 12 }}>Producir más →</Btn>
        <Btn onClick={onNextDay} style={{ fontSize: 12 }}>Siguiente día</Btn>
      </div>
    </Card>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function BocadilloGame({ portalOrigin = 'com', serverUrl, onClose }) {
  const [G, setG] = useState(initG)
  const tempRef = useRef(null)
  const packRef = useRef(null)
  const cfg = PORTAL_CFG[portalOrigin] || PORTAL_CFG.com

  const upd = useCallback(fn => setG(prev => {
    const next = JSON.parse(JSON.stringify(prev))
    fn(next)
    return next
  }), [])

  const addLog = (g, msg) => { g.log = [msg, ...g.log].slice(0, 25) }

  // Limpiar intervalos al desmontar
  useEffect(() => () => { clearInterval(tempRef.current); clearInterval(packRef.current) }, [])

  // Motor de temperatura
  useEffect(() => {
    if (G.phase !== 'paila') { clearInterval(tempRef.current); return }
    tempRef.current = setInterval(() => {
      setG(prev => {
        if (prev.phase !== 'paila') return prev
        const next = JSON.parse(JSON.stringify(prev))
        const p = next.paila
        // Temperatura oscila sola
        p._dir = p._dir || 1
        p.temp += p._dir * (1.5 + Math.random() * 0.8)
        if (p.temp >= 98) p._dir = -1
        if (p.temp <= 32) p._dir = 1
        p.time = Math.max(0, p.time - 0.1)
        // Cocción
        if (p.temp >= 65 && p.temp <= 80) {
          p.progress = Math.min(100, p.progress + 1.8)
        } else if (p.temp > 80) {
          p.progress = Math.max(0, p.progress - 0.8)
          if (Math.random() < 0.05) addLog(next, '¡Muy caliente! Baja el fuego')
        } else {
          p.progress = Math.max(0, p.progress - 0.4)
        }
        if (p.progress >= 100) {
          clearInterval(tempRef.current)
          addLog(next, 'Cocción perfecta — hora de empacar')
          next.phase = 'pack'
        }
        if (p.time <= 0 && p.progress < 100) {
          clearInterval(tempRef.current)
          addLog(next, 'Tiempo agotado — producto perdido')
          next.phase = 'tri'
          next.tri = { progress: 0, clicks: 0, needed: 30 }
        }
        return next
      })
    }, 100)
    return () => clearInterval(tempRef.current)
  }, [G.phase])

  // Motor de empaque — spawner
  useEffect(() => {
    if (G.phase !== 'pack') { clearInterval(packRef.current); return }

    const spawnLoop = () => {
      setG(prev => {
        if (prev.phase !== 'pack') return prev
        if (prev.pack.items >= prev.pack.needed) return prev
        const next = JSON.parse(JSON.stringify(prev))
        // Avanzar progreso de slots existentes
        const now = Date.now()
        next.pack.slots = next.pack.slots.filter(s => {
          s.progress = (now - s.born) / s.life * 100
          return s.progress < 100
        })
        // Spawn nuevo si hay espacio
        if (next.pack.slots.length < 5 && next.pack.items < next.pack.needed) {
          next.pack.slots.push({ id: Math.random().toString(36).slice(2), progress: 0, life: 1400 + Math.random() * 600, born: now })
        }
        return next
      })
    }

    packRef.current = setInterval(spawnLoop, 80)
    return () => clearInterval(packRef.current)
  }, [G.phase])

  // Acciones
  const startGame = () => {
    clearInterval(tempRef.current)
    clearInterval(packRef.current)
    upd(g => {
      g.phase = 'tri'
      g.tri = { progress: 0, clicks: 0, needed: 30 }
      g.orders = genOrders(g.rep)
      addLog(g, '¡Día ' + g.day + ' — a producir bocadillo!')
    })
  }

  const onTri = () => {
    upd(g => {
      g.tri.clicks++
      g.tri.progress = Math.min(100, g.tri.clicks / g.tri.needed * 100)
      if (g.tri.clicks >= g.tri.needed) {
        addLog(g, 'Fruta lista para la paila')
        g.phase = 'paila'
        g.paila = { temp: 45, progress: 0, time: 20, _dir: 1 }
      }
    })
  }

  const onAdjust = delta => {
    upd(g => {
      g.paila.temp = Math.max(30, Math.min(100, g.paila.temp + delta))
      g.paila._dir *= delta > 0 ? 1 : -1
    })
  }

  const onCatch = id => {
    upd(g => {
      const s = g.pack.slots.find(x => x.id === id)
      if (!s) return
      const pct = s.progress
      const pts = pct < 40 ? 3 : pct < 70 ? 2 : 1
      const msg = pct < 40 ? 'Perfecto' : pct < 70 ? 'Bien' : 'Justo a tiempo'
      g.pack.slots = g.pack.slots.filter(x => x.id !== id)
      g.pack.score += pts
      g.pack.items++
      g.stock += 2
      addLog(g, msg + ' — +2 bocadillos')
      if (g.pack.items >= g.pack.needed) {
        clearInterval(packRef.current)
        const bonus = g.pack.score * 120
        g.money += bonus
        g.rep = Math.min(5, g.rep + 0.3)
        addLog(g, 'Lote listo: ' + g.stock + ' bocadillos, bonus ' + fmt(bonus))
        g.phase = 'mercado'
      }
    })
  }

  const onFulfill = id => {
    upd(g => {
      const o = g.orders.find(x => x.id === id)
      if (!o || g.stock < o.qty) return
      g.stock -= o.qty
      const earned = o.qty * o.price
      g.money += earned
      g.fulfilled++
      g.rep = Math.min(5, g.rep + 0.4)
      g.orders = g.orders.filter(x => x.id !== id)
      addLog(g, o.client + ' — ' + fmt(earned))
      if (g.rep >= 5 && g.fulfilled >= 5) g.phase = 'win'
    })
  }

  const onNextDay = () => {
    clearInterval(tempRef.current)
    clearInterval(packRef.current)
    upd(g => {
      g.day++
      g.orders.forEach(o => o.daysLeft--)
      g.orders.filter(o => o.daysLeft <= 0).forEach(o => {
        addLog(g, 'Pedido ' + o.client + ' expirado')
        g.rep = Math.max(0.5, g.rep - 0.3)
      })
      g.orders = g.orders.filter(o => o.daysLeft > 0)
      if (g.orders.length < 2) g.orders = [...g.orders, ...genOrders(g.rep)].slice(0, 4)
      addLog(g, '— Día ' + g.day + ' —')
      g.phase = 'tri'
      g.tri = { progress: 0, clicks: 0, needed: 30 }
      if (g.day > 18 && g.fulfilled < 3) g.phase = 'lose'
    })
  }

  // ── Renders por fase ─────────────────────────────────────────────────────────
  const wrap = (children) => (
    <div style={{ fontFamily: 'system-ui,sans-serif', background: '#fff', borderRadius: 16, border: '0.5px solid #e5e7eb', overflow: 'hidden', maxWidth: 640, margin: '0 auto' }}>
      {children}
    </div>
  )

  if (G.phase === 'intro') return wrap(
    <>
      <Header day={G.day} rep={G.rep} accent={cfg.accent} />
      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: '.75rem' }}>🍬</div>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: '#1a1a1a', marginBottom: '.25rem' }}>Maestro Bocadillero</h1>
        <p style={{ fontSize: 13, color: TIERRA, fontStyle: 'italic', marginBottom: '.5rem' }}>El Legado de Vélez, Santander</p>
        <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 300, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
          Hereda la fábrica familiar. Tritura la fruta, controla la temperatura
          de la paila y empaca con buen timing.
        </p>
        <Btn onClick={startGame} primary style={{ fontSize: 14, padding: '12px 32px' }}>Comenzar legado →</Btn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, maxWidth: 340, margin: '1.5rem auto 0' }}>
          {[['👆','Tritura','Clics rápidos'],['🌡️','Temperatura','Mantén el rango'],['📦','Empaca','Toca a tiempo']].map(([e,t,d]) => (
            <div key={t} style={{ background: '#f9fafb', border: '0.5px solid #e5e7eb', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{e}</div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>{t}</p>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>{d}</p>
            </div>
          ))}
        </div>
        {onClose && <div style={{ marginTop: '1.5rem' }}><Btn onClick={onClose}>← Volver</Btn></div>}
      </div>
    </>
  )

  if (G.phase === 'win' || G.phase === 'lose') return wrap(
    <>
      <Header day={G.day} rep={G.rep} accent={cfg.accent} />
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: '.75rem' }}>{G.phase === 'win' ? '🏆' : '😔'}</div>
        <h2 style={{ fontSize: 20, fontWeight: 500, color: '#1a1a1a', marginBottom: '.5rem' }}>
          {G.phase === 'win' ? '¡Maestro Bocadillero!' : 'La fábrica cerró...'}
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 280, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
          {G.phase === 'win'
            ? `¡Lo lograste en ${G.day} días! Ganaste ${fmt(G.money)} y entregaste ${G.fulfilled} pedidos. ¡El bocadillo de Vélez ya es famoso en Colombia!`
            : `Después de ${G.day} días no alcanzaste la meta. ¡La tradición merece otro intento!`}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Btn onClick={() => setG(initG())} primary>Jugar de nuevo</Btn>
          {onClose && <Btn onClick={onClose}>Volver al portal</Btn>}
        </div>
      </div>
    </>
  )

  return wrap(
    <>
      <Header day={G.day} rep={G.rep} accent={cfg.accent} />
      <StatRow money={G.money} stock={G.stock} orders={G.orders.length} fulfilled={G.fulfilled} />
      <StepBar phase={G.phase} />
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {G.phase === 'tri'     && <PhaseTritura tri={G.tri} onClic={onTri} />}
        {G.phase === 'paila'   && <PhasePaila paila={G.paila} onAdjust={onAdjust} />}
        {G.phase === 'pack'    && <PhaseEmpaque pack={G.pack} onCatch={onCatch} />}
        {G.phase === 'mercado' && <PhaseMercado orders={G.orders} stock={G.stock} onFulfill={onFulfill} onProducir={startGame} onNextDay={onNextDay} />}
        <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px' }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: '#9ca3af', marginBottom: 4 }}>Registro</p>
          <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.8, maxHeight: 64, overflowY: 'auto' }}>
            {G.log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
    </>
  )
}