import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CleaningQuote, QuoteStatus } from '@/types/quote'
import { useNotification } from '@/contexts/NotificationContext'
import { config } from '@/config'

const QUOTES_QUERY_KEY = 'quotes'

export function useQuotes() {
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()

  const { data: quotes = [], isLoading, error } = useQuery<CleaningQuote[]>({
    queryKey: [QUOTES_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch(`${config.api.baseUrl}/cleaning`)
      if (!response.ok) throw new Error('Failed to fetch quotes')
      return response.json()
    }
  })

  const updateQuoteMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: QuoteStatus }) => {
      const response = await fetch(`${config.api.baseUrl}/cleaning/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!response.ok) throw new Error('Failed to update quote')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUOTES_QUERY_KEY] })
      showNotification('success', 'Quote updated successfully')
    },
    onError: () => {
      showNotification('error', 'Failed to update quote')
    }
  })

  return {
    quotes,
    isLoading,
    error,
    updateQuoteStatus: updateQuoteMutation.mutate
  }
} 