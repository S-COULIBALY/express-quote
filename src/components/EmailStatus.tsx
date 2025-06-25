'use client'

import React from 'react'
import { 
  EnvelopeIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

export interface EmailRecord {
  id: string
  recipient: string
  subject: string
  sentAt: string | Date
  status: 'sent' | 'failed' | 'pending'
  attachments: string[]
  type: 'confirmation' | 'reminder' | 'payment' | 'invoice' | 'receipt' | 'cancellation'
}

interface EmailStatusProps {
  emails: EmailRecord[]
  bookingId?: string
  showResend?: boolean
  onResend?: (emailId: string) => Promise<void>
}

export function EmailStatus({ emails, bookingId, showResend = false, onResend }: EmailStatusProps) {
  // État pour suivre les actions de renvoi en cours
  const [resendingIds, setResendingIds] = React.useState<string[]>([])
  
  // Trier les emails par date d'envoi (plus récent en premier)
  const sortedEmails = [...emails].sort((a, b) => {
    const dateA = new Date(a.sentAt).getTime()
    const dateB = new Date(b.sentAt).getTime()
    return dateB - dateA
  })
  
  // Filtrer par bookingId si spécifié
  const filteredEmails = bookingId 
    ? sortedEmails.filter(email => email.id.includes(bookingId))
    : sortedEmails
  
  const handleResend = async (emailId: string) => {
    if (!onResend) return
    
    try {
      setResendingIds(prev => [...prev, emailId])
      await onResend(emailId)
    } catch (error) {
      console.error('Erreur lors du renvoi de l\'email:', error)
    } finally {
      setResendingIds(prev => prev.filter(id => id !== emailId))
    }
  }
  
  const getEmailTypeLabel = (type: EmailRecord['type']) => {
    const labels = {
      confirmation: 'Confirmation de réservation',
      reminder: 'Rappel de rendez-vous',
      payment: 'Confirmation de paiement',
      invoice: 'Facture',
      receipt: 'Reçu de paiement',
      cancellation: 'Annulation'
    }
    return labels[type] || type
  }
  
  const getEmailTypeIcon = (type: EmailRecord['type']) => {
    switch (type) {
      case 'confirmation':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'reminder':
        return <ClockIcon className="h-5 w-5 text-orange-500" />
      case 'payment':
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />
      case 'invoice':
        return <DocumentTextIcon className="h-5 w-5 text-indigo-500" />
      case 'receipt':
        return <DocumentTextIcon className="h-5 w-5 text-emerald-500" />
      case 'cancellation':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <EnvelopeIcon className="h-5 w-5 text-gray-500" />
    }
  }
  
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (filteredEmails.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
        <EnvelopeIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>Aucun email envoyé pour cette réservation.</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-3 border-b">
        <h3 className="text-base font-medium text-slate-800 flex items-center">
          <EnvelopeIcon className="h-5 w-5 mr-2 text-slate-600" />
          Historique des emails
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {filteredEmails.map((email) => (
          <div key={email.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getEmailTypeIcon(email.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {getEmailTypeLabel(email.type)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    email.status === 'sent' ? 'bg-green-100 text-green-800' :
                    email.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {email.status === 'sent' ? 'Envoyé' : 
                     email.status === 'failed' ? 'Échec' : 'En attente'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">À:</span> {email.recipient}
                </p>
                
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Objet:</span> {email.subject}
                </p>
                
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Date:</span> {formatDate(email.sentAt)}
                </p>
                
                {email.attachments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1 font-medium">Pièces jointes:</p>
                    <div className="flex flex-wrap gap-2">
                      {email.attachments.map((attachment, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800"
                        >
                          <DocumentTextIcon className="h-3 w-3 mr-1" />
                          {attachment}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {showResend && email.status === 'failed' && onResend && (
              <div className="mt-3 text-right">
                <button
                  onClick={() => handleResend(email.id)}
                  disabled={resendingIds.includes(email.id)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {resendingIds.includes(email.id) ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Renvoi en cours...
                    </>
                  ) : (
                    'Renvoyer l\'email'
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 