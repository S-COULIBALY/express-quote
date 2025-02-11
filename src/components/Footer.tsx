import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-green-600 mb-4">
              ExpressQuote
            </h3>
            <p className="text-gray-600">
              Solutions de déménagement et nettoyage professionnel pour particuliers et entreprises.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/moving/new" className="text-gray-600 hover:text-gray-900">
                  Déménagement
                </Link>
              </li>
              <li>
                <Link href="/cleaning/new" className="text-gray-600 hover:text-gray-900">
                  Nettoyage
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Entreprise</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Légal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900">
                  Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} ExpressQuote. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
} 