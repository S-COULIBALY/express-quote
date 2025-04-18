import Link from 'next/link'
import { ImageCarousel } from '@/components/ImageCarousel'
import HomeSchema from './schema'

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      {/* Intégration du schema JSON-LD */}
      <HomeSchema />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white" aria-labelledby="hero-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl tracking-tight font-extrabold text-gray-900" id="hero-heading">
                <span className="inline lg:block">Facilitez votre</span>{' '}
                <span className="inline lg:block text-emerald-600">déménagement</span>
              </h1>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-gray-500 sm:max-w-xl mx-auto lg:mx-0">
                Solutions clés en main pour simplifier votre déménagement. Express-Quote vous accompagne du devis à la livraison.
              </p>
              <div className="mt-4 sm:mt-6 lg:mt-8 flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center lg:justify-start">
                <Link
                  href="/moving/new"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 md:py-3 md:text-lg md:px-8"
                  aria-label="Demander un devis de déménagement"
                >
                  Demander un devis
                </Link>
                <Link
                  href="/packs"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 md:py-3 md:text-lg md:px-8"
                  aria-label="Voir nos forfaits de déménagement"
                >
                  Nos Forfaits
                </Link>
                <Link
                  href="/services"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-sm sm:text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-3 md:text-lg md:px-8"
                  aria-label="Découvrir nos services à la carte"
                >
                  Services à la carte
                </Link>
              </div>
            </div>
            <div className="relative mt-6 lg:mt-0">
              <ImageCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Section Forfaits */}
      <section className="py-12 sm:py-20 bg-white" aria-labelledby="forfaits-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4" id="forfaits-heading">Nos forfaits personnalisables</h2>
            <p className="text-lg sm:text-xl text-gray-600">Des solutions sur mesure pour vos besoins</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Forfait Déménagement */}
            <article className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-green-500 relative">
              <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-sm font-semibold">
                DÉMÉNAGEMENT
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Pack Déménagement</h3>
                <p className="text-base text-gray-600 mb-6">
                  Solution complète pour votre déménagement, adaptée à vos besoins spécifiques.
                </p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8" aria-label="Avantages du pack déménagement">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Transport professionnel
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Équipe qualifiée
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Assurance incluse
                  </li>
                </ul>
                <Link 
                  href="/packs"
                  className="block w-full text-center px-4 sm:px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                  aria-label="Voir les forfaits de déménagement"
                >
                  Voir les forfaits
                </Link>
              </div>
            </article>

            {/* Forfait Services */}
            <article className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-green-500 relative">
              <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-sm font-semibold">
                SERVICES
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Services à la carte</h3>
                <p className="text-base text-gray-600 mb-6">
                  Des services personnalisés pour répondre à vos besoins spécifiques.
                </p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8" aria-label="Types de services disponibles">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Nettoyage professionnel
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Montage/démontage
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Services sur mesure
                  </li>
                </ul>
                <Link 
                  href="/services"
                  className="block w-full text-center px-4 sm:px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                  aria-label="Découvrir tous nos services à la carte"
                >
                  Découvrir les services
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Note discrète sur les frais supplémentaires */}
      <div className="max-w-3xl mx-auto -mt-4 mb-8">
        <p className="text-xs text-gray-500 text-center">
          * Les prix peuvent varier selon les caractéristiques spécifiques de votre logement (accès, étage, ascenseur, stationnement, etc.)
        </p>
      </div>

      {/* Section Comment ça marche */}
      <section className="py-12 sm:py-20 bg-gray-50" aria-labelledby="process-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4" id="process-heading">Comment ça marche</h2>
            <p className="text-lg sm:text-xl text-gray-600">Un processus simple en 4 étapes</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Devis en ligne</h3>
              <p className="text-sm sm:text-base text-gray-600">Remplissez notre formulaire simple pour obtenir un devis instantané</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Confirmation</h3>
              <p className="text-sm sm:text-base text-gray-600">Validez votre devis et choisissez une date qui vous convient</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Préparation</h3>
              <p className="text-sm sm:text-base text-gray-600">Notre équipe planifie et organise votre service</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <span className="text-2xl font-bold text-green-600">4</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Réalisation</h3>
              <p className="text-sm sm:text-base text-gray-600">Nos professionnels exécutent le service selon vos besoins</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="py-12 sm:py-20 bg-white" aria-labelledby="testimonials-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4" id="testimonials-heading">Ce que disent nos clients</h2>
            <p className="text-lg sm:text-xl text-gray-600">Des milliers de clients satisfaits</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Témoignage 1 */}
            <article className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4" aria-hidden="true">
                  <span className="text-xl font-bold text-green-600">M</span>
                </div>
                <div>
                  <h4 className="font-semibold">Michel Dupont</h4>
                  <p className="text-sm text-gray-600">Déménagement d&apos;appartement</p>
                </div>
              </div>
              <blockquote>
                <p className="text-sm sm:text-base text-gray-600">
                  &quot;Service impeccable et équipe très professionnelle. Je recommande vivement !&quot;
                </p>
              </blockquote>
            </article>

            {/* Témoignage 2 */}
            <article className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4" aria-hidden="true">
                  <span className="text-xl font-bold text-green-600">S</span>
                </div>
                <div>
                  <h4 className="font-semibold">Sophie Martin</h4>
                  <p className="text-sm text-gray-600">Nettoyage fin de bail</p>
                </div>
              </div>
              <blockquote>
                <p className="text-sm sm:text-base text-gray-600">
                  &quot;Excellent service, rapide et efficace. L&apos;appartement était impeccable !&quot;
                </p>
              </blockquote>
            </article>

            {/* Témoignage 3 */}
            <article className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4" aria-hidden="true">
                  <span className="text-xl font-bold text-green-600">L</span>
                </div>
                <div>
                  <h4 className="font-semibold">Laurent Blanc</h4>
                  <p className="text-sm text-gray-600">Déménagement d&apos;entreprise</p>
                </div>
              </div>
              <blockquote>
                <p className="text-sm sm:text-base text-gray-600">
                  &quot;Une équipe réactive et professionnelle. Déménagement réalisé dans les temps.&quot;
                </p>
              </blockquote>
            </article>
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="py-12 sm:py-20 bg-green-600" aria-labelledby="cta-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8" id="cta-heading">
            Prêt à simplifier votre déménagement ou nettoyage ?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/moving/new"
              className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 rounded-lg bg-white text-green-600 font-semibold hover:bg-gray-100 transition-colors"
              aria-label="Obtenir un devis de déménagement personnalisé"
            >
              Devis Déménagement
            </Link>
            <Link 
              href="/cleaning/new"
              className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 transition-colors"
              aria-label="Obtenir un devis de nettoyage personnalisé"
            >
              Devis Nettoyage
            </Link>
          </div>
        </div>
      </section>

      {/* Note légale discrète */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center">
        <p className="text-xs text-gray-500">
          En utilisant notre site, vous acceptez nos{' '}
          <Link href="/legal/terms" className="text-gray-600 hover:text-gray-900 hover:underline">conditions générales</Link>,{' '}
          <Link href="/legal/privacy" className="text-gray-600 hover:text-gray-900 hover:underline">politique de confidentialité</Link> et{' '}
          <Link href="/legal/cookies" className="text-gray-600 hover:text-gray-900 hover:underline">politique des cookies</Link>.
          Pour plus d'informations, consultez nos <Link href="/legal" className="text-gray-600 hover:text-gray-900 hover:underline">mentions légales</Link>.
        </p>
      </footer>
    </div>
  )
}
