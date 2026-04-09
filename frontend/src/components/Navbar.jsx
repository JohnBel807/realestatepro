import React from 'react'
// src/components/Navbar.jsx

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Crown, LogOut, LayoutDashboard, PlusCircle } from 'lucide-react'
import { useAuthStore } from '../store/useStore'

export default function Navbar() {
  const { user, subscription, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const authed = isAuthenticated()
  const hasSub = subscription?.status === 'active'

  const navLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`text-sm transition-colors ${
        location.pathname === to
          ? 'text-stone-900 font-medium'
          : 'text-stone-500 hover:text-stone-800'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="font-serif text-lg font-semibold shrink-0">
          RealEstate<span className="text-amber-500">Pro</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLink('/', 'Inicio')}
          {navLink('/pricing', 'Planes')}
          {authed && navLink('/dashboard', 'Dashboard')}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {authed ? (
            <>
              {hasSub && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
                >
                  <Crown size={12} /> {subscription.plan_type}
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                <LayoutDashboard size={15} />
                <span className="max-w-[120px] truncate">{user?.full_name?.split(' ')[0]}</span>
              </button>
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                className="flex items-center gap-1 text-sm text-stone-400 hover:text-rose-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="btn-primary text-xs px-4 py-2"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menú"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-stone-100 bg-white px-4 py-4 space-y-3 animate-fade-up">
          {navLink('/', 'Inicio')}
          {navLink('/pricing', 'Planes')}
          {authed && navLink('/dashboard', 'Dashboard')}
          <hr className="border-stone-100" />
          {authed ? (
            <button
              onClick={() => { logout(); setMenuOpen(false) }}
              className="flex items-center gap-2 text-sm text-rose-500 w-full"
            >
              <LogOut size={15} /> Cerrar sesión
            </button>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary justify-center text-sm">
                Iniciar sesión
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary justify-center text-sm">
                Registrarse gratis
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}