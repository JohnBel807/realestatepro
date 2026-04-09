import React from 'react'
// src/components/ErrorBoundary.jsx
// Captura errores de render para evitar pantalla en blanco

import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertTriangle size={36} className="text-amber-400" />
          <h2 className="font-serif text-xl font-medium">Algo salió mal</h2>
          <p className="text-sm text-stone-500 max-w-sm">
            {this.state.error?.message || 'Ocurrió un error inesperado. Recarga la página.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-secondary text-sm"
          >
            Intentar de nuevo
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── 404 / Empty state genérico ───────────────────────────────────────────────
export function EmptyState({ icon = '🏠', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="text-4xl">{icon}</span>
      <h3 className="font-serif text-lg font-medium text-stone-800">{title}</h3>
      {description && <p className="text-sm text-stone-400 max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ─── Loading spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`border-2 border-stone-200 border-t-amber-500 rounded-full animate-spin ${className}`}
    />
  )
}