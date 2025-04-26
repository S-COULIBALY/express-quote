'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Service } from '@/types/booking'
import { CheckBadgeIcon, ArrowLeftIcon, MapPinIcon, UserGroupIcon, ClockIcon, CalendarIcon, UserIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ServiceSummaryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quoteRequestId = searchParams.get('quoteRequestId')
  
  const [quoteDetails, setQuoteDetails] = useState<any>(null)
  const [serviceDetails, setServiceDetails] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null)
  const [totalPriceHT, setTotalPriceHT] = useState(0)
  const [totalPriceTTC, setTotalPriceTTC] = useState(0)
  const [hasInsurance, setHasInsurance] = useState(false)
  
  // Informations client
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  
  // Validation des champs client
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Récupérer les détails de la demande de devis
  useEffect(() => {
    const loadQuoteRequestData = async () => {
      try {
        setIsLoading(true)
        
        // Récupérer l'ID depuis les paramètres d'URL ou sessionStorage si manquant
        let requestId = quoteRequestId;
        
        if (!requestId) {
          console.warn('ID de demande de devis manquant dans l\'URL, vérification dans sessionStorage...');
          
          // S'assurer que le code s'exécute côté client
          if (typeof window !== 'undefined') {
            try {
              const storedId = window.sessionStorage.getItem('pendingQuoteRequestId');
              
              if (storedId) {
                console.log('ID récupéré depuis sessionStorage:', storedId);
                requestId = storedId;
                
                // Mettre à jour l'URL pour inclure l'ID
                const url = new URL(window.location.href);
                url.searchParams.set('quoteRequestId', storedId);
                
                // Mettre à jour l'URL sans recharger la page
                window.history.replaceState({}, '', url.toString());
                
                // Nettoyer sessionStorage après utilisation
                window.sessionStorage.removeItem('pendingQuoteRequestId');
                console.log('✅ ID ajouté à l\'URL et supprimé de sessionStorage');
              } else {
                console.warn('❌ Aucun ID trouvé dans sessionStorage');
              }
            } catch (storageError) {
              console.error('❌ Erreur lors de l\'accès à sessionStorage:', storageError);
            }
          } else {
            console.warn('⚠️ window non disponible (exécution côté serveur)');
          }
        }
        
        if (!requestId) {
          console.error('❌ ID de demande de devis manquant dans l\'URL et sessionStorage');
          setLoadError('ID de demande de devis manquant dans l\'URL');
          setIsLoading(false);
          return;
        }
        
        console.log('🔍 Chargement des données pour la demande:', requestId);
        
        // Récupérer les détails de la demande de devis
        const response = await fetch(`/api/quotes/${requestId}`, {
          method: 'GET',
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        })
        
        if (!response.ok) {
          console.error('Erreur lors de la récupération de la demande de devis:', response.status)
          setLoadError(`Erreur lors de la récupération de la demande de devis (${response.status})`);
          setIsLoading(false);
          return;
        }
        
        const quoteData = await response.json()
        
        if (!quoteData) {
          console.error('Demande de devis invalide ou sans détails')
          setLoadError('Demande de devis invalide ou sans détails');
          setIsLoading(false);
          return;
        }
        
        console.log('Données de demande de devis récupérées:', quoteData)
        
        setQuoteDetails(quoteData)
        
        // Récupérer les détails du service associé
        if (quoteData.serviceId) {
          const serviceResponse = await fetch(`/api/services/${quoteData.serviceId}`)
          if (serviceResponse.ok) {
            const serviceData = await serviceResponse.json()
            setServiceDetails(serviceData)
          } else {
            console.warn('⚠️ Impossible de récupérer les détails du service');
          }
        }
        
        // Mise à jour avec les totaux de la demande de devis
        setTotalPriceHT(quoteData.calculatedPrice || 0)
        setTotalPriceTTC((quoteData.calculatedPrice || 0) * 1.2) // Estimation TTC (20% TVA)
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        setLoadError(error instanceof Error ? error.message : 'Erreur inconnue lors du chargement des données');
      } finally {
        setIsLoading(false)
      }
    }
    
    loadQuoteRequestData()
  }, [quoteRequestId, router])
  
  const handleEditQuote = () => {
    // Retourner à la page du service pour modifications
    if (serviceDetails) {
      router.push(`/services/${serviceDetails.id}`)
    }
  }
  
  const handleInsuranceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked
    setHasInsurance(isChecked)
    
    // Mettre à jour le prix total avec ou sans assurance
    setSaveStatus('saving')
    
    try {
      // Mise à jour locale du prix pour l'instant (sera intégré lors de la formalisation)
      const insurancePrice = 30 // Prix de l'assurance en euros
      const newTotalHT = isChecked ? totalPriceHT + insurancePrice : totalPriceHT - insurancePrice
      
      setTotalPriceHT(newTotalHT)
      setTotalPriceTTC(newTotalHT * 1.2)
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'assurance:', error)
      setSaveStatus('error')
      // Réinitialiser l'état du checkbox
      setHasInsurance(!isChecked)
    }
  }
  
  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setCustomerInfo(prev => ({
      ...prev,
      [id]: value
    }))
    
    // Effacer les erreurs de validation lorsque l'utilisateur modifie le champ
    if (validationErrors[id]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[id]
        return newErrors
      })
    }
  }
  
  const validateCustomerInfo = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!customerInfo.firstName.trim()) {
      errors.firstName = 'Le prénom est requis'
    }
    
    if (!customerInfo.lastName.trim()) {
      errors.lastName = 'Le nom est requis'
    }
    
    if (!customerInfo.email.trim()) {
      errors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      errors.email = 'Format d\'email invalide'
    }
    
    if (!customerInfo.phone.trim()) {
      errors.phone = 'Le téléphone est requis'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleContinue = async () => {
    // Formaliser le devis avec les informations client
    if (!validateCustomerInfo()) {
      return
    }
    
    try {
      // Ajouter un état de chargement
      setSaveStatus('saving')
      
      if (!quoteRequestId) {
        throw new Error('ID de demande de devis manquant')
      }
      
      const formalizeData = {
        quoteRequestId: quoteRequestId,
        customerDetails: customerInfo,
        hasInsurance: hasInsurance
      }
      
      // Formaliser le devis via l'API
      const formalizeResponse = await fetch('/api/quotes/formalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formalizeData)
      })
      
      if (!formalizeResponse.ok) {
        const errorData = await formalizeResponse.json()
        throw new Error(`Échec de la formalisation du devis: ${errorData.error || 'Erreur inconnue'}`)
      }
      
      const formalizedQuote = await formalizeResponse.json()
      
      console.log('Devis formalisé avec succès:', formalizedQuote)
      
      // Rediriger vers la page de paiement avec l'ID du devis
      router.push(`/services/payment?quoteId=${formalizedQuote.id}`)
      
    } catch (error) {
      console.error('Erreur lors de la formalisation du devis:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 2000)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }
  
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
            <p className="text-gray-600 mb-6">{loadError}</p>
            <Link
              href="/services"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Retourner aux services
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  if (!quoteDetails || !serviceDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Devis introuvable</h1>
            <p className="text-gray-600 mb-6">Nous n'avons pas trouvé la demande de devis correspondante.</p>
            <Link
              href="/services"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Voir les services disponibles
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`/services/${serviceDetails.id}`} className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Retour</span>
          </Link>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Récapitulatif de votre commande</h1>
          
          {saveStatus === 'saving' && (
            <div className="text-gray-500 text-sm flex items-center bg-gray-50 px-3 py-1 rounded-full">
              <span className="mr-2">Enregistrement</span>
              <div className="animate-spin h-4 w-4 border-2 border-t-emerald-500 border-emerald-200 rounded-full"></div>
            </div>
          )}
          
          {saveStatus === 'saved' && (
            <div className="text-emerald-700 text-sm flex items-center bg-emerald-50 px-3 py-1 rounded-full">
              <CheckBadgeIcon className="h-4 w-4 mr-1" />
              <span>Modifications enregistrées</span>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="text-red-700 text-sm flex items-center bg-red-50 px-3 py-1 rounded-full">
              <span>Erreur</span>
            </div>
          )}
        </div>
        
        {/* Carte récapitulative du service */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{serviceDetails.name}</h2>
              <p className="text-gray-600 mt-1">{serviceDetails.description}</p>
            </div>
            <button 
              onClick={handleEditQuote}
              className="text-emerald-600 text-sm font-medium hover:text-emerald-800"
            >
              Modifier
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">
                  {quoteDetails.scheduledDate ? format(new Date(quoteDetails.scheduledDate), 'dd MMMM yyyy', { locale: fr }) : 'Non spécifiée'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Durée</p>
                <p className="font-medium">{quoteDetails.duration || serviceDetails.duration} heure(s)</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Professionnels</p>
                <p className="font-medium">{quoteDetails.workers || serviceDetails.workers} personne(s)</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-start mb-6">
            <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Adresse</p>
              <p className="font-medium">{quoteDetails.location || 'Non spécifiée'}</p>
            </div>
          </div>
          
          {quoteDetails.additionalInfo && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Informations supplémentaires</h3>
              <p className="text-gray-700">{quoteDetails.additionalInfo}</p>
            </div>
          )}
        </div>
        
        {/* Formulaire d'informations client */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Vos informations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                  Prénom
                </div>
              </label>
              <input
                type="text"
                id="firstName"
                value={customerInfo.firstName}
                onChange={handleCustomerInfoChange}
                className={`block w-full rounded-xl border-2 ${validationErrors.firstName ? 'border-red-300' : 'border-gray-200'} bg-white shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400`}
                placeholder="Votre prénom"
              />
              {validationErrors.firstName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                  Nom
                </div>
              </label>
              <input
                type="text"
                id="lastName"
                value={customerInfo.lastName}
                onChange={handleCustomerInfoChange}
                className={`block w-full rounded-xl border-2 ${validationErrors.lastName ? 'border-red-300' : 'border-gray-200'} bg-white shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400`}
                placeholder="Votre nom"
              />
              {validationErrors.lastName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                  Email
                </div>
              </label>
              <input
                type="email"
                id="email"
                value={customerInfo.email}
                onChange={handleCustomerInfoChange}
                className={`block w-full rounded-xl border-2 ${validationErrors.email ? 'border-red-300' : 'border-gray-200'} bg-white shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400`}
                placeholder="votre.email@exemple.com"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                  Téléphone
                </div>
              </label>
              <input
                type="tel"
                id="phone"
                value={customerInfo.phone}
                onChange={handleCustomerInfoChange}
                className={`block w-full rounded-xl border-2 ${validationErrors.phone ? 'border-red-300' : 'border-gray-200'} bg-white shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all duration-200 px-3 py-2 text-gray-700 placeholder-gray-400`}
                placeholder="06 12 34 56 78"
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Section prix et assurance */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Options et prix</h2>
          
          <div className="mb-4">
            <label className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-lg">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="insurance"
                  checked={hasInsurance}
                  onChange={handleInsuranceChange}
                  className="w-4 h-4 text-emerald-600 border-2 border-gray-300 rounded focus:ring-emerald-500"
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-900">Assurance intervention</span>
                  <p className="text-sm text-gray-600">Protection contre les dommages imprévus</p>
                </div>
              </div>
              <span className="font-medium">+30€</span>
            </label>
          </div>
          
          <div className="border-t border-gray-200 pt-4 my-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Sous-total HT</span>
              <span className="font-medium">{totalPriceHT}€</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">TVA (20%)</span>
              <span className="font-medium">{Math.round((totalPriceHT * 0.2) * 100) / 100}€</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-100">
              <span>Total TTC</span>
              <span className="text-emerald-600">{Math.round(totalPriceTTC * 100) / 100}€</span>
            </div>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleEditQuote}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Modifier
          </button>
          <button
            onClick={handleContinue}
            disabled={saveStatus === 'saving'}
            className="px-6 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === 'saving' ? 'Traitement...' : 'Procéder au paiement'}
          </button>
        </div>
      </div>
    </div>
  )
} 