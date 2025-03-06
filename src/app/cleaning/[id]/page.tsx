'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { QuoteSummary } from '@/components/QuoteSummary'
import { Modal } from '@/components/Modal'
import { useNotification } from '@/contexts/NotificationContext'
import type { CleaningQuote } from '@/types/quote'

interface QuoteSummaryData {
  id: string
  type: 'cleaning'
  status: string
  createdAt: string
  propertyType: string
  cleaningType: string
  date: string
  time: string
  estimatedPrice: number
}

export default function QuoteDetails({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [quote, setQuote] = useState<CleaningQuote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/cleaning/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch quote')
        const data = await response.json()
        setQuote(data)
      } catch (error) {
        showNotification('error', 'Failed to load quote details')
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchQuote()
  }, [params.id, showNotification])

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/cleaning/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })

      if (!response.ok) throw new Error('Failed to cancel quote')
      
      showNotification('success', 'Quote cancelled successfully')
      router.push('/dashboard/quotes')
    } catch (error) {
      showNotification('error', 'Failed to cancel quote')
      console.error('Error:', error)
    }
    setShowCancelModal(false)
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!quote) {
    return <div className="p-8 text-center">Quote not found</div>
  }

  return (
    <main className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Quote Details</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            {quote.status === 'pending' && (
              <>
                <Button onClick={() => router.push(`/cleaning/${quote.id}/edit`)}>
                  Edit Quote
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Quote
                </Button>
              </>
            )}
          </div>
        </div>

        <QuoteSummary 
          type="cleaning"
          id={quote.id}
          status={quote.status}
          createdAt={quote.createdAt}
          propertyType={quote.propertyType}
          cleaningType={quote.cleaningType}
          date={quote.preferredDate}
          time={quote.preferredTime}
          estimatedPrice={quote.estimatedPrice}
          isCalculating={false}
          quoteDetails={{
            baseCost: quote.estimatedPrice,
            optionsCost: 0,
            totalCost: quote.estimatedPrice,
            distance: 0,
            tollCost: 0,
            fuelCost: 0
          }}
        />

        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Quote"
        >
          <p className="mb-4">Are you sure you want to cancel this quote?</p>
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              No, keep it
            </Button>
            <Button
              variant="secondary"
              onClick={handleCancel}
            >
              Yes, cancel it
            </Button>
          </div>
        </Modal>
      </div>
    </main>
  )
} 