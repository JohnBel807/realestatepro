import React from 'react'
// src/App.jsx
// Router principal: rutas públicas + protegidas

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/useStore'

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage from './pages/HomePage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PricingPage from './pages/PricingPage'

export default function App() {
  const { token, fetchSubscription, refreshUser } = useAuthStore()

  // Rehidratar usuario y suscripción al recargar
  useEffect(() => {
    if (token) {
      refreshUser()        // actualiza trial_ends_at y datos del user
      fetchSubscription()  // actualiza estado de suscripción
    }
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-1">
          <Routes>
            {/* ── Públicas ── */}
            <Route path="/"                  element={<HomePage />} />
            <Route path="/properties/:id"    element={<PropertyDetailPage />} />
            <Route path="/pricing"           element={<PricingPage />} />

            {/* ── Auth (redirige si ya autenticado) ── */}
            <Route
              path="/login"
              element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
              path="/register"
              element={token ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
            />

            {/* ── Protegidas ── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard"       element={<DashboardPage />} />
            </Route>

            {/* ── 404 ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} RealEstate Pro · Colombia
        </footer>
      </div>
    </BrowserRouter>
  )
}