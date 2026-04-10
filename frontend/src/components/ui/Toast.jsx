// src/components/ui/Toast.jsx
// Sistema de notificaciones toast elegante — sin dependencias externas

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X, WifiOff } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />,
  error:   <AlertCircle  size={16} className="text-rose-500 shrink-0" />,
  info:    <Info         size={16} className="text-blue-500 shrink-0" />,
  warning: <AlertCircle  size={16} className="text-amber-500 shrink-0" />,
  network: <WifiOff      size={16} className="text-stone-400 shrink-0" />,
}

const STYLES = {
  success: 'border-emerald-200 bg-emerald-50',
  error:   'border-rose-200 bg-rose-50',
  info:    'border-blue-200 bg-blue-50',
  warning: 'border-amber-200 bg-amber-50',
  network: 'border-stone-200 bg-stone-100',
}

let toastId = 0

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Entrada
    requestAnimationFrame(() => setVisible(true))
    // Auto-remove
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, toast.duration || 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm max-w-sm w-full
        transition-all duration-300
        ${STYLES[toast.type] || STYLES.info}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      {ICONS[toast.type] || ICONS.info}
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-medium text-stone-900 mb-0.5">{toast.title}</p>}
        <p className="text-stone-600 leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300) }}
        className="shrink-0 text-stone-400 hover:text-stone-600 transition-colors mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const add = useCallback((message, type = 'info', options = {}) => {
    const id = ++toastId
    setToasts(prev => [...prev.slice(-4), { id, message, type, ...options }])
    return id
  }, [])

  const toast = {
    success: (msg, opts) => add(msg, 'success', opts),
    error:   (msg, opts) => add(msg, 'error', opts),
    info:    (msg, opts) => add(msg, 'info', opts),
    warning: (msg, opts) => add(msg, 'warning', opts),
    network: (msg, opts) => add(msg, 'network', opts),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Portal de toasts — esquina inferior derecha */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}