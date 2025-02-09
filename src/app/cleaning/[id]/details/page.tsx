'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CleaningQuote, QuoteStatus } from '@/types/quote'
import { useNotification } from '@/contexts/NotificationContext'
import { Button } from '@/components/Button'
import { dateUtils } from '@/utils/dateUtils'
import { priceUtils } from '@/utils/priceUtils'
import { ConfirmModal } from '@/components/Modal'

const statusColors: Record<QuoteStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
}

export default function QuoteDetails({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [quote, setQuote] = useState<CleaningQuote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    fetchQuote()
  }, [params.id])

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

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    try {
      const response = await fetch(`/api/cleaning/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')
      
      showNotification('success', 'Status updated successfully')
      fetchQuote()
    } catch (error) {
      showNotification('error', 'Failed to update status')
      console.error('Error:', error)
    }
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
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quote Details</h1>
            <p className="text-gray-500">ID: {quote.id}</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Back
            </Button>
            {quote.status === 'pending' && (
              <Button
                onClick={() => router.push(`/cleaning/${quote.id}/edit`)}
              >
                Edit Quote
              </Button>
            )}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Détails du service */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Service Details</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[quote.status]}`}>
                    {quote.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Service Type</dt>
                <dd className="mt-1">{quote.cleaningType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                <dd className="mt-1">{quote.propertyType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Size</dt>
                <dd className="mt-1">{quote.squareMeters} m²</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Rooms</dt>
                <dd className="mt-1">{quote.numberOfRooms} rooms, {quote.numberOfBathrooms} bathrooms</dd>
              </div>
            </dl>
          </div>

          {/* Détails du rendez-vous et du paiement */}
          <div className="space-y-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Appointment</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="mt-1">{dateUtils.format(quote.preferredDate, 'long')}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Time</dt>
                  <dd className="mt-1">{quote.preferredTime}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                  <dd className="mt-1">{quote.frequency}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Payment</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Estimated Price</dt>
                  <dd className="mt-1 text-2xl font-semibold">{priceUtils.format(quote.estimatedPrice)}</dd>
                </div>
                {quote.status === 'paid' && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Deposit Paid</dt>
                    <dd className="mt-1">{priceUtils.format(priceUtils.calculateDeposit(quote.estimatedPrice))}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        <ConfirmModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={() => {
            handleStatusChange('cancelled')
            setShowCancelModal(false)
          }}
          title="Cancel Quote"
          message="Are you sure you want to cancel this quote? This action cannot be undone."
          confirmLabel="Cancel Quote"
          cancelLabel="Keep Quote"
        />
      </div>
    </main>
  )
} 