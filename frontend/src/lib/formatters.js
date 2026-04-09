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