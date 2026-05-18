// src/lib/formatters.js

// Tasa de cambio aproximada — se actualiza manualmente cada trimestre
// USD 1 ≈ COP 4.100 (mayo 2026)
const TRM = 4100

/**
 * formatPrice — número completo sin abreviaciones, fuente sobria
 * @param {number} amount
 * @param {'COP'|'USD'} currency
 * @param {string} lang — 'es' | 'en' (viene de i18n.language)
 * @returns string  ej: "$ 180.000.000 COP" o "≈ USD 43,902"
 */
export function formatPrice(amount, currency = 'COP', lang = 'es') {
  if (!amount && amount !== 0) return '—'

  if (currency === 'COP') {
    const cop = new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 0,
    }).format(amount)

    if (lang?.startsWith('en')) {
      // En inglés: mostrar en USD con aproximación
      const usd = new Intl.NumberFormat('en-US', {
        style:                 'currency',
        currency:              'USD',
        maximumFractionDigits: 0,
      }).format(Math.round(amount / TRM))
      return `≈ ${usd} USD`
    }

    return `$ ${cop} COP`
  }

  // USD nativo
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * formatPriceDual — muestra COP y USD simultáneamente (para página de detalle)
 * Retorna objeto { main, secondary }
 */
export function formatPriceDual(amount, currency = 'COP') {
  if (!amount && amount !== 0) return { main: '—', secondary: null }

  if (currency === 'COP') {
    const cop = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount)
    const usd = new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(Math.round(amount / TRM))
    return {
      main:      `$ ${cop} COP`,
      secondary: `≈ ${usd} USD`,
    }
  }

  return {
    main: new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(amount),
    secondary: null,
  }
}

export function formatArea(m2) {
  return `${m2.toLocaleString('es-CO')} m²`
}

export function formatRelativeDate(dateString) {
  const date     = new Date(dateString)
  const now      = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7)  return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Cloudinary URL optimizer ─────────────────────────────────────────────────
export function cloudinaryUrl(url, transforms = 'w_1200,h_800,c_limit,q_auto,f_auto') {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/${transforms}/`)
}

export function cloudinaryThumb(url) {
  return cloudinaryUrl(url, 'w_600,h_400,c_fill,q_auto:good,f_auto')
}

export function cloudinaryDetail(url) {
  return cloudinaryUrl(url, 'w_1200,h_800,c_limit,q_auto:good,f_auto')
}