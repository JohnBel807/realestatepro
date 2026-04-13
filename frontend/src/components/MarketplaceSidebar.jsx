// src/components/MarketplaceSidebar.jsx
// Barra lateral fija que conecta velezyricaurte.com con velezyricaurte.info

import React, { useState } from 'react'

const MARKETPLACE_URL = 'https://www.velezyricaurte.info'

export default function MarketplaceSidebar() {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={MARKETPLACE_URL}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Ir a VelezYRicaurte Marketplace Regional"
      style={{
        position:   'fixed',
        right:      0,
        top:        '50%',
        transform:  'translateY(-50%)',
        zIndex:     999,
        display:    'flex',
        alignItems: 'stretch',
        textDecoration: 'none',
        filter:     hovered ? 'brightness(1.06)' : 'none',
        transition: 'filter .2s',
      }}
    >
      {/* Flecha izquierda */}
      <div style={{
        width: 0, height: 0,
        borderTop:    '22px solid transparent',
        borderBottom: '22px solid transparent',
        borderRight:  `14px solid ${hovered ? '#B5570F' : '#C4631A'}`,
        transition: 'border-color .2s',
        alignSelf: 'center',
      }} />

      {/* Cuerpo principal */}
      <div style={{
        background:    hovered ? '#B5570F' : '#C4631A',
        borderRadius:  '8px 0 0 8px',
        padding:       '14px 10px',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           10,
        boxShadow:     '-4px 0 18px rgba(196,99,26,0.25)',
        transition:    'background .2s',
        minWidth:      44,
      }}>
        {/* Logo V */}
        <div style={{
          width:          32,
          height:         32,
          borderRadius:   7,
          background:     'rgba(255,255,255,0.18)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          border:         '1.5px solid rgba(255,255,255,0.35)',
          flexShrink:     0,
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'Georgia, serif', lineHeight: 1 }}>
            V
          </span>
        </div>

        {/* Texto vertical */}
        <div style={{
          writingMode:   'vertical-rl',
          transform:     'rotate(180deg)',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           4,
        }}>
          <span style={{
            color:      '#fff',
            fontSize:   11,
            fontWeight: 700,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '.04em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}>
            VelezYRicaurte
          </span>
          <span style={{
            color:      'rgba(255,255,255,0.75)',
            fontSize:   9,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}>
            Marketplace Regional
          </span>
        </div>

        {/* Ícono tienda */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.8)" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>

        {/* Flecha animada */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.6)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ marginTop: 2 }}>
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>

      {/* Tooltip al hover */}
      {hovered && (
        <div style={{
          position:     'absolute',
          right:        '100%',
          top:          '50%',
          transform:    'translateY(-50%)',
          marginRight:  12,
          background:   '#1C1208',
          color:        '#fff',
          fontSize:     12,
          fontFamily:   'Arial, sans-serif',
          padding:      '8px 14px',
          borderRadius: 8,
          whiteSpace:   'nowrap',
          boxShadow:    '0 4px 16px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>Marketplace Regional</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
            Compra y vende de todo en la región
          </div>
          {/* Flecha del tooltip */}
          <div style={{
            position:    'absolute',
            right:       -6,
            top:         '50%',
            transform:   'translateY(-50%)',
            width:       0, height: 0,
            borderTop:   '6px solid transparent',
            borderBottom:'6px solid transparent',
            borderLeft:  '6px solid #1C1208',
          }} />
        </div>
      )}
    </a>
  )
}
