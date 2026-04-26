// src/pages/JuegoPage.jsx
// Ruta /juego — consume BocadilloGame como página completa
// Agrega al App.jsx: <Route path="/juego" element={<JuegoPage />} />

import React from 'react'
import { useNavigate } from 'react-router-dom'
import BocadilloGame from '../components/BocadilloGame'
import SEOHead from '../components/SEOHead'

export default function JuegoPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#F5EFE6', padding: '1.5rem 1rem' }}>
      <SEOHead
        title="Maestro Bocadillero: El Legado de Vélez — VelezyRicaurte"
        description="Juega al simulador de fábrica de bocadillo de Vélez. Gestiona ingredientes, cumple pedidos y gana reputación regional. Gratis en VelezyRicaurte Inmobiliaria."
        keywords={['bocadillo Vélez', 'juego fábrica bocadillo', 'Vélez Santander', 'VelezyRicaurte']}
      />

      {/* Breadcrumb */}
      <div style={{ maxWidth: 680, margin: '0 auto 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 13,
            color: '#6B4E2A',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          ← Inicio
        </button>
        <span style={{ fontSize: 13, color: '#9ca3af' }}>/</span>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Juego</span>
      </div>

      {/* Intro texto */}
      <div style={{ maxWidth: 680, margin: '0 auto 1rem', textAlign: 'center' }}>
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: '#C4631A',
        }}>
          Cultura regional · Vélez, Santander
        </span>
      </div>

      {/* El juego */}
      <BocadilloGame
        portalOrigin="com"
        serverUrl="https://realestatepro-production.up.railway.app"
        onClose={() => navigate('/')}
      />

      {/* Footer info */}
      <div style={{ maxWidth: 680, margin: '1.5rem auto 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
          El bocadillo de guayaba es el producto insignia de Vélez, Santander.
          Con Indicación Geográfica Protegida desde 2008.
          Este juego es un homenaje a los maestros bocadilleros de la región.
        </p>
        <p style={{ fontSize: 11, color: '#c4b09a', marginTop: 8 }}>
          VelezyRicaurte Inmobiliaria · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}