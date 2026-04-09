import React from 'react'
// src/pages/RegisterPage.jsx

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, AlertCircle, UserPlus, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../store/useStore'

const schema = z.object({
  full_name: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
})

export default function RegisterPage() {
  const { register: registerUser } = useAuthStore()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const password = watch('password', '')

  // Indicadores de fortaleza de contraseña
  const strength = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Una mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Un número', ok: /[0-9]/.test(password) },
  ]

  const onSubmit = async ({ full_name, email, phone, password }) => {
    setServerError(null)
    const result = await registerUser({ full_name, email, phone, password })
    if (result.success) {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } else {
      setServerError(result.error)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
        <div className="text-center animate-fade-up">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-semibold mb-2">¡Cuenta creada!</h2>
          <p className="text-stone-500 text-sm">Redirigiendo al login…</p>
        </div>
      </div>
    )
  }

  const Field = ({ name, label, type = 'text', placeholder, children }) => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-stone-700 block">{label}</label>
      {children ?? (
        <input
          type={type}
          placeholder={placeholder}
          {...register(name)}
          className={`input-base ${errors[name] ? 'border-rose-400' : ''}`}
        />
      )}
      {errors[name] && (
        <p className="text-[11px] text-rose-500 flex items-center gap-1">
          <AlertCircle size={10} />{errors[name].message}
        </p>
      )}
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12 bg-stone-50">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-stone-900 mb-1">Crear cuenta</h1>
          <p className="text-sm text-stone-500">Empieza a publicar propiedades hoy</p>
        </div>

        <div className="card p-7 shadow-sm">

          {serverError && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertCircle size={15} className="shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <Field name="full_name" label="Nombre completo" placeholder="Carlos Medina" />
            <Field name="email" label="Email" type="email" placeholder="tu@email.com" />
            <Field name="phone" label="Teléfono (opcional)" placeholder="+57 300 000 0000" />

            {/* Password con toggle */}
            <Field name="password" label="Contraseña">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
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
            </Field>

            {/* Strength indicators */}
            {password.length > 0 && (
              <ul className="space-y-1 pl-1">
                {strength.map(({ label, ok }) => (
                  <li key={label} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-emerald-600' : 'text-stone-400'}`}>
                    <CheckCircle2 size={11} className={ok ? 'opacity-100' : 'opacity-30'} />
                    {label}
                  </li>
                ))}
              </ul>
            )}

            <Field name="confirm_password" label="Confirmar contraseña" type="password" placeholder="••••••••" />

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-2 justify-center"
            >
              <UserPlus size={15} />
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta gratis'}
            </button>

            <p className="text-[11px] text-stone-400 text-center leading-relaxed">
              Al registrarte aceptas nuestros{' '}
              <a href="#" className="underline hover:text-stone-600">Términos de uso</a>
              {' '}y{' '}
              <a href="#" className="underline hover:text-stone-600">Política de privacidad</a>.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-amber-600 hover:text-amber-700 font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}