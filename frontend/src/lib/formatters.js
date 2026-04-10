// src/lib/formatters.js

export function formatPrice(amount, currency = 'COP') {
  if (!amount && amount !== 0) return '$0'
  if (currency === 'COP') {
    if (amount >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(1).replace('.0', '')}B`
    }
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(0)}M`
    }
    return `$${amount.toLocaleString('es-CO')}`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatArea(m2) {
  return `${m2.toLocaleString('es-CO')} m²`
}

export function formatRelativeDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}


// ─── Cloudinary URL optimizer ─────────────────────────────────────────────────
/**
 * Aplica transformaciones a una URL de Cloudinary al vuelo.
 * Cloudinary permite modificar la URL directamente sin re-firmar.
 *
 * Uso:
 *   cloudinaryUrl(url, 'w_800,h_600,c_fill,q_auto,f_auto')
 *   cloudinaryUrl(url, 'w_400,h_300,c_fill,q_auto:eco,f_auto')
 */
export function cloudinaryUrl(url, transforms = 'w_1200,h_800,c_limit,q_auto,f_auto') {
  if (!url || !url.includes('cloudinary.com')) return url
  // Inserta las transformaciones después de /upload/
  return url.replace('/upload/', `/upload/${transforms}/`)
}

/** Thumbnail optimizado (tarjetas de listado) */
export function cloudinaryThumb(url) {
  return cloudinaryUrl(url, 'w_600,h_400,c_fill,q_auto:good,f_auto')
}

/** Imagen de detalle (página de propiedad) */
export function cloudinaryDetail(url) {
  return cloudinaryUrl(url, 'w_1200,h_800,c_limit,q_auto:good,f_auto')
}