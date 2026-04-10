// src/store/useStore.js
// Estado global con Zustand — sesión de usuario + suscripción

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI, subscriptionAPI } from '../lib/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      subscription: null,
      isLoading: false,
      error: null,

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await authAPI.login(email, password)
          localStorage.setItem('access_token', data.access_token)
          const { data: user } = await authAPI.me()
          set({ token: data.access_token, user, isLoading: false })
          // Fetch subscription in background
          get().fetchSubscription()
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.detail || 'Error al iniciar sesión'
          set({ error: msg, isLoading: false })
          return { success: false, error: msg }
        }
      },

      // Register
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          await authAPI.register(userData)
          set({ isLoading: false })
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.detail || 'Error al registrarse'
          set({ error: msg, isLoading: false })
          return { success: false, error: msg }
        }
      },

      // Refresh user data (incluye trial_ends_at actualizado)
      refreshUser: async () => {
        try {
          const { data: user } = await authAPI.me()
          set({ user })
        } catch {}
      },

      // Logout
      logout: () => {
        localStorage.removeItem('access_token')
        set({ user: null, token: null, subscription: null })
        window.location.href = '/'
      },

      // Fetch subscription — 404 = sin suscripción (normal para usuarios en trial)
      fetchSubscription: async () => {
        try {
          const { data } = await subscriptionAPI.getMySubscription()
          set({ subscription: data })
        } catch (err) {
          // 404 es esperado si el usuario no tiene suscripción activa
          set({ subscription: null })
        }
      },

      // Helpers
      isAuthenticated: () => !!get().token && !!get().user,
      hasActiveSubscription: () => get().subscription?.status === 'active',
      clearError: () => set({ error: null }),
    }),
    {
      name: 'realestate-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)

// ─── Properties Store ─────────────────────────────────────────────────────────
import { propertiesAPI } from '../lib/api'

export const usePropertiesStore = create((set, get) => ({
  properties: [],
  total: 0,
  currentProperty: null,
  myProperties: [],
  isLoading: false,
  error: null,
  filters: {},
  page: 0,
  limit: 12,

  setFilters: (filters) => set({ filters, page: 0 }),

  fetchProperties: async (resetPage = false) => {
    const { filters, limit } = get()
    const page = resetPage ? 0 : get().page
    if (resetPage) set({ page: 0 })
    set({ isLoading: true })
    try {
      const params = { skip: page * limit, limit, ...filters }
      const { data } = await propertiesAPI.list(params)
      set({ properties: data.items, total: data.total, isLoading: false })
    } catch {
      set({ isLoading: false, error: 'Error cargando propiedades' })
    }
  },

  fetchMyProperties: async () => {
    set({ isLoading: true })
    try {
      const { data } = await propertiesAPI.myProperties()
      set({ myProperties: data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  createProperty: async (propertyData) => {
    try {
      const { data } = await propertiesAPI.create(propertyData)
      set((state) => ({ myProperties: [data, ...state.myProperties] }))
      return { success: true, property: data }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al crear propiedad'
      return { success: false, error: msg }
    }
  },

  deleteProperty: async (id) => {
    try {
      await propertiesAPI.delete(id)
      set((state) => ({
        myProperties: state.myProperties.filter((p) => p.id !== id),
        properties:   state.properties.filter((p) => p.id !== id),
      }))
      return { success: true }
    } catch {
      return { success: false }
    }
  },

  updateProperty: async (id, propertyData) => {
    try {
      const { data } = await propertiesAPI.update(id, propertyData)
      set((state) => ({
        myProperties: state.myProperties.map((p) => p.id === id ? data : p),
        properties:   state.properties.map((p)   => p.id === id ? data : p),
      }))
      return { success: true, property: data }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al actualizar la propiedad'
      return { success: false, error: msg }
    }
  },

  nextPage: () => set((s) => ({ page: s.page + 1 })),
  prevPage: () => set((s) => ({ page: Math.max(0, s.page - 1) })),
}))