'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('id')
  const [_quoteData, setQuoteData] = useState(null)

  useEffect(() => {
    if (quoteId) {
      // Fetch final quote data
      fetch(`/api/moving/${quoteId}`)
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
          <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
          <p className="text-gray-600">
            Thank you for your payment. Your moving service is now confirmed.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <ul className="text-left space-y-2">
            <li>✓ A confirmation email has been sent to your inbox</li>
            <li>✓ Your quote details and receipt are attached as PDF</li>
            <li>✓ Our team will contact you shortly to confirm the details</li>
          </ul>
        </div>

        <div className="space-x-4">
          <Link
            href="/moving"
            className="inline-block px-6 py-2 border rounded hover:bg-gray-100"
          >
            View All Quotes
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  )
} 