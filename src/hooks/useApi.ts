import { useState } from 'react'

interface ApiState<T> {
  data: T | null
  error: string | null
  isLoading: boolean
}

interface ApiOptions {
  method?: string
  headers?: Record<string, string>
  body?: Record<string, unknown>
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    isLoading: false
  })

  const request = async (url: string, options: ApiOptions = {}): Promise<ApiState<T>> => {
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
      setState({ data, error: null, isLoading: false })
      return { data, error: null, isLoading: false }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
      setState({ data: null, error: errorMessage, isLoading: false })
      return { data: null, error: errorMessage, isLoading: false }
    }
  }

  return {
    ...state,
    request
  }
} 