import React from 'react'
// src/components/ProtectedRoute.jsx
// Wrapper para rutas que requieren autenticación

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useStore'

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated()) {
    // Guarda la ruta destino para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}