// src/hooks/useProperties.js
// Hook reutilizable para fetching de propiedades con estado local

import { useState, useEffect, useCallback } from 'react'
import { propertiesAPI } from '../lib/api'

export function useProperties(initialFilters = {}) {
  const [properties, setProperties] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState(initialFilters)
  const limit = 12

  const fetch = useCallback(async (currentPage = 0, currentFilters = filters) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = {
        skip: currentPage * limit,
        limit,
        ...Object.fromEntries(
          Object.entries(currentFilters).filter(([, v]) => v !== '' && v != null)
        ),
      }
      const { data } = await propertiesAPI.list(params)
      setProperties(data.items)
      setTotal(data.total)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error cargando propiedades')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetch(page, filters)
  }, [page, filters])

  const applyFilters = (newFilters) => {
    setFilters(newFilters)
    setPage(0)
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    setPage(0)
  }

  const totalPages = Math.ceil(total / limit)

  return {
    properties,
    total,
    isLoading,
    error,
    page,
    totalPages,
    limit,
    filters,
    applyFilters,
    resetFilters,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages - 1)),
    prevPage: () => setPage((p) => Math.max(p - 1, 0)),
    refetch: () => fetch(page, filters),
  }
}
