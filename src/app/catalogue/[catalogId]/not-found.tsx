import Link from 'next/link';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  TruckIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center form-generator">
      <div className="max-w-md w-full px-4">
        <div className="text-center">
          {/* Icône d'erreur */}
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-ios">
            <MagnifyingGlassIcon className="w-12 h-12 text-red-500" />
          </div>

          {/* Titre */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Service non trouvé
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-8">
            Désolé, cet élément du catalogue n'existe pas ou n'est plus disponible. 
            Il a peut-être été supprimé ou l'URL est incorrecte.
          </p>

          {/* Actions */}
          <div className="space-y-4">
            {/* Bouton principal - Retour au catalogue */}
            <Link
              href="/catalogue"
              className="w-full btn-primary-ios flex items-center justify-center gap-2"
            >
              <HomeIcon className="w-5 h-5" />
              Retour au catalogue
            </Link>

            {/* Actions alternatives */}
            <div className="text-sm text-gray-500 mb-4">
              Ou essayez ces alternatives :
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/catalogue?category=DEMENAGEMENT"
                className="card-ios p-4 text-emerald-700 hover:bg-emerald-50 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <TruckIcon className="w-4 h-4" />
                Déménagement
              </Link>
              
              <Link
                href="/catalogue?category=MENAGE"
                className="card-ios p-4 text-blue-700 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <SparklesIcon className="w-4 h-4" />
                Ménage
              </Link>
            </div>
          </div>

          {/* Aide supplémentaire */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Besoin d'aide ?
            </p>
            <Link
              href="/contact"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Contactez notre équipe →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 