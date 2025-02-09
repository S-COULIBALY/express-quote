import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQuotes } from '../useQuotes'
import { NotificationProvider } from '@/contexts/NotificationContext'

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </QueryClientProvider>
  )
}

describe('useQuotes', () => {
  it('fetches quotes successfully', async () => {
    const { result } = renderHook(() => useQuotes(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.quotes).toEqual([])

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.quotes).toHaveLength(1)
    expect(result.current.error).toBeNull()
  })
}) 