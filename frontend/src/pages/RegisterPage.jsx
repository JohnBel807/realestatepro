import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, AlertCircle, UserPlus, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../store/useStore'

// ─── Zod schema ───────────────────────────────────────────────────────────────
const schema = z.object({
  full_name:        z.string().min(3, 'Mínimo 3 caracteres'),
  email:            z.string().email('Email inválido'),
  phone:            z.string().optional(),
  password:         z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirm_password: z.string(),
  accept_terms:     z.boolean().refine(v => v === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
}).refine(d => d.password === d.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path:    ['confirm_password'],
})

// ─── Field helper — FUERA del componente para evitar re-montaje ───────────────
// Si se define adentro, React lo trata como un tipo nuevo en cada render
// y desmonta/remonta el input, perdiendo el foco con cada keystroke.
function Field({ name, label, type = 'text', placeholder, register, errors, children }) {
  return (
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
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register: registerUser } = useAuthStore()
  const navigate     = useNavigate()
  const [showPass,    setShowPass]    = useState(false)
  const [serverError, setServerError] = useState(null)
  const [success,     setSuccess]     = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const password = watch('password', '')

  const strength = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Una mayúscula',        ok: /[A-Z]/.test(password) },
    { label: 'Un número',            ok: /[0-9]/.test(password) },
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

            <Field name="full_name" label="Nombre completo"     placeholder="Carlos Medina"      register={register} errors={errors} />
            <Field name="email"     label="Email"               placeholder="tu@email.com"        register={register} errors={errors} type="email" />
            <Field name="phone"     label="Teléfono (opcional)" placeholder="+57 300 000 0000"   register={register} errors={errors} />

            {/* Contraseña con toggle de visibilidad */}
            <Field name="password" label="Contraseña" register={register} errors={errors}>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`input-base pr-10 ${errors.password ? 'border-rose-400' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            {/* Indicadores de fortaleza */}
            {password.length > 0 && (
              <ul className="space-y-1 pl-1">
                {strength.map(({ label, ok }) => (
                  <li key={label}
                    className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-emerald-600' : 'text-stone-400'}`}>
                    <CheckCircle2 size={11} className={ok ? 'opacity-100' : 'opacity-30'} />
                    {label}
                  </li>
                ))}
              </ul>
            )}

            <Field name="confirm_password" label="Confirmar contraseña" type="password"
              placeholder="••••••••" register={register} errors={errors} />

            {/* Aceptación de términos */}
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="accept_terms"
                {...register('accept_terms')}
                className="mt-0.5 w-4 h-4 rounded border-stone-300 accent-amber-500 shrink-0"
              />
              <label htmlFor="accept_terms" className="text-xs text-stone-500 leading-relaxed cursor-pointer">
                Acepto los{' '}
                <a href="/legal/terminos" target="_blank" rel="noreferrer"
                  className="text-amber-600 underline hover:text-amber-700">
                  Términos y condiciones
                </a>
                {' '}y la{' '}
                <a href="/legal/privacidad" target="_blank" rel="noreferrer"
                  className="text-amber-600 underline hover:text-amber-700">
                  Política de privacidad
                </a>
                {' '}de VelezyRicaurte Inmobiliaria.
              </label>
            </div>
            {errors.accept_terms && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle size={10} />{errors.accept_terms.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-2 justify-center"
            >
              <UserPlus size={15} />
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta gratis'}
            </button>

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