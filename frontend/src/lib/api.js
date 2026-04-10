// src/lib/api.js
// Axios instance con interceptors, retry y manejo de errores

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Referencia al toast — se inyecta desde App.jsx para evitar ciclos
let _toast = null
export const setToastRef = (t) => { _toast = t }

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response interceptor con toasts ──────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail

    if (!error.response) {
      // Sin conexión
      _toast?.network('Sin conexión. Revisa tu internet.', { duration: 6000 })
    } else if (status === 401) {
      localStorage.removeItem('access_token')
      _toast?.warning('Sesión expirada. Inicia sesión de nuevo.')
      setTimeout(() => { window.location.href = '/login' }, 1500)
    } else if (status === 403) {
      _toast?.warning(detail || 'No tienes permiso para realizar esta acción.')
    } else if (status === 422) {
      _toast?.error('Datos inválidos. Revisa el formulario.')
    } else if (status >= 500) {
      _toast?.error('Error del servidor. Intenta de nuevo en unos segundos.', { duration: 6000 })
    }

    return Promise.reject(error)
  }
)

export default api

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/token', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  trialStatus: () => api.get('/auth/trial-status'),
}

// ─── Properties API ───────────────────────────────────────────────────────────
export const propertiesAPI = {
  list: (params = {}) => api.get('/properties', { params }),
  get: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  myProperties: () => api.get('/dashboard/my-properties'),
}

// ─── Subscription API ─────────────────────────────────────────────────────────
export const subscriptionAPI = {
  getMySubscription: () => api.get('/dashboard/subscription'),
  createCheckout: (planType) => api.post('/create-checkout-session', { plan_type: planType }),
}

// ─── Upload API ───────────────────────────────────────────────────────────────
export const uploadAPI = {
  uploadImages: (files) => {
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    return api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteImage: (publicId) =>
    api.delete(`/upload/image?public_id=${encodeURIComponent(publicId)}`),
}