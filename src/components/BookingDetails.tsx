import { BookingData } from '@/services/bookingService'
import { formatDate, formatPrice } from '@/utils/formatters'

interface BookingDetailsProps {
  booking: BookingData
  showActions?: boolean
  onEdit?: () => void
  onCancel?: () => void
}

export function BookingDetails({ booking, showActions = false, onEdit, onCancel }: BookingDetailsProps) {
  const renderMovingDetails = () => {
    if (booking.type !== 'MOVING_QUOTE') return null

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Adresse de départ</h3>
            <p className="mt-1 text-sm text-gray-900">{booking.pickupAddress}</p>
            {booking.pickupFloor && (
              <p className="mt-1 text-sm text-gray-500">
                Étage: {booking.pickupFloor} | 
                Ascenseur: {booking.pickupElevator ? 'Oui' : 'Non'}
              </p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Adresse d'arrivée</h3>
            <p className="mt-1 text-sm text-gray-900">{booking.deliveryAddress}</p>
            {booking.deliveryFloor && (
              <p className="mt-1 text-sm text-gray-500">
                Étage: {booking.deliveryFloor} | 
                Ascenseur: {booking.deliveryElevator ? 'Oui' : 'Non'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {booking.moveDate && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date de déménagement</h3>
              <p className="mt-1 text-sm text-gray-900">{formatDate(booking.moveDate)}</p>
            </div>
          )}
          {booking.volume && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Volume</h3>
              <p className="mt-1 text-sm text-gray-900">{booking.volume} m³</p>
            </div>
          )}
          {booking.distance && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Distance</h3>
              <p className="mt-1 text-sm text-gray-900">{booking.distance} km</p>
            </div>
          )}
          {booking.propertyType && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Type de bien</h3>
              <p className="mt-1 text-sm text-gray-900">{booking.propertyType}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderPackDetails = () => {
    if (booking.type !== 'PACK') return null

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Pack choisi</h3>
          <p className="mt-1 text-sm text-gray-900">{booking.packName}</p>
        </div>
        {booking.scheduledDate && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Date prévue</h3>
            <p className="mt-1 text-sm text-gray-900">{formatDate(booking.scheduledDate)}</p>
          </div>
        )}
      </div>
    )
  }

  const renderServiceDetails = () => {
    if (booking.type !== 'SERVICE') return null

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Service</h3>
          <p className="mt-1 text-sm text-gray-900">{booking.serviceName}</p>
        </div>
        {booking.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-sm text-gray-900">{booking.description}</p>
          </div>
        )}
        {booking.scheduledDate && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Date prévue</h3>
            <p className="mt-1 text-sm text-gray-900">{formatDate(booking.scheduledDate)}</p>
          </div>
        )}
        {booking.scheduledTime && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Heure prévue</h3>
            <p className="mt-1 text-sm text-gray-900">{booking.scheduledTime}</p>
          </div>
        )}
        {booking.location && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Lieu</h3>
            <p className="mt-1 text-sm text-gray-900">{booking.location}</p>
          </div>
        )}
      </div>
    )
  }

  const renderOptions = () => {
    const options = [
      { key: 'packagingOption', label: 'Emballage professionnel' },
      { key: 'furnitureOption', label: 'Montage meubles' },
      { key: 'fragileOption', label: 'Assurance premium' },
      { key: 'storageOption', label: 'Stockage' },
      { key: 'disassemblyOption', label: 'Démontage de meubles' },
      { key: 'unpackingOption', label: 'Déballages' },
      { key: 'suppliesOption', label: 'Fournitures' },
      { key: 'fragileItemsOption', label: 'Objets fragiles' }
    ]

    const selectedOptions = options.filter(option => booking[option.key as keyof BookingData])

    if (selectedOptions.length === 0) return null

    return (
      <div>
        <h3 className="text-sm font-medium text-gray-500">Options sélectionnées</h3>
        <ul className="mt-2 space-y-1">
          {selectedOptions.map(option => (
            <li key={option.key} className="text-sm text-gray-900">
              {option.label}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderCosts = () => {
    if (!booking.baseCost) return null

    return (
      <div className="mt-6 border-t pt-6">
        <h3 className="text-sm font-medium text-gray-500">Détail des coûts</h3>
        <dl className="mt-2 space-y-2">
          {booking.baseCost && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Prix de base</dt>
              <dd className="text-sm text-gray-900">{formatPrice(booking.baseCost)}</dd>
            </div>
          )}
          {booking.volumeCost && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Coût volume</dt>
              <dd className="text-sm text-gray-900">{formatPrice(booking.volumeCost)}</dd>
            </div>
          )}
          {booking.distancePrice && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Coût distance</dt>
              <dd className="text-sm text-gray-900">{formatPrice(booking.distancePrice)}</dd>
            </div>
          )}
          {booking.optionsCost && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Coût options</dt>
              <dd className="text-sm text-gray-900">{formatPrice(booking.optionsCost)}</dd>
            </div>
          )}
          {booking.tollCost && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Péages</dt>
              <dd className="text-sm text-gray-900">{formatPrice(booking.tollCost)}</dd>
            </div>
          )}
          {booking.fuelCost && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Carburant</dt>
              <dd className="text-sm text-gray-900">{formatPrice(booking.fuelCost)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t pt-2">
            <dt className="text-sm font-medium text-gray-900">Total</dt>
            <dd className="text-sm font-medium text-gray-900">{formatPrice(booking.totalAmount)}</dd>
          </div>
        </dl>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Réservation #{booking.id.slice(0, 8)}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Créée le {formatDate(booking.createdAt)}
            </p>
          </div>
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
              booking.status === 'PAYMENT_COMPLETED' ? 'bg-blue-100 text-blue-800' :
              booking.status === 'CANCELED' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {booking.status}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Client</h3>
            <p className="mt-1 text-sm text-gray-900">
              {booking.customer.firstName} {booking.customer.lastName}
            </p>
            <p className="mt-1 text-sm text-gray-500">{booking.customer.email}</p>
            {booking.customer.phone && (
              <p className="mt-1 text-sm text-gray-500">{booking.customer.phone}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          {renderMovingDetails()}
          {renderPackDetails()}
          {renderServiceDetails()}
          {renderOptions()}
          {renderCosts()}
        </div>
      </div>

      {showActions && (
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Annuler
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Modifier
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 