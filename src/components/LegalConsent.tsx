'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface LegalConsentProps {
  onAcceptChange: (accepted: boolean) => void
  initialValue?: boolean
  required?: boolean
  color?: 'blue' | 'emerald' | 'green'
  dataProtection?: boolean
  termsAndConditions?: boolean
  cookiesPolicy?: boolean
  showAllPolicies?: boolean
}

export function LegalConsent({
  onAcceptChange,
  initialValue = false,
  required = true,
  color = 'blue',
  dataProtection = true,
  termsAndConditions = true,
  cookiesPolicy = false,
  showAllPolicies = false
}: LegalConsentProps) {
  const [accepted, setAccepted] = useState(initialValue)

  useEffect(() => {
    setAccepted(initialValue)
  }, [initialValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked
    setAccepted(newValue)
    onAcceptChange(newValue)
  }

  // Définir la couleur des liens selon la propriété color
  const linkColorClass = 
    color === 'emerald' ? 'text-emerald-600 hover:text-emerald-800' : 
    color === 'green' ? 'text-green-600 hover:text-green-800' : 
    'text-blue-600 hover:text-blue-800'

  return (
    <div className="flex items-start mt-4">
      <input
        type="checkbox"
        id="legal-consent"
        checked={accepted}
        onChange={handleChange}
        className={`mt-1 mr-2 ${
          color === 'emerald' ? 'text-emerald-600 focus:ring-emerald-500' : 
          color === 'green' ? 'text-green-600 focus:ring-green-500' : 
          'text-blue-600 focus:ring-blue-500'
        } rounded border-gray-300`}
        required={required}
      />
      <label htmlFor="legal-consent" className="text-sm text-gray-600">
        J'accepte {' '}
        {termsAndConditions && (
          <>
            les <Link href="/legal/terms" className={linkColorClass}>conditions générales</Link>
          </>
        )}
        {termsAndConditions && dataProtection && ' et '}
        {dataProtection && (
          <>
            la <Link href="/legal/privacy" className={linkColorClass}>politique de confidentialité</Link>
          </>
        )}
        {(termsAndConditions || dataProtection) && cookiesPolicy && ' ainsi que '}
        {cookiesPolicy && (
          <>
            la <Link href="/legal/cookies" className={linkColorClass}>politique des cookies</Link>
          </>
        )}
        {showAllPolicies && !cookiesPolicy && ' et '}
        {showAllPolicies && (
          <>
            les <Link href="/legal" className={linkColorClass}>mentions légales</Link>
          </>
        )}
        {required && ' *'}
      </label>
    </div>
  )
} 