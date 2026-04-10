// src/App.jsx
import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { useAuthStore } from './store/useStore'
import { setToastRef } from './lib/api'
import { ToastProvider, useToast } from './components/ui/Toast'

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import WhatsAppButton from './components/WhatsAppButton'

import HomePage from './pages/HomePage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PricingPage from './pages/PricingPage'

// Conecta Axios con el sistema de toasts
function AxiosToastBridge() {
  let toast = null
  try { toast = useToast() } catch {}
  useEffect(() => { if (toast) setToastRef(toast) }, [])
  return null
}

function AppInner() {
  const { token, fetchSubscription, refreshUser } = useAuthStore()

  useEffect(() => {
    if (token) {
      refreshUser()
      fetchSubscription()
    }

    // Wompi redirect: ?subscription=success&plan=pro
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscription') === 'success' && params.get('plan') && token) {
      const plan = params.get('plan')
      import('./lib/api').then(({ default: api }) => {
        api.get(`/dashboard/activate-subscription?plan=${plan}`)
          .then(() => {
            fetchSubscription()
            // Limpiar URL sin recargar
            window.history.replaceState({}, '', '/dashboard')
          })
          .catch(() => {})
      })
    }
  }, [])

  return (
    <BrowserRouter>
      <AxiosToastBridge />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<div className="p-8 text-center text-stone-400">Cargando…</div>}>
            <Routes>
              <Route path="/"               element={<HomePage />} />
              <Route path="/properties/:id" element={<PropertyDetailPage />} />
              <Route path="/pricing"        element={<PricingPage />} />
              <Route path="/login"
                element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
              <Route path="/register"
                element={token ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      {/* WhatsApp flotante — siempre visible */}
      <WhatsAppButton />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}