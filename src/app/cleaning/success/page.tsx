'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface CleaningQuote {
  id: string
  propertyType: string
  cleaningType: string
  preferredDate: string
  preferredTime: string
  status: string
  estimatedPrice: number
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('id')
  const [quoteData, setQuoteData] = useState<CleaningQuote | null>(null)

  useEffect(() => {
    if (quoteId) {
      fetch(`/api/cleaning/${quoteId}`)
        .then(res => res.json())
        .then(data => setQuoteData(data))
        .catch(err => console.error('Error fetching quote:', err))
    }
  }, [quoteId])

  return (
    <main className="p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <svg
            className="w-16 h-16 text-green-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for choosing our cleaning service.
          </p>
        </div>

        {quoteData && (
          <div className="bg-white shadow rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold mb-4">Cleaning Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-gray-500">Service Type</dt>
                <dd className="font-medium">{quoteData.cleaningType}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Property Type</dt>
                <dd className="font-medium">{quoteData.propertyType}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Date</dt>
                <dd className="font-medium">{quoteData.preferredDate}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Time</dt>
                <dd className="font-medium">{quoteData.preferredTime}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <ul className="text-left space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              A confirmation email has been sent to your inbox
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Your quote details and receipt are attached as PDF
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Our team will contact you shortly to confirm the details
            </li>
          </ul>
        </div>

        <div className="space-x-4">
          <Link
            href="/cleaning"
            className="inline-block px-6 py-2 border rounded hover:bg-gray-100"
          >
            View All Quotes
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  )
} 