// src/components/JuegoButton.jsx
// Botón flotante de acceso al juego — mismo estilo que WhatsAppButton
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function JuegoButton() {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/juego')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-6 left-24 z-50 flex items-center gap-2 group"
      aria-label="Jugar Maestro Bocadillero"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      {/* Tooltip */}
      <span className={`
        text-xs font-medium bg-stone-900 text-white px-3 py-1.5 rounded-full whitespace-nowrap
        transition-all duration-200
        ${hovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}
      `}>
        <img
        src="/juego-icon.jpg"
        alt="Juego"
        style={{ width: 30, height: 30, objectFit: 'contain' }}
        /> Maestro Bocadillero
      </span>

      {/* Botón */}
      <div className="relative w-14 h-14 flex items-center justify-center">
        {/* Pulse ring — color tierra */}
        <span className="absolute inset-0 rounded-full opacity-30 animate-ping"
          style={{ background: '#6B4E2A' }} />
        {/* Círculo principal */}
        <div
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110"
          style={{
            background: hovered ? '#5a3f20' : '#6B4E2A',
            boxShadow: '0 4px 20px rgba(107,78,42,0.4)',
          }}
        >
          <span style={{ fontSize: 26, lineHeight: 1 }}>🍬</span>
        </div>
      </div>
    </button>
  )
}