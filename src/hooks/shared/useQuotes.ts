import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { MovingQuote, QuoteStatus } from '@/types/quote'
import { useNotification } from '@/contexts/NotificationContext'
import { config } from '@/config'

interface UpdateQuoteStatusParams {
  quoteId: string
  status: QuoteStatus
}

export function useQuotes() {
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()

  const { data: quotes = [], isLoading, error } = useQuery<MovingQuote[]>({
    queryKey: ['quotes'],
    queryFn: async () => {
      const response = await fetch(`${config.api.baseUrl}/moving`)
      if (!response.ok) {
        throw new Error('Failed to fetch quotes')
      }
      return response.json()
    }
  })

  const updateQuoteMutation = useMutation<
    MovingQuote,
    Error,
    UpdateQuoteStatusParams
  >({
    mutationFn: async ({ quoteId, status }) => {
      const response = await fetch(`${config.api.baseUrl}/moving/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!response.ok) {
        throw new Error('Failed to update quote status')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      showNotification('success', 'Statut du devis mis à jour avec succès')
    },
    onError: (error) => {
      showNotification('error', error.message)
    }
  })

  return {
    quotes,
    isLoading,
    error,
    updateQuoteStatus: updateQuoteMutation.mutate
  }
} 