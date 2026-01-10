'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConsentType } from '@/quotation/domain/enums/ConsentType'

interface WhatsAppOptInConsentProps {
  onOptInChange: (optedIn: boolean) => void
  initialValue?: boolean
  required?: boolean
  color?: 'blue' | 'emerald' | 'green' | 'gray'
  userIdentifier?: string // Email ou téléphone de l'utilisateur, si disponible
}

export function WhatsAppOptInConsent({
  onOptInChange,
  initialValue = false,
  required = false,
  color = 'green',
  userIdentifier
}: WhatsAppOptInConsentProps) {
  const [optedIn, setOptedIn] = useState(initialValue)

  useEffect(() => {
    // If the initial value changes, update the state
    setOptedIn(initialValue)
  }, [initialValue])

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked
    setOptedIn(newValue)
    onOptInChange(newValue)
    
    // Si un identifiant utilisateur est fourni, enregistrer le consentement
    if (userIdentifier) {
      try {
        await fetch('/api/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userIdentifier,
            type: ConsentType.WHATSAPP_MARKETING,
            granted: newValue,
            formPath: window.location.pathname,
            formText: "Formulaire de consentement WhatsApp",
            checkboxText: "J'accepte de recevoir des notifications WhatsApp pour le suivi de mes services",
            sessionId: sessionStorage.getItem('sessionId') || 'unknown',
            formData: { optedIn: newValue },
            version: "1.0"
          }),
        });
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du consentement:', error);
      }
    }
  }

  const linkColorClass = color === 'emerald' 
    ? 'text-emerald-600 hover:text-emerald-700' 
    : color === 'green' 
      ? 'text-green-600 hover:text-green-700' 
      : color === 'gray' 
        ? 'text-gray-600 hover:text-gray-700'
        : 'text-blue-600 hover:text-blue-700'

  return (
    <div className="mt-0 sm:mt-2 w-full">
      <div className="flex items-start space-x-3 w-full">
        <input
          type="checkbox"
          id="whatsapp-opt-in"
          checked={optedIn}
          onChange={handleChange}
          className={`mt-1 flex-shrink-0 ${
            color === 'emerald' ? 'text-emerald-600 focus:ring-emerald-500' : 
            color === 'green' ? 'text-green-600 focus:ring-green-500' : 
            color === 'gray' ? 'text-gray-600 focus:ring-gray-500' :
            'text-blue-600 focus:ring-blue-500'
          } rounded border-gray-300`}
          required={required}
        />
        <div className="flex-1 min-w-0 w-full">
          <label htmlFor="whatsapp-opt-in" className="text-xs sm:text-sm text-gray-600 cursor-pointer block w-full">
            <div className="flex items-start w-full">
              <span className="flex-1 min-w-0 break-words leading-tight">
                J'accepte de recevoir des notifications WhatsApp pour le suivi de mes services
                {required && ' *'}
              </span>
              <svg 
                className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 text-green-600 flex-shrink-0 mt-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" 
                />
              </svg>
            </div>
          </label>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-2 leading-tight sm:leading-relaxed break-words">
            <span className="sm:hidden">
              Mises à jour et notifications via WhatsApp. Désinscription à tout moment. 
              <Link href="/legal/privacy" className={linkColorClass}> En savoir plus</Link>.
            </span>
            <span className="hidden sm:inline">
              Vous pourrez recevoir des mises à jour et notifications concernant votre commande via WhatsApp. 
              Vous pouvez vous désinscrire à tout moment. Pour plus d'informations, consultez notre{' '}
              <Link href="/legal/privacy" className={linkColorClass}>
                politique de confidentialité
              </Link>.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
} 