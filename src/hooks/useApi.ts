import { useState } from 'react'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  isLoading: boolean
}

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useApi<T>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    error: null,
    isLoading: false
  })

  const request = async (
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })

      if (!response.ok) {
        throw new Error(response.statusText)
      }

      const data = await response.json()
      setState({ data, error: null, isLoading: false })
      options.onSuccess?.(data)
      return { data, error: null, isLoading: false }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setState({ data: null, error: errorMessage, isLoading: false })
      options.onError?.(errorMessage)
      return { data: null, error: errorMessage, isLoading: false }
    }
  }

  return {
    ...state,
    request
  }
} 