// src/components/Navbar.jsx — VelezyRicaurte Inmobiliaria
import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Crown, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../store/useStore'
import { useTranslation } from 'react-i18next'

function LangToggle() {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('en') ? 'en' : 'es'
  const toggle = () => i18n.changeLanguage(current === 'es' ? 'en' : 'es')
  return (
    <button onClick={toggle}
      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors text-stone-600"
      title="Cambiar idioma / Change language">
      <span className="text-sm">{current === 'es' ? '🇨🇴' : '🇺🇸'}</span>
      <span>{current === 'es' ? 'ES' : 'EN'}</span>
    </button>
  )
}

export function Logo({ size = 'md' }) {
  const isLg = size === 'lg'
  return (
    <span className={`font-serif font-semibold tracking-tight ${isLg ? 'text-3xl' : 'text-lg'}`}>
      <span style={{ color: '#6B4E2A' }}>Velez</span>
      <span style={{ color: '#2D6B2A' }}>&</span>
      <span style={{ color: '#C4631A' }}>Ricaurte</span>
      {!isLg && <span className="hidden sm:inline text-stone-400 font-sans text-xs font-normal ml-1.5">Inmobiliaria</span>}
    </span>
  )
}

export default function Navbar() {
  const { t } = useTranslation()
  const { user, subscription, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const authed = isAuthenticated()
  const hasSub = subscription?.status === 'active'

  const NavLink = ({ to, label }) => (
    <Link to={to} onClick={() => setMenuOpen(false)}
      className={`text-sm transition-colors ${location.pathname === to
        ? 'text-stone-900 font-medium'
        : 'text-stone-500 hover:text-stone-800'}`}>
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/"><Logo /></Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" label={t('nav.home')} />
          <NavLink to="/pricing" label={t('nav.pricing')} />
          {authed && <NavLink to="/dashboard" label={t('nav.dashboard')} />}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LangToggle />
          {authed ? (
            <>
              {hasSub && (
                <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-full font-medium">
                  <Crown size={11} /> {subscription.plan_type}
                </span>
              )}
              <button onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors px-2">
                <LayoutDashboard size={14} />
                <span className="max-w-[100px] truncate">{user?.full_name?.split(' ')[0]}</span>
              </button>
              <button onClick={logout}
                className="p-1.5 text-stone-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
                title={t('nav.logout')}>
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login"
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors px-2">
                {t('nav.login')}
              </Link>
              <Link to="/register"
                className="text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <button className="md:hidden p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg"
          onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-stone-100 bg-white px-4 py-4 space-y-3 animate-fade-up">
          <NavLink to="/" label={t('nav.home')} />
          <NavLink to="/pricing" label={t('nav.pricing')} />
          {authed && <NavLink to="/dashboard" label={t('nav.dashboard')} />}
          <div className="pt-2 flex gap-2">
            <LangToggle />
          </div>
          <hr className="border-stone-100" />
          {authed ? (
            <button onClick={() => { logout(); setMenuOpen(false) }}
              className="flex items-center gap-2 text-sm text-rose-500 w-full">
              <LogOut size={15} /> {t('nav.logout')}
            </button>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="text-center py-2 border border-stone-200 rounded-lg text-sm text-stone-700 hover:bg-stone-50">
                {t('nav.login')}
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="text-center py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800">
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}