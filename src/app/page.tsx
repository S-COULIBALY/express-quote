import Link from 'next/link'
import { ImageCarousel } from '@/components/ImageCarousel'
import HomeSchema from './schema'
import { FormStylesSimplified } from '@/components/form-generator/styles/FormStylesSimplified'
import { globalFormPreset } from '@/components/form-generator/presets/_shared/globalPreset'

export default function Home() {
  return (
    <div className="overflow-x-hidden form-generator font-ios">
      {/* 🎨 Styles iOS 18 simplifiés */}
      <FormStylesSimplified globalConfig={globalFormPreset} />
      
      {/* Intégration du schema JSON-LD */}
      <HomeSchema />
      
      {/* Hero Section */}
      <section className="hero-gradient" aria-labelledby="hero-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl tracking-tight font-extrabold text-gray-900 font-ios-bold" id="hero-heading">
                <span className="inline lg:block">Vos services</span>{' '}
                <span className="inline lg:block text-primary">sur mesure</span>
              </h1>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-gray-500 sm:max-w-xl mx-auto lg:mx-0 font-ios">
                Déménagement, ménage, transport et livraison. Des solutions personnalisées avec devis instantané et équipes professionnelles.
              </p>
              <div className="mt-4 sm:mt-6 lg:mt-8 flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center lg:justify-start">
                <Link
                  href="/catalogue/catalog-demenagement-sur-mesure"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 md:py-3 md:text-lg md:px-8 shadow-lg hover:shadow-xl transition-all duration-200 font-ios"
                  aria-label="Demander un devis déménagement sur mesure"
                >
                  Déménagement sur mesure
                </Link>
                <Link
                  href="/catalogue"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-xl text-white bg-orange-500 hover:bg-orange-600 md:py-3 md:text-lg md:px-8 shadow-lg hover:shadow-xl transition-all duration-200 font-ios"
                  aria-label="Voir notre catalogue complet"
                >
                  Voir le catalogue
                </Link>
                <Link
                  href="/catalogue/catalog-menage-sur-mesure"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-sm sm:text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 md:py-3 md:text-lg md:px-8 shadow-md hover:shadow-lg transition-all duration-200 font-ios"
                  aria-label="Demander un devis ménage sur mesure"
                >
                  Ménage sur mesure
                </Link>
              </div>
            </div>
            <div className="relative mt-6 lg:mt-0">
              <ImageCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Section Solutions Modulaires */}
      <section className="py-12 sm:py-20 bg-gray-50" aria-labelledby="forfaits-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-bold" id="forfaits-heading">Nos solutions modulaires</h2>
            <p className="text-lg sm:text-xl text-gray-600 font-ios">Composez votre service et payez uniquement ce que vous utilisez</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Déménagement Économique */}
            <article className="card-ios relative hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-orange-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                ÉCONOMIQUE
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-semibold">Déménagement à 19€/h</h3>
                <p className="text-base text-gray-600 mb-6 font-ios">
                  Tarification horaire flexible. Payez uniquement la main d'œuvre dont vous avez besoin.
                </p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 font-ios" aria-label="Avantages du déménagement économique">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Tarification horaire flexible
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Équipe professionnelle
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Prix transparents
                  </li>
                </ul>
                <Link 
                  href="/catalogue#packs-exclusifs"
                  className="block w-full text-center px-4 sm:px-6 py-3 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl font-ios"
                  aria-label="Voir les forfaits déménagement"
                >
                  Voir les solutions
                </Link>
              </div>
            </article>

            {/* Ménage Flexible */}
            <article className="card-ios relative hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-purple-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                FLEXIBLE
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-semibold">Ménage à 21€/h</h3>
                <p className="text-base text-gray-600 mb-6 font-ios">
                  Service modulaire sans forfait rigide. Adapté à vos besoins spécifiques.
                </p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 font-ios" aria-label="Avantages du ménage flexible">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Service modulaire
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Produits écologiques
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Pas de forfait imposé
                  </li>
                </ul>
                <Link 
                  href="/catalogue#packs-exclusifs"
                  className="block w-full text-center px-4 sm:px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-ios"
                  aria-label="Voir les forfaits ménage"
                >
                  Voir les solutions
                </Link>
              </div>
            </article>

            {/* Transport Sécurisé */}
            <article className="card-ios relative hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                SÉCURISÉ
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-semibold">Transport à prix transparents</h3>
                <p className="text-base text-gray-600 mb-6 font-ios">
                  Transport sécurisé d'objets volumineux avec protection maximale et assurance.
                </p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 font-ios" aria-label="Avantages du transport sécurisé">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Protection maximale
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Assurance incluse
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Prix transparents
                  </li>
                </ul>
                <Link 
                  href="/catalogue#packs-exclusifs"
                  className="block w-full text-center px-4 sm:px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-ios"
                  aria-label="Voir les forfaits transport"
                >
                  Voir les solutions
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Section Services sur mesure */}
      <section className="py-12 sm:py-20 bg-white" aria-labelledby="services-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-bold" id="services-heading">Services sur mesure</h2>
            <p className="text-lg sm:text-xl text-gray-600 font-ios">Payez uniquement ce dont vous avez besoin avec nos services personnalisés</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Service sur mesure Déménagement */}
            <article className="card-ios relative hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                SUR MESURE
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-semibold">Déménagement personnalisé</h3>
                <p className="text-base text-gray-600 mb-6 font-ios">
                  Service 100% adapté à vos besoins spécifiques. Tarification horaire flexible à 19€/h.
                </p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 font-ios" aria-label="Avantages du service déménagement sur mesure">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Tarification horaire flexible
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Payez selon vos besoins
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Équipe professionnelle
                  </li>
                </ul>
                <Link 
                  href="/catalogue/catalog-demenagement-sur-mesure"
                  className="block w-full text-center px-4 sm:px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl font-ios"
                  aria-label="Commencer un devis déménagement sur mesure"
                >
                  Devis sur mesure
                </Link>
              </div>
            </article>

            {/* Service sur mesure Ménage */}
            <article className="card-ios relative hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                SUR MESURE
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-semibold">Ménage personnalisé</h3>
                <p className="text-base text-gray-600 mb-6 font-ios">
                  Service de nettoyage adapté à vos besoins spécifiques. Tarification horaire à 21€/h.
                </p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 font-ios" aria-label="Types de services de ménage sur mesure">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Service modulaire
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Produits écologiques
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Prix transparents
                  </li>
                </ul>
                <Link 
                  href="/catalogue/catalog-menage-sur-mesure"
                  className="block w-full text-center px-4 sm:px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-ios"
                  aria-label="Commencer un devis ménage sur mesure"
                >
                  Devis sur mesure
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Note discrète sur les frais supplémentaires */}
      <div className="max-w-3xl mx-auto -mt-4 mb-8">
        <p className="text-xs text-gray-500 text-center font-ios">
          * Les prix peuvent varier selon les contraintes spécifiques de votre logement (escaliers étroits, absence d'ascenseur, sols fragiles, etc.). Devis personnalisé pour évaluation précise.
        </p>
      </div>

      {/* Section Comment ça marche */}
      <section className="py-12 sm:py-20 bg-gray-50" aria-labelledby="process-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-bold" id="process-heading">Comment ça marche</h2>
            <p className="text-lg sm:text-xl text-gray-600 font-ios">Devis instantané en moins de 2 minutes</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" aria-hidden="true">
                <span className="text-2xl font-bold text-emerald-600">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 font-ios-semibold">Devis instantané</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Répondez à quelques questions pour obtenir votre devis en 2 minutes</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" aria-hidden="true">
                <span className="text-2xl font-bold text-emerald-600">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 font-ios-semibold">Confirmation</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Confirmez votre devis et choisissez votre créneau horaire</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" aria-hidden="true">
                <span className="text-2xl font-bold text-emerald-600">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 font-ios-semibold">Intervention</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Notre équipe intervient à l'heure convenue</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" aria-hidden="true">
                <span className="text-2xl font-bold text-emerald-600">4</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 font-ios-semibold">Satisfaction</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Service réalisé et facturation transparente</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 py-16" aria-labelledby="cta-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-ios-bold" id="cta-heading">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-3xl mx-auto font-ios">
            Obtenez votre devis instantané et bénéficiez de nos services professionnels dès aujourd'hui.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/catalogue/catalog-demenagement-sur-mesure"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-emerald-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl font-ios"
            >
              Déménagement sur mesure
            </Link>
            <Link
              href="/catalogue/catalog-menage-sur-mesure"
              className="inline-flex items-center justify-center px-8 py-3 border border-white text-base font-medium rounded-xl text-white hover:bg-white hover:text-emerald-700 transition-all duration-200 font-ios"
            >
              Ménage sur mesure
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
