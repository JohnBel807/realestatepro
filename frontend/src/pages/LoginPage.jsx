// src/pages/LoginPage.jsx
import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/useStore'

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export default function LoginPage() {
  const { login }    = useAuthStore()
  const navigate     = useNavigate()
  const location     = useLocation()
  const from         = location.state?.from?.pathname || '/dashboard'
  const [showPass, setShowPass]       = useState(false)
  const [serverError, setServerError] = useState(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }) => {
    setServerError(null)
    const result = await login(email, password)
    if (result.success) navigate(from, { replace: true })
    else setServerError(result.error)
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo + título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-700 mb-5 shadow-lg">
            <span className="font-serif text-3xl font-bold text-stone-100">V</span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-stone-900 mb-2">Bienvenido</h1>
          <p className="text-stone-400 text-sm flex items-center justify-center gap-1.5">
            <span>🏡</span> VelezyRicaurte Inmobiliaria
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg px-8 py-9">

          {serverError && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl mb-6">
              <AlertCircle size={15} className="shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-stone-700">
                Correo electrónico
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                {...register('email')}
                className={`w-full border rounded-xl px-4 py-4 text-sm text-stone-900
                  placeholder:text-stone-300 outline-none transition-all
                  focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700
                  ${errors.email ? 'border-rose-400' : 'border-stone-200'}`}
              />
              {errors.email && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle size={10} />{errors.email.message}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-stone-700">Contraseña</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-amber-700 hover:text-amber-800 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full border rounded-xl px-4 py-4 text-sm text-stone-900
                    placeholder:text-stone-300 outline-none transition-all pr-12
                    focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700
                    ${errors.password ? 'border-rose-400' : 'border-stone-200'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle size={10} />{errors.password.message}
                </p>
              )}
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-700 hover:bg-amber-800 active:scale-[0.98]
                text-white font-bold text-base py-4 rounded-xl transition-all
                disabled:opacity-60 mt-2 shadow-md shadow-amber-700/20"
            >
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </button>

          </form>
        </div>

        {/* Registro */}
        <p className="text-center text-sm text-stone-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link
            to="/register"
            className="text-amber-700 hover:text-amber-800 font-bold transition-colors"
          >
            Regístrate
          </Link>
        </p>

      </div>
    </div>
  )
}