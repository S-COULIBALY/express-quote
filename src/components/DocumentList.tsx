'use client'

import React from 'react'
import { 
  DocumentTextIcon, 
  CloudArrowDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'

export interface Document {
  id: string
  type: 'quote' | 'booking' | 'invoice' | 'receipt' | 'reminder'
  name: string
  createdAt: string | Date
  url: string
  status: 'available' | 'pending' | 'error'
}

interface DocumentListProps {
  documents: Document[]
  onPrint?: (document: Document) => void
  onDownload?: (document: Document) => void
}

export function DocumentList({ documents, onPrint, onDownload }: DocumentListProps) {
  // Trier les documents par date (plus récent en premier)
  const sortedDocuments = [...documents].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })
  
  const getDocumentTypeLabel = (type: Document['type']) => {
    const labels = {
      quote: 'Devis',
      booking: 'Confirmation de réservation',
      invoice: 'Facture',
      receipt: 'Reçu de paiement',
      reminder: 'Rappel de rendez-vous'
    }
    return labels[type] || type
  }
  
  const getDocumentTypeIcon = (type: Document['type']) => {
    const commonClasses = "h-8 w-8"
    
    switch (type) {
      case 'quote':
        return <DocumentTextIcon className={`${commonClasses} text-blue-500`} />
      case 'booking':
        return <DocumentTextIcon className={`${commonClasses} text-green-500`} />
      case 'invoice':
        return <DocumentTextIcon className={`${commonClasses} text-purple-500`} />
      case 'receipt':
        return <DocumentTextIcon className={`${commonClasses} text-emerald-500`} />
      case 'reminder':
        return <DocumentTextIcon className={`${commonClasses} text-orange-500`} />
      default:
        return <DocumentTextIcon className={`${commonClasses} text-gray-500`} />
    }
  }
  
  const formatDate = (date: string | Date) => {
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  
  if (documents.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">Aucun document</h3>
        <p className="text-sm text-gray-500">
          Les documents liés à cette réservation apparaîtront ici
        </p>
      </div>
    )
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b px-4 py-4">
        <h2 className="text-lg font-medium text-gray-900">Documents</h2>
      </div>
      
      <div className="grid gap-4 p-4 md:grid-cols-2">
        {sortedDocuments.map((doc) => (
          <div 
            key={doc.id}
            className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-medium text-gray-900">
                {getDocumentTypeLabel(doc.type)}
              </h3>
              
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                doc.status === 'available' ? 'bg-green-100 text-green-800' :
                doc.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {doc.status === 'available' ? 
                  <CheckCircleIcon className="mr-1 h-3 w-3" /> :
                  doc.status === 'error' ? 
                  <ExclamationCircleIcon className="mr-1 h-3 w-3" /> :
                  null
                }
                {doc.status === 'available' ? 'Disponible' : 
                 doc.status === 'error' ? 'Erreur' : 'En cours'}
              </span>
            </div>
            
            <div className="p-4 flex items-center">
              <div className="flex-shrink-0 mr-4">
                {getDocumentTypeIcon(doc.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.name}
                </p>
                <p className="text-sm text-gray-500">
                  Généré le {formatDate(doc.createdAt)}
                </p>
              </div>
              
              {doc.status === 'available' && (
                <div className="flex items-center space-x-2 ml-4">
                  {onPrint && (
                    <button
                      onClick={() => onPrint(doc)}
                      className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      title="Imprimer"
                    >
                      <PrinterIcon className="h-5 w-5" />
                    </button>
                  )}
                  
                  {onDownload && (
                    <button
                      onClick={() => onDownload(doc)}
                      className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      title="Télécharger"
                    >
                      <CloudArrowDownIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 