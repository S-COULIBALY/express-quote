import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-lg font-semibold text-green-600 mb-3">
              ExpressQuote
            </h3>
            <p className="text-sm text-gray-600">
              Solutions de déménagement et nettoyage professionnel pour particuliers et entreprises.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/moving/new" className="text-sm text-gray-600 hover:text-gray-900">
                  Déménagement
                </Link>
              </li>
              <li>
                <Link href="/cleaning/new" className="text-sm text-gray-600 hover:text-gray-900">
                  Nettoyage
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Entreprise</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Légal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                  Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-center">
          <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} ExpressQuote. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
} 