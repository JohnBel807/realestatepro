// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Mail, ArrowLeft } from 'lucide-react'
import api from '../lib/api'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
      setSent(true)
    } catch {
      setError('Error al enviar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 bg-stone-50">
      <div className="text-center max-w-sm animate-fade-up">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-stone-900 mb-2">
          ¡Correo enviado!
        </h2>
        <p className="text-stone-500 text-sm leading-relaxed mb-6">
          Si <strong>{email}</strong> está registrado, recibirás un enlace para
          restablecer tu contraseña en los próximos minutos.
        </p>
        <p className="text-xs text-stone-400 mb-6">
          Revisa también tu carpeta de spam.
        </p>
        <Link to="/login"
          className="text-amber-600 hover:text-amber-700 font-medium text-sm flex items-center justify-center gap-1">
          <ArrowLeft size={14} /> Volver al login
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12 bg-stone-50">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-amber-600" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900 mb-1">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-sm text-stone-500">
            Ingresa tu correo y te enviamos un enlace para restablecerla.
          </p>
        </div>

        <div className="card p-7 shadow-sm">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertCircle size={15} className="shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-stone-700">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="input-base"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full justify-center mt-2"
            >
              {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 mt-5">
          <Link to="/login"
            className="text-amber-600 hover:text-amber-700 font-medium flex items-center justify-center gap-1">
            <ArrowLeft size={14} /> Volver al login
          </Link>
        </p>
      </div>
    </div>
  )
}