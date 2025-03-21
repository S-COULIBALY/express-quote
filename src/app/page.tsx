import Link from 'next/link'
import { ImageCarousel } from '@/components/ImageCarousel'

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Facilitez votre</span>{' '}
                <span className="block text-emerald-600 xl:inline">déménagement</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Solutions clés en main pour simplifier votre déménagement. Express-Quote vous accompagne du devis à la livraison.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <a
                    href="/moving/new"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 md:py-4 md:text-lg md:px-10"
                  >
                    Demander un devis
                  </a>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a
                    href="/packs"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 md:py-4 md:text-lg md:px-10"
                  >
                    Nos forfaits
                  </a>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a
                    href="/services"
                    className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                  >
                    Services à la carte
                  </a>
                </div>
              </div>
            </div>
            <div className="relative">
              <ImageCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Section Forfaits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos Forfaits</h2>
            <p className="text-xl text-gray-600">Choisissez la solution adaptée à vos besoins</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Forfait Essentiel */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Essentiel</h3>
                <p className="text-4xl font-bold text-green-600 mb-6">
                  249€<span className="text-base font-normal text-gray-600">/service</span>
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Transport de base
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    2 déménageurs
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Assurance de base
                  </li>
                </ul>
                <Link 
                  href="/moving/new?plan=essential"
                  className="block w-full text-center px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                >
                  Choisir ce forfait
                </Link>
              </div>
            </div>

            {/* Forfait Premium */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-green-500 relative">
              <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-sm font-semibold">
                POPULAIRE
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium</h3>
                <p className="text-4xl font-bold text-green-600 mb-6">
                  399€<span className="text-base font-normal text-gray-600">/service</span>
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Transport premium
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    3-4 déménageurs
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Emballage inclus
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Assurance complète
                  </li>
                </ul>
                <Link 
                  href="/moving/new?plan=premium"
                  className="block w-full text-center px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                >
                  Choisir ce forfait
                </Link>
              </div>
            </div>

            {/* Forfait Entreprise */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Entreprise</h3>
                <p className="text-4xl font-bold text-green-600 mb-6">
                  599€<span className="text-base font-normal text-gray-600">/service</span>
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Solution personnalisée
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Équipe dédiée
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Service prioritaire
                  </li>
                </ul>
                <Link 
                  href="/contact"
                  className="block w-full text-center px-6 py-3 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-900 transition-colors"
                >
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Comment ça marche */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Comment ça marche</h2>
            <p className="text-xl text-gray-600">Un processus simple en 4 étapes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Devis en ligne</h3>
              <p className="text-gray-600">Remplissez notre formulaire simple pour obtenir un devis instantané</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Confirmation</h3>
              <p className="text-gray-600">Validez votre devis et choisissez une date qui vous convient</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Préparation</h3>
              <p className="text-gray-600">Notre équipe planifie et organise votre service</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Réalisation</h3>
              <p className="text-gray-600">Nos professionnels exécutent le service selon vos besoins</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ce que disent nos clients</h2>
            <p className="text-xl text-gray-600">Des milliers de clients satisfaits</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Témoignage 1 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-green-600">M</span>
                </div>
                <div>
                  <h4 className="font-semibold">Michel Dupont</h4>
                  <p className="text-gray-600">Déménagement d&apos;appartement</p>
                </div>
              </div>
              <p className="text-gray-600">
                &quot;Service impeccable et équipe très professionnelle. Je recommande vivement !&quot;
              </p>
            </div>

            {/* Témoignage 2 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-green-600">S</span>
                </div>
                <div>
                  <h4 className="font-semibold">Sophie Martin</h4>
                  <p className="text-gray-600">Nettoyage fin de bail</p>
                </div>
              </div>
              <p className="text-gray-600">
                &quot;Excellent service, rapide et efficace. L&apos;appartement était impeccable !&quot;
              </p>
            </div>

            {/* Témoignage 3 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-green-600">L</span>
                </div>
                <div>
                  <h4 className="font-semibold">Laurent Blanc</h4>
                  <p className="text-gray-600">Déménagement d&apos;entreprise</p>
                </div>
              </div>
              <p className="text-gray-600">
                &quot;Une équipe réactive et professionnelle. Déménagement réalisé dans les temps.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Prêt à simplifier votre déménagement ou nettoyage ?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/moving/new"
              className="inline-flex justify-center items-center px-8 py-3 rounded-lg bg-white text-green-600 font-semibold hover:bg-gray-100 transition-colors"
            >
              Devis Déménagement
            </Link>
            <Link 
              href="/cleaning/new"
              className="inline-flex justify-center items-center px-8 py-3 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 transition-colors"
            >
              Devis Nettoyage
            </Link>
          </div>
        </div>
      </section>

      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-emerald-600 font-semibold tracking-wide uppercase">Nos options</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Choisissez la formule adaptée à vos besoins
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Express-Quote vous propose différentes options pour répondre à vos besoins spécifiques.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {/* Option 1: Devis personnalisé */}
              <div className="relative bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:border-emerald-500 transition-colors">
                <div className="absolute -top-4 -left-4 bg-emerald-500 rounded-full p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="mt-2">
                  <h3 className="text-lg font-medium text-gray-900">Devis personnalisé</h3>
                  <p className="mt-3 text-base text-gray-500">
                    Obtenez un devis sur mesure en fonction de vos besoins spécifiques de déménagement. Prix calculé en fonction du volume et de la distance.
                  </p>
                  <div className="mt-5">
                    <a href="/moving/new" className="text-base font-semibold text-emerald-600 hover:text-emerald-500">
                      Demander un devis →
                    </a>
                  </div>
                </div>
              </div>

              {/* Option 2: Forfaits prédéfinis */}
              <div className="relative bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:border-emerald-500 transition-colors">
                <div className="absolute -top-4 -left-4 bg-emerald-500 rounded-full p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="mt-2">
                  <h3 className="text-lg font-medium text-gray-900">Forfaits prédéfinis</h3>
                  <p className="mt-3 text-base text-gray-500">
                    Choisissez parmi nos forfaits prédéfinis pour un déménagement sans souci. Prix fixe, services inclus et sans surprise.
                  </p>
                  <div className="mt-5">
                    <a href="/packs" className="text-base font-semibold text-emerald-600 hover:text-emerald-500">
                      Voir les forfaits →
                    </a>
                  </div>
                </div>
              </div>

              {/* Option 3: Services à la carte */}
              <div className="relative bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:border-emerald-500 transition-colors">
                <div className="absolute -top-4 -left-4 bg-emerald-500 rounded-full p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="mt-2">
                  <h3 className="text-lg font-medium text-gray-900">Services à la carte</h3>
                  <p className="mt-3 text-base text-gray-500">
                    Besoin d'un service spécifique ? Choisissez parmi notre gamme de services individuels: montage, démontage, emballage, etc.
                  </p>
                  <div className="mt-5">
                    <a href="/services" className="text-base font-semibold text-emerald-600 hover:text-emerald-500">
                      Explorer les services →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
