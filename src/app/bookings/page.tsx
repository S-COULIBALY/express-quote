'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookingStatus } from '@/quotation/domain/enums/BookingStatus'

// Statuts de paiement
enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

interface Booking {
  id: string
  type: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  customer: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  depositRate: number
  createdAt: string
  scheduledDate?: string
  pickupAddress?: string
  deliveryAddress?: string
}

// Données fictives pour la démonstration
const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BKG-2023-001',
    type: 'PACK',
    status: BookingStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PARTIAL,
    customer: {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '+33 6 12 34 56 78'
    },
    totalAmount: 450,
    paidAmount: 135,
    remainingAmount: 315,
    depositRate: 30,
    createdAt: '2023-10-15T14:30:00Z',
    scheduledDate: '2023-11-10T09:00:00Z',
    deliveryAddress: '123 Rue de Paris, 75001 Paris'
  },
  {
    id: 'BKG-2023-002',
    type: 'SERVICE',
    status: BookingStatus.PAYMENT_COMPLETED,
    paymentStatus: PaymentStatus.COMPLETED,
    customer: {
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@example.com'
    },
    totalAmount: 120,
    paidAmount: 120,
    remainingAmount: 0,
    depositRate: 100,
    createdAt: '2023-10-18T09:15:00Z',
    scheduledDate: '2023-10-25T14:00:00Z',
    deliveryAddress: '45 Avenue Victor Hugo, 69002 Lyon'
  },
  {
    id: 'BKG-2023-003',
    type: 'MOVING_QUOTE',
    status: BookingStatus.PAYMENT_PROCESSING,
    paymentStatus: PaymentStatus.PENDING,
    customer: {
      firstName: 'Pierre',
      lastName: 'Leblanc',
      email: 'pierre.leblanc@example.com',
      phone: '+33 7 98 76 54 32'
    },
    totalAmount: 1200,
    paidAmount: 0,
    remainingAmount: 1200,
    depositRate: 30,
    createdAt: '2023-10-20T11:45:00Z',
    scheduledDate: '2023-11-15T08:00:00Z',
    pickupAddress: '78 Boulevard Saint-Michel, 75006 Paris',
    deliveryAddress: '22 Rue de la Paix, 44000 Nantes'
  },
  {
    id: 'BKG-2023-004',
    type: 'PACK',
    status: BookingStatus.CANCELED,
    paymentStatus: PaymentStatus.REFUNDED,
    customer: {
      firstName: 'Sophie',
      lastName: 'Petit',
      email: 'sophie.petit@example.com'
    },
    totalAmount: 350,
    paidAmount: 0,
    remainingAmount: 0,
    depositRate: 30,
    createdAt: '2023-10-05T16:20:00Z',
    scheduledDate: '2023-10-30T10:00:00Z',
    deliveryAddress: '15 Rue des Fleurs, 33000 Bordeaux'
  },
  {
    id: 'BKG-2023-005',
    type: 'SERVICE',
    status: BookingStatus.DRAFT,
    paymentStatus: PaymentStatus.PENDING,
    customer: {
      firstName: 'Lucas',
      lastName: 'Moreau',
      email: 'lucas.moreau@example.com',
      phone: '+33 6 55 44 33 22'
    },
    totalAmount: 85,
    paidAmount: 0,
    remainingAmount: 85,
    depositRate: 30,
    createdAt: '2023-10-22T10:00:00Z',
    scheduledDate: '2023-11-05T13:00:00Z',
    deliveryAddress: '8 Place Bellecour, 69002 Lyon'
  },
  {
    id: 'BKG-2023-006',
    type: 'MOVING_QUOTE',
    status: BookingStatus.PAYMENT_FAILED,
    paymentStatus: PaymentStatus.FAILED,
    customer: {
      firstName: 'Emma',
      lastName: 'Richard',
      email: 'emma.richard@example.com'
    },
    totalAmount: 850,
    paidAmount: 0,
    remainingAmount: 850,
    depositRate: 30,
    createdAt: '2023-10-19T09:30:00Z',
    scheduledDate: '2023-11-12T08:30:00Z',
    pickupAddress: '35 Rue de la République, 13001 Marseille',
    deliveryAddress: '12 Avenue Jean Jaurès, 13002 Marseille'
  }
];

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    // Simuler un chargement depuis l'API
    const fetchBookings = async () => {
      try {
        // Attendre un peu pour simuler un chargement
        await new Promise(resolve => setTimeout(resolve, 800))
        setBookings(MOCK_BOOKINGS)
        setFilteredBookings(MOCK_BOOKINGS)
      } catch (err) {
        setError('Une erreur est survenue lors du chargement des réservations')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  // Filtrer les réservations quand les filtres changent
  useEffect(() => {
    let result = [...bookings]
    
    // Filtrer par statut
    if (statusFilter !== 'all') {
      result = result.filter(booking => booking.status === statusFilter)
    }
    
    // Filtrer par statut de paiement
    if (paymentFilter !== 'all') {
      result = result.filter(booking => booking.paymentStatus === paymentFilter)
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(booking => 
        booking.id.toLowerCase().includes(query) ||
        booking.customer.firstName.toLowerCase().includes(query) ||
        booking.customer.lastName.toLowerCase().includes(query) ||
        booking.customer.email.toLowerCase().includes(query) ||
        (booking.deliveryAddress && booking.deliveryAddress.toLowerCase().includes(query))
      )
    }
    
    setFilteredBookings(result)
  }, [bookings, statusFilter, paymentFilter, searchQuery])

  // Fonction pour obtenir la classe CSS selon le statut
  const getStatusClass = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800'
      case BookingStatus.PAYMENT_COMPLETED:
        return 'bg-green-100 text-green-800'
      case BookingStatus.PAYMENT_PROCESSING:
        return 'bg-yellow-100 text-yellow-800'
      case BookingStatus.PAYMENT_FAILED:
        return 'bg-red-100 text-red-800'
      case BookingStatus.CANCELED:
        return 'bg-gray-100 text-gray-800'
      case BookingStatus.DRAFT:
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Fonction pour obtenir la classe CSS selon le statut de paiement
  const getPaymentStatusClass = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'bg-green-100 text-green-800'
      case PaymentStatus.PARTIAL:
        return 'bg-blue-100 text-blue-800'
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case PaymentStatus.FAILED:
        return 'bg-red-100 text-red-800'
      case PaymentStatus.REFUNDED:
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Fonction pour formater le type de réservation
  const formatBookingType = (type: string) => {
    switch (type) {
      case 'PACK': 
        return 'Pack'
      case 'SERVICE': 
        return 'Service'
      case 'MOVING_QUOTE': 
        return 'Déménagement'
      default: 
        return type
    }
  }

  // Fonction pour afficher le statut complet
  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'Confirmée'
      case BookingStatus.PAYMENT_COMPLETED:
        return 'Payée'
      case BookingStatus.PAYMENT_PROCESSING:
        return 'En cours de paiement'
      case BookingStatus.PAYMENT_FAILED:
        return 'Échec de paiement'
      case BookingStatus.CANCELED:
        return 'Annulée'
      case BookingStatus.DRAFT:
        return 'Brouillon'
      default:
        return status
    }
  }

  // Fonction pour afficher le statut de paiement complet
  const getPaymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'Payé'
      case PaymentStatus.PARTIAL:
        return 'Acompte versé'
      case PaymentStatus.PENDING:
        return 'En attente'
      case PaymentStatus.FAILED:
        return 'Échec'
      case PaymentStatus.REFUNDED:
        return 'Remboursé'
      default:
        return status
    }
  }

  // Navigation vers les détails d'une réservation
  const viewBookingDetails = (id: string) => {
    router.push(`/bookings/${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des réservations...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord des réservations</h1>
            <p className="mt-2 text-sm text-gray-700">
              Suivez vos réservations et leurs statuts de paiement
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => router.push('/services')}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:w-auto"
            >
              Nouvelle réservation
            </button>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                Statut de réservation
              </label>
              <select
                id="status-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value={BookingStatus.CONFIRMED}>Confirmée</option>
                <option value={BookingStatus.PAYMENT_COMPLETED}>Payée</option>
                <option value={BookingStatus.PAYMENT_PROCESSING}>En cours de paiement</option>
                <option value={BookingStatus.PAYMENT_FAILED}>Échec de paiement</option>
                <option value={BookingStatus.CANCELED}>Annulée</option>
                <option value={BookingStatus.DRAFT}>Brouillon</option>
              </select>
            </div>

            <div>
              <label htmlFor="payment-filter" className="block text-sm font-medium text-gray-700">
                Statut de paiement
              </label>
              <select
                id="payment-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">Tous les paiements</option>
                <option value={PaymentStatus.COMPLETED}>Payé</option>
                <option value={PaymentStatus.PARTIAL}>Acompte versé</option>
                <option value={PaymentStatus.PENDING}>En attente</option>
                <option value={PaymentStatus.FAILED}>Échec</option>
                <option value={PaymentStatus.REFUNDED}>Remboursé</option>
              </select>
            </div>

            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Recherche
              </label>
              <input
                type="text"
                id="search"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                placeholder="Rechercher par ID, client, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-emerald-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total réservations
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {bookings.length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Paiements complétés
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {bookings.filter(b => b.paymentStatus === PaymentStatus.COMPLETED).length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Chiffre d'affaires
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {bookings.reduce((sum, booking) => sum + booking.paidAmount, 0)} €
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      En attente de paiement
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {bookings.filter(b => b.paymentStatus === PaymentStatus.PENDING || b.paymentStatus === PaymentStatus.PARTIAL).length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des réservations */}
        <div className="mt-6">
          <div className="flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Référence
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Type
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Statut
                      </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Paiement
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Client
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Montant
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Date prévue
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {booking.id}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {formatBookingType(booking.type)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(booking.status)}`}>
                                {getStatusLabel(booking.status)}
                              </span>
                        </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusClass(booking.paymentStatus)}`}>
                                {getPaymentStatusLabel(booking.paymentStatus)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <div className="font-medium">{booking.customer.firstName} {booking.customer.lastName}</div>
                              <div className="text-xs text-gray-400">{booking.customer.email}</div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <div className="text-gray-900 font-medium">{booking.paidAmount} € / {booking.totalAmount} €</div>
                              <div className="text-xs text-gray-500">
                                {booking.paymentStatus === PaymentStatus.PARTIAL ? 
                                  `Acompte ${booking.depositRate}% versé` : 
                                  booking.paymentStatus === PaymentStatus.COMPLETED ? 
                                  'Payé intégralement' : 
                                  `Acompte ${booking.depositRate}% requis`
                                }
                              </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {booking.scheduledDate ? 
                                new Date(booking.scheduledDate).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                }) : 
                                'Non planifiée'
                              }
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <button 
                                type="button"
                                onClick={() => viewBookingDetails(booking.id)}
                                className="text-emerald-600 hover:text-emerald-900 mr-4"
                              >
                                Détails
                              </button>
                              {(booking.paymentStatus === PaymentStatus.PENDING || booking.paymentStatus === PaymentStatus.PARTIAL) && (
                                <button 
                                  type="button"
                                  onClick={() => router.push(`/bookings/${booking.id}/payment`)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Payer
                                </button>
                              )}
                        </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-500">
                            <p>Aucune réservation ne correspond aux critères de recherche</p>
                        </td>
                      </tr>
                      )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Légende des statuts */}
        <div className="mt-6 bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Légende des statuts</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-100 mr-2"></span>
              <span className="text-xs text-gray-700">Confirmée</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-green-100 mr-2"></span>
              <span className="text-xs text-gray-700">Payée</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-100 mr-2"></span>
              <span className="text-xs text-gray-700">En cours de paiement</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-red-100 mr-2"></span>
              <span className="text-xs text-gray-700">Échec de paiement</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-gray-100 mr-2"></span>
              <span className="text-xs text-gray-700">Annulée</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-purple-100 mr-2"></span>
              <span className="text-xs text-gray-700">Brouillon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 