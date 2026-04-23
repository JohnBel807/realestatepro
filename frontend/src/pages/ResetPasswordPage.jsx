// src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import api from '../lib/api'

export default function ResetPasswordPage() {
  const [params]          = useSearchParams()
  const navigate          = useNavigate()
  const token             = params.get('token') || ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState(null)

  const valid = password.length >= 8
    && /[A-Z]/.test(password)
    && /[0-9]/.test(password)
    && password === confirm

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al restablecer. El enlace puede haber expirado.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 bg-stone-50">
      <div className="text-center">
        <p className="text-stone-500 mb-4">Enlace inválido.</p>
        <Link to="/forgot-password" className="text-amber-600 underline text-sm">
          Solicitar uno nuevo
        </Link>
      </div>
    </div>
  )

  if (done) return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 bg-stone-50">
      <div className="text-center max-w-sm animate-fade-up">
        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-semibold mb-2">¡Contraseña actualizada!</h2>
        <p className="text-stone-500 text-sm">Redirigiendo al login…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12 bg-stone-50">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-amber-600" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-stone-900 mb-1">
            Nueva contraseña
          </h1>
          <p className="text-sm text-stone-500">Elige una contraseña segura para tu cuenta.</p>
        </div>

        <div className="card p-7 shadow-sm">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertCircle size={15} className="shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nueva contraseña */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-stone-700">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="input-base pr-10"
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Indicadores */}
              {password.length > 0 && (
                <ul className="space-y-0.5 pl-1">
                  {[
                    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
                    { label: 'Una mayúscula',        ok: /[A-Z]/.test(password) },
                    { label: 'Un número',            ok: /[0-9]/.test(password) },
                  ].map(({ label, ok }) => (
                    <li key={label} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-emerald-600' : 'text-stone-400'}`}>
                      <CheckCircle2 size={11} className={ok ? 'opacity-100' : 'opacity-30'} />
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Confirmar */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-stone-700">Confirmar contraseña</label>
              <input
                type="password"
                placeholder="Repite la contraseña"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                className={`input-base ${confirm && confirm !== password ? 'border-rose-400' : ''}`}
              />
              {confirm && confirm !== password && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle size={10} /> Las contraseñas no coinciden
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !valid}
              className="btn-primary w-full justify-center mt-2"
            >
              {loading ? 'Actualizando…' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}