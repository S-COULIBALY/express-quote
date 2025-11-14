import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t" role="contentinfo" aria-label="Pied de page">
      <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-0">
          <h3 className="text-lg font-semibold text-green-600 mb-3">
            ExpressQuote
          </h3>
          <p className="text-sm text-gray-600">
            Solutions de déménagement et nettoyage professionnel pour particuliers et entreprises.
          </p>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-8">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3" id="footer-services">Services</h4>
            <ul className="space-y-2" aria-labelledby="footer-services">
              <li>
                <Link href="/catalogue?category=DEMENAGEMENT" className="text-sm text-gray-600 hover:text-gray-900">
                  Déménagement
                </Link>
              </li>
              <li>
                <Link href="/catalogue?category=MENAGE" className="text-sm text-gray-600 hover:text-gray-900">
                  Nettoyage
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3" id="footer-company">Entreprise</h4>
            <ul className="space-y-2" aria-labelledby="footer-company">
              <li>
                <Link href="/a-propos" className="text-sm text-gray-600 hover:text-gray-900">
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
            <h4 className="text-sm font-medium text-gray-900 mb-3" id="footer-legal">Légal</h4>
            <ul className="space-y-2" aria-labelledby="footer-legal">
              <li>
                <Link href="/legal" className="text-sm text-gray-600 hover:text-gray-900">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-sm text-gray-600 hover:text-gray-900">
                  Conditions générales
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-sm text-gray-600 hover:text-gray-900">
                  Politique des cookies
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