'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Service } from '@/types/booking'
import {
  CheckBadgeIcon,
  ArrowLeftIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
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
  
  // Accordéons
  const [expandedSections, setExpandedSections] = useState({
    garanties: false,
    prestations: false,
    additionalInfo: false,
    customerInfo: false
  })
  
  // Ajout des états pour le formulaire client
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  
  // État pour suivre les erreurs de validation et les champs touchés
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [touchedFields, setTouchedFields] = useState<{[key: string]: boolean}>({})
  const [showFormError, setShowFormError] = useState(false)
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  
  const handleCustomerInputChange = (field: keyof typeof customerData, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Marquer le champ comme touché
    setTouchedFields(prev => ({
      ...prev,
      [field]: true
    }))
    
    // Valider le champ
    validateField(field, value)
  }
  
  const validateField = (field: keyof typeof customerData, value: string) => {
    let error = ''
    
    if (!value.trim()) {
      error = 'Ce champ est requis'
    } else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = 'Adresse email invalide'
    } else if (field === 'phone' && !/^(\+33|0)[1-9](\d{2}){4}$/.test(value)) {
      error = 'Numéro de téléphone invalide'
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }))
    
    return !error
  }
  
  const validateForm = () => {
    const fields = ['firstName', 'lastName', 'email', 'phone'] as const
    let isValid = true
    const errors: {[key: string]: string} = {}
    
    // Marquer tous les champs comme touchés
    const allTouched = fields.reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {} as {[key: string]: boolean})
    
    setTouchedFields(allTouched)
    
    // Valider chaque champ
    fields.forEach(field => {
      const value = customerData[field]
      console.log(`Validation de ${field}: '${value}'`)
      
      // Vérification spéciale pour l'email
      if (field === 'email' && (!value || !value.trim())) {
        console.error(`Email manquant ou vide: '${value}'`)
        errors[field] = 'L\'adresse email est obligatoire'
        isValid = false
      } else {
        const fieldValid = validateField(field, value)
        if (!fieldValid) {
          isValid = false
          errors[field] = validationErrors[field] || 'Ce champ est requis'
        }
      }
    })
    
    setValidationErrors(errors)
    console.log('Validation du formulaire - isValid:', isValid, 'Erreurs:', errors)
    
    // Si le formulaire est invalide, développer la section
    if (!isValid && !expandedSections.customerInfo) {
      setExpandedSections(prev => ({
        ...prev,
        customerInfo: true
      }))
      
      // Afficher l'alerte d'erreur
      setShowFormError(true)
      
      // Masquer l'alerte après 5 secondes
      setTimeout(() => {
        setShowFormError(false)
      }, 5000)
    }
    
    return isValid
  }
  
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
    // Rediriger vers la page du service avec les données préservées
    if (serviceDetails && quoteDetails) {
      // Stocker les données du devis dans sessionStorage pour les récupérer sur la page du service
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('editQuoteData', JSON.stringify({
          serviceId: serviceDetails.id,
          quoteRequestId: quoteRequestId,
          duration: quoteDetails.duration,
          workers: quoteDetails.workers,
          scheduledDate: quoteDetails.scheduledDate,
          location: quoteDetails.location,
          additionalInfo: quoteDetails.additionalInfo
        }));
      }
      
      // Rediriger vers la page du service
      router.push(`/services/${serviceDetails.id}?edit=true`);
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
  
  const handleConfirmQuote = async () => {
    try {
      // Ajouter un état de chargement
      setSaveStatus('saving')
      
      if (!quoteRequestId) {
        throw new Error('ID de demande de devis manquant')
      }
      
      // Valider le formulaire client
      if (!validateForm()) {
        setSaveStatus('error')
        throw new Error('Veuillez remplir toutes les informations client')
      }
      
      // Formaliser le devis avec les informations client
      const formalizeData = {
        quoteRequestId: quoteRequestId,
        customerDetails: {
          email: customerData.email ? customerData.email.trim() : '',
          phone: customerData.phone ? customerData.phone.trim() : '',
          firstName: customerData.firstName ? customerData.firstName.trim() : '',
          lastName: customerData.lastName ? customerData.lastName.trim() : ''
        },
        hasInsurance: hasInsurance
      }
      
      console.log('Données de formalisation:', formalizeData)
      console.log('customerData:', customerData)
      console.log('Email value:', customerData.email)
      
      // Appeler l'API de formalisation
      const formalizeResponse = await fetch('/api/quotes/formalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formalizeData)
      })
      
      // Log de la réponse brute pour débogage
      console.log('Status code de la réponse:', formalizeResponse.status)
      
      if (!formalizeResponse.ok) {
        const errorData = await formalizeResponse.json()
        console.error('Erreur API détaillée:', errorData)
        throw new Error(`Échec de la formalisation du devis: ${errorData.error || 'Erreur inconnue'}`)
      }
      
      const formalizedQuote = await formalizeResponse.json()
      
      console.log('Devis formalisé avec succès:', formalizedQuote)
      
      // Rediriger vers la page de paiement avec l'ID du devis formalisé
      router.push(`/services/payment?quoteId=${formalizedQuote.id}`)
      
    } catch (error) {
      console.error('Erreur lors de la confirmation du devis:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 2000)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-500 border-t-transparent mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800">Préparation de votre récapitulatif</h3>
          <p className="text-gray-600 text-center mt-2">Nous récupérons les détails de votre devis...</p>
          <div className="w-full bg-gray-200 h-2 rounded-full mt-6 overflow-hidden">
            <div className="bg-emerald-500 h-full animate-pulse" style={{width: '70%'}}></div>
          </div>
        </div>
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href={`/services/${serviceDetails.id}`} className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Retour</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Récapitulatif du devis</h1>
          <p className="text-gray-600 mt-1">Vérifiez les détails ci-dessous avant de confirmer votre devis</p>
        </div>
        
        {/* Mise en page avec largeur complète */}
        <div className="space-y-6">
          {/* Section combinée Service et Coûts */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{serviceDetails.name}</h2>
            <button 
              onClick={handleEditQuote}
                  className="text-white/90 hover:text-white text-sm font-medium transition-colors"
            >
              Modifier
            </button>
              </div>
          </div>
          
            <div className="p-6">
              {/* Informations principales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-emerald-500 mr-3" />
              <div>
                    <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium">
                  {quoteDetails.scheduledDate ? format(new Date(quoteDetails.scheduledDate), 'dd MMMM yyyy', { locale: fr }) : 'Non spécifiée'}
                </p>
              </div>
            </div>
            
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-emerald-500 mr-3" />
              <div>
                    <p className="text-xs text-gray-500">Durée</p>
                    <p className="font-medium">{quoteDetails.duration || serviceDetails.duration}h</p>
              </div>
            </div>
            
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <UserGroupIcon className="h-5 w-5 text-emerald-500 mr-3" />
              <div>
                    <p className="text-xs text-gray-500">Professionnels</p>
                    <p className="font-medium">{quoteDetails.workers || serviceDetails.workers}</p>
              </div>
            </div>
          </div>
          
              {/* Adresse */}
              <div className="flex items-start p-4 bg-blue-50 rounded-lg mb-6">
                <MapPinIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
            <div>
                  <p className="text-sm font-medium text-blue-700">Adresse d'intervention</p>
                  <p className="text-gray-700">{quoteDetails.location || 'Non spécifiée'}</p>
            </div>
          </div>
          
              {/* Informations supplémentaires */}
          {quoteDetails.additionalInfo && (
                <div className="mb-6">
                  <button 
                    className="flex w-full items-center justify-between text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => toggleSection('additionalInfo')}
                  >
                    <span className="font-medium">Informations supplémentaires</span>
                    {expandedSections.additionalInfo ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedSections.additionalInfo && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{quoteDetails.additionalInfo}</p>
            </div>
          )}
                </div>
              )}
              
              {/* Séparateur */}
              <div className="border-t border-gray-200 my-6"></div>
              
              {/* Détail des coûts */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Détail des coûts</h3>
                
                {/* Prix de base */}
                <div className="flex justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div>
                    <p className="font-medium text-gray-900">Prix de base</p>
                    <p className="text-sm text-gray-600">{serviceDetails.name}</p>
                  </div>
                  <span className="font-medium">{serviceDetails.price}€</span>
            </div>
            
                {/* Heures supplémentaires */}
                {quoteDetails.duration > serviceDetails.duration && (
                  <div className="flex justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div>
                      <p className="font-medium text-gray-900">Heures supplémentaires</p>
                      <p className="text-sm text-gray-600">
                        +{quoteDetails.duration - serviceDetails.duration}h
                      </p>
                    </div>
                    <span className="font-medium text-orange-600">
                      +{Math.round((quoteDetails.duration - serviceDetails.duration) * 35 * quoteDetails.workers)}€
                    </span>
                </div>
                )}
                
                {/* Professionnels supplémentaires */}
                {quoteDetails.workers > serviceDetails.workers && (
                  <div className="flex justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div>
                      <p className="font-medium text-gray-900">Professionnels supplémentaires</p>
                      <p className="text-sm text-gray-600">
                        +{quoteDetails.workers - serviceDetails.workers} professionnel(s)
                      </p>
                    </div>
                    <span className="font-medium text-orange-600">
                      +{Math.round((quoteDetails.workers - serviceDetails.workers) * 35 * quoteDetails.duration)}€
                    </span>
                </div>
                )}
                
                {/* Assurance */}
                <div className="mt-4">
                  <label className="flex items-center justify-between p-4 border border-emerald-100 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 transition-all cursor-pointer">
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
                        <p className="text-xs text-gray-600">Protection contre les dommages pendant 30 jours</p>
                </div>
              </div>
              <span className="font-medium">+30€</span>
            </label>
          </div>
          
                {/* Totaux */}
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-600">Sous-total HT</span>
              <span className="font-medium">{totalPriceHT}€</span>
            </div>
                  <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-600">TVA (20%)</span>
              <span className="font-medium">{Math.round((totalPriceHT * 0.2) * 100) / 100}€</span>
            </div>
                  <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200">
              <span>Total TTC</span>
              <span className="text-emerald-600">{Math.round(totalPriceTTC * 100) / 100}€</span>
            </div>
          </div>
              </div>
            </div>
          </div>
          
          {/* Accordéon Prestations incluses */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <button 
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => toggleSection('prestations')}
            >
              <div className="flex items-center">
                <CheckBadgeIcon className="h-5 w-5 text-emerald-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Prestations incluses</h2>
              </div>
              {expandedSections.prestations ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.prestations && (
              <div className="px-4 pb-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckBadgeIcon className="h-4 w-4 text-emerald-500 mr-2 mt-0.5" />
                    <p className="text-sm text-gray-700">Expertise professionnelle qualifiée</p>
                  </div>
                  <div className="flex items-start">
                    <CheckBadgeIcon className="h-4 w-4 text-emerald-500 mr-2 mt-0.5" />
                    <p className="text-sm text-gray-700">Matériel et équipement standard</p>
                  </div>
                  <div className="flex items-start">
                    <CheckBadgeIcon className="h-4 w-4 text-emerald-500 mr-2 mt-0.5" />
                    <p className="text-sm text-gray-700">Frais de déplacement inclus</p>
                  </div>
                  <div className="flex items-start">
                    <CheckBadgeIcon className="h-4 w-4 text-emerald-500 mr-2 mt-0.5" />
                    <p className="text-sm text-gray-700">Garantie de satisfaction 7 jours</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Non inclus</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                    <li>Produits ou matériaux spécifiques non standard</li>
                    <li>Interventions supplémentaires non prévues</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Accordéon Garanties */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <button 
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => toggleSection('garanties')}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Garanties et conditions</h2>
              </div>
              {expandedSections.garanties ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.garanties && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Garantie de service</h3>
                  <p className="text-xs text-gray-600">Tous nos services sont garantis 7 jours.</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Conditions d'annulation</h3>
                  <p className="text-xs text-gray-600">Annulation sans frais jusqu'à 24h avant le rendez-vous.</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Professionnels vérifiés</h3>
                  <p className="text-xs text-gray-600">Tous nos intervenants sont certifiés et assurés.</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Formulaire client discret */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <button 
              className={`w-full flex items-center justify-between p-4 text-left ${showFormError ? 'bg-red-50' : ''}`}
              onClick={() => toggleSection('customerInfo')}
            >
              <div className="flex items-center">
                <UserIcon className={`h-5 w-5 ${showFormError ? 'text-red-500' : 'text-emerald-500'} mr-2`} />
                <h2 className={`text-lg font-semibold ${showFormError ? 'text-red-700' : 'text-gray-900'}`}>
                  Vos coordonnées
                  {showFormError && <span className="ml-2 text-red-600 text-sm font-normal">⚠️ Informations requises</span>}
                </h2>
              </div>
              {expandedSections.customerInfo ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.customerInfo && (
              <div className="px-4 pb-6">
                {showFormError && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-sm text-red-700">
                        Veuillez compléter tous les champs pour finaliser votre devis.
                      </p>
                    </div>
                  </div>
                )}
                
                <form className="space-y-6">
                  {/* Nom et prénom sur la même ligne */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 flex items-center">
                        <UserIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                        Prénom <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={customerData.firstName}
                        onChange={(e) => handleCustomerInputChange('firstName', e.target.value)}
                        className={`block w-full rounded-lg shadow-sm sm:text-sm 
                          ${touchedFields.firstName && validationErrors.firstName 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}`}
                        placeholder="Votre prénom"
                        required
                      />
                      {touchedFields.firstName && validationErrors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 flex items-center">
                        <UserIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                        Nom <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={customerData.lastName}
                        onChange={(e) => handleCustomerInputChange('lastName', e.target.value)}
                        className={`block w-full rounded-lg shadow-sm sm:text-sm 
                          ${touchedFields.lastName && validationErrors.lastName 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}`}
                        placeholder="Votre nom"
                        required
                      />
                      {touchedFields.lastName && validationErrors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Email et téléphone sur la même ligne */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={customerData.email}
                      onChange={(e) => handleCustomerInputChange('email', e.target.value)}
                        className={`block w-full rounded-lg shadow-sm sm:text-sm 
                        ${touchedFields.email && validationErrors.email 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}`}
                        placeholder="votre.email@exemple.com"
                      required
                    />
                    {touchedFields.email && validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>
                  
                    <div className="space-y-1">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Téléphone <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={customerData.phone}
                        placeholder="0612345678"
                      onChange={(e) => handleCustomerInputChange('phone', e.target.value)}
                        className={`block w-full rounded-lg shadow-sm sm:text-sm 
                        ${touchedFields.phone && validationErrors.phone 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'}`}
                      required
                    />
                    {touchedFields.phone && validationErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Format: 0612345678 ou +33612345678</p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="text-red-500 mr-1">*</span>
                        Champs obligatoires pour finaliser votre demande de devis
                    </p>
                    </div>
                  </div>
                </form>
              </div>
            )}
        </div>
        
        {/* Boutons d'action */}
          <div className="flex justify-between items-center mt-8 p-4 bg-white rounded-xl shadow-md border border-gray-100">
            <div>
              <p className="text-gray-600 text-sm">Total TTC</p>
              <p className="text-2xl font-bold text-emerald-600">{Math.round(totalPriceTTC * 100) / 100}€</p>
            </div>
            
            <div className="flex gap-3">
          <button
            onClick={handleEditQuote}
                className="px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Modifier
          </button>
          <button
                onClick={handleConfirmQuote}
            disabled={saveStatus === 'saving'}
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
                {saveStatus === 'saving' ? 'Traitement...' : 'Confirmer le devis'}
          </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 