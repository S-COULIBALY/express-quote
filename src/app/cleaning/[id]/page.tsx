'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { QuoteSummary } from '@/components/QuoteSummary'

interface CleaningQuote {
  id: string
  propertyType: string
  squareMeters: string
  numberOfRooms: string
  numberOfBathrooms: string
  cleaningType: string
  frequency: string
  preferredDate: string
  preferredTime: string
  specialRequests?: string
  status: string
  estimatedPrice: number
  createdAt: string
}

export default function CleaningQuoteDetails({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter()
  const [quote, setQuote] = useState<CleaningQuote | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/cleaning/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setQuote(data)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Error fetching quote:', err)
        setIsLoading(false)
      })
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quote?')) return

    try {
      const response = await fetch(`/api/cleaning/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/cleaning')
      }
    } catch (error) {
      console.error('Error deleting quote:', error)
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
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Quote Details</h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/cleaning/${params.id}/edit`)}
            >
              Edit Quote
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
            >
              Delete Quote
            </Button>
          </div>
        </div>

        <QuoteSummary
          quote={{
            id: quote.id,
            type: 'cleaning',
            status: quote.status,
            createdAt: quote.createdAt,
            propertyType: quote.propertyType,
            cleaningType: quote.cleaningType,
            date: quote.preferredDate,
            time: quote.preferredTime,
            estimatedPrice: quote.estimatedPrice
          }}
        />
      </div>
    </main>
  )
} 