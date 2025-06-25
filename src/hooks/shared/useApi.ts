import { useState } from 'react'

interface ApiState<T> {
  data: T | null
  error: string | null
  isLoading: boolean
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: Record<string, unknown>
}

interface ApiResponse<T> {
  data: T
  error: string | null
  isLoading: boolean
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    isLoading: false
  })

  const request = async (url: string, options: ApiOptions = {}): Promise<ApiResponse<T>> => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const result = { data, error: null, isLoading: false }
      setState(result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
      const result = { data: null as T, error: errorMessage, isLoading: false }
      setState(result)
      return result
    }
  }

  return {
    ...state,
    request
  }
} 