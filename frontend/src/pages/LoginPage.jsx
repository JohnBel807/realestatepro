import React from 'react'
// src/pages/LoginPage.jsx

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react'
import { useAuthStore } from '../store/useStore'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export default function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }) => {
    setServerError(null)
    const result = await login(email, password)
    if (result.success) {
      navigate(from, { replace: true })
    } else {
      setServerError(result.error)
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12 bg-stone-50">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-stone-900 mb-1">Bienvenido</h1>
          <p className="text-sm text-stone-500">Inicia sesión en tu cuenta</p>
        </div>

        {/* Card */}
        <div className="card p-7 shadow-sm">

          {serverError && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertCircle size={15} className="shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                {...register('email')}
                className={`input-base ${errors.email ? 'border-rose-400' : ''}`}
              />
              {errors.email && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle size={10} />{errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`input-base pr-10 ${errors.password ? 'border-rose-400' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle size={10} />{errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-2 justify-center"
            >
              <LogIn size={15} />
              {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-stone-500 mt-5">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-amber-600 hover:text-amber-700 font-medium">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}