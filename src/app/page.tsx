import Link from 'next/link'
import { ImageCarousel } from '@/components/ImageCarousel'
import { ServicesNavigation } from '@/components/ServicesNavigation'
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
      
      {/* Barre de navigation des services */}
      <ServicesNavigation />
      
      {/* Section promotionnelle compacte */}
      <div className="bg-white border-b border-gray-200 pt-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
            {/* Texte promotionnel principal */}
            <div className="text-center lg:text-left flex-1">
              <h2 className="text-base font-bold text-gray-900 mb-1">
                🚀 Devis Express en Temps Réel !
              </h2>
              <p className="text-xs text-gray-600 max-w-2xl">
                Déménagement, ménage, transport et livraison - Obtenez votre devis personnalisé en moins de 2 minutes avec tarification transparente.
              </p>
            </div>
            
            {/* Encart promotionnel */}
            <div className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-3 py-2 rounded-lg shadow-lg">
              <div className="text-center">
                <div className="text-lg font-bold">⚡ 2min</div>
                <div className="text-xs font-medium">Devis instantané</div>
                <div className="text-xs opacity-90">Gratuit & sans engagement</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="hero-gradient pt-20" aria-labelledby="hero-heading">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-0.5 sm:py-1 lg:py-1.5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl tracking-tight font-extrabold text-gray-900 font-ios-bold" id="hero-heading">
                <span className="inline lg:block">Vos Devis</span>{' '}
                <span className="inline lg:block text-primary">en Temps Réel</span>
              </h1>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-gray-500 sm:max-w-xl mx-auto lg:mx-0 font-ios">
                <span className="font-semibold text-emerald-600">Exclusive</span> : Obtenez votre devis personnalisé en moins de 2 minutes. Déménagement, ménage, transport et livraison avec tarification transparente.
              </p>
              <div className="mt-4 sm:mt-6 lg:mt-8 flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center lg:justify-start">
                <Link
                  href="/catalogue/catalog-demenagement-sur-mesure"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 md:py-3 md:text-lg md:px-8 shadow-lg hover:shadow-xl transition-all duration-200 font-ios"
                  aria-label="Demander un devis déménagement instantané"
                >
                  Devis déménagement instantané
                </Link>
                <Link
                  href="/catalogue"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-xl text-white bg-orange-500 hover:bg-orange-600 md:py-3 md:text-lg md:px-8 shadow-lg hover:shadow-xl transition-all duration-200 font-ios"
                  aria-label="Voir nos forfaits avec devis instantané"
                >
                  Nos Forfaits Personnalisables
                </Link>
                <Link
                  href="/catalogue/catalog-menage-sur-mesure"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-sm sm:text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 md:py-3 md:text-lg md:px-8 shadow-md hover:shadow-lg transition-all duration-200 font-ios"
                  aria-label="Demander un devis ménage instantané"
                >
                  Devis ménage instantané
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
      <section className="py-8 sm:py-12 bg-gray-50" aria-labelledby="forfaits-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-bold" id="forfaits-heading">Nos solutions modulaires - Prix en Temps Réel</h2>
            <p className="text-lg sm:text-xl text-gray-600 font-ios">Deux approches pour tous vos besoins : services sur mesure et forfaits personnalisables</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Déménagement Sur Mesure */}
            <article className="card-ios relative hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                SUR MESURE
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-semibold">Déménagement Sur Mesure</h3>
                <p className="text-base text-gray-600 mb-6 font-ios">
                  Expertise professionnelle pour votre déménagement. Équipe qualifiée, matériel adapté et suivi personnalisé.
                </p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 font-ios" aria-label="Avantages du déménagement sur mesure">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Équipe professionnelle certifiée
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Matériel de protection inclus
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Assurance responsabilité civile
                  </li>
                </ul>
                <Link 
                  href="/catalogue/catalog-demenagement-sur-mesure"
                  className="block w-full text-center px-4 sm:px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl font-ios"
                  aria-label="Commencer un devis déménagement sur mesure"
                >
                  Devis gratuit
                </Link>
              </div>
            </article>

            {/* Nettoyage Sur Mesure */}
            <article className="card-ios relative hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                SUR MESURE
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-semibold">Nettoyage Sur Mesure</h3>
                <p className="text-base text-gray-600 mb-6 font-ios">
                  Service personnalisé pour tous vos besoins de nettoyage. Produits écologiques et techniques professionnelles.
                </p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 font-ios" aria-label="Avantages du nettoyage sur mesure">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Produits écologiques certifiés
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Techniques professionnelles
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Flexibilité des horaires
                  </li>
                </ul>
                <Link 
                  href="/catalogue/catalog-menage-sur-mesure"
                  className="block w-full text-center px-4 sm:px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-ios"
                  aria-label="Commencer un devis nettoyage sur mesure"
                >
                  Devis gratuit
                </Link>
              </div>
            </article>

            {/* Forfaits Personnalisables */}
            <article className="card-ios relative hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-purple-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                FORFAITS
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-semibold">Forfaits Personnalisables</h3>
                <p className="text-base text-gray-600 mb-6 font-ios">
                  Services modulaires avec prix fixes et options personnalisables pour répondre à vos besoins spécifiques.
                </p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 font-ios" aria-label="Avantages des forfaits personnalisables">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Prix fixes et transparents
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Options personnalisables
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Services variés disponibles
                  </li>
                </ul>
                <Link 
                  href="/catalogue"
                  className="block w-full text-center px-4 sm:px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-ios"
                  aria-label="Voir tous les forfaits personnalisables"
                >
                  Voir le catalogue
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Section Pourquoi nous choisir */}
      <section className="py-8 sm:py-12 bg-white" aria-labelledby="why-choose-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-bold" id="why-choose-heading">Pourquoi nous choisir</h2>
            <p className="text-lg sm:text-xl text-gray-600 font-ios">Des services professionnels avec une approche personnalisée et transparente</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Expertise Professionnelle */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 font-ios-semibold">Expertise Professionnelle</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Équipes certifiées et formées aux meilleures pratiques du secteur</p>
            </div>

            {/* Tarification Transparente */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 font-ios-semibold">Tarification Transparente</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Prix clairs et détaillés, sans surprise ni frais cachés</p>
            </div>

            {/* Flexibilité */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 font-ios-semibold">Flexibilité Totale</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Services adaptés à vos horaires et contraintes spécifiques</p>
            </div>

            {/* Satisfaction Garantie */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 font-ios-semibold">Satisfaction Garantie</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Engagement qualité avec suivi personnalisé et garantie</p>
            </div>
          </div>

          {/* Statistiques */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-emerald-600 mb-2 font-ios-bold">1000+</div>
              <div className="text-sm sm:text-base text-gray-600 font-ios">Clients satisfaits</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2 font-ios-bold">24/7</div>
              <div className="text-sm sm:text-base text-gray-600 font-ios">Support client</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2 font-ios-bold">5★</div>
              <div className="text-sm sm:text-base text-gray-600 font-ios">Note moyenne</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Innovation - Devis en temps réel */}
      <section className="py-8 sm:py-12 bg-gradient-to-br from-emerald-50 to-blue-50" aria-labelledby="innovation-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-blue-100 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Innovation Exclusive
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-bold" id="innovation-heading">Devis en temps réel : Notre avantage concurrentiel</h2>
            <p className="text-lg sm:text-xl text-gray-600 font-ios max-w-3xl mx-auto">Pendant que la concurrence vous fait attendre des jours, nous vous donnons votre devis personnalisé instantanément</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Contenu gauche */}
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 font-ios-semibold">Pourquoi c'est révolutionnaire ?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 font-ios-semibold">Gain de temps exceptionnel</h4>
                    <p className="text-gray-600 font-ios">Plus besoin d'attendre 24-48h pour un devis. Obtenez-le en 2 minutes maximum.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 font-ios-semibold">Tarification transparente</h4>
                    <p className="text-gray-600 font-ios">Prix calculés en temps réel selon vos besoins exacts, sans surprise ni frais cachés.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 font-ios-semibold">Personnalisation instantanée</h4>
                    <p className="text-gray-600 font-ios">Chaque devis est adapté à votre situation spécifique grâce à notre algorithme intelligent.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 font-ios-semibold">Réservation immédiate</h4>
                    <p className="text-gray-600 font-ios">Confirmez et réservez votre créneau directement après avoir reçu votre devis.</p>
                  </div>
                </div>
              </div>
      </div>

            {/* Contenu droite - Comparaison */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center font-ios-semibold">Comparaison avec la concurrence</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <h4 className="font-semibold text-red-800 font-ios-semibold">Concurrence traditionnelle</h4>
                    <p className="text-sm text-red-600 font-ios">Attente de 24-48h minimum</p>
                  </div>
                  <div className="text-2xl">⏰</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div>
                    <h4 className="font-semibold text-emerald-800 font-ios-semibold">Notre innovation</h4>
                    <p className="text-sm text-emerald-600 font-ios">Devis en 2 minutes maximum</p>
                  </div>
                  <div className="text-2xl">⚡</div>
                </div>
                <div className="text-center mt-6">
                  <div className="text-3xl font-bold text-emerald-600 font-ios-bold">95%</div>
                  <div className="text-sm text-gray-600 font-ios">de temps économisé</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Comment ça marche */}
      <section className="py-8 sm:py-12 bg-gray-50" aria-labelledby="process-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-bold" id="process-heading">Notre innovation : Devis en temps réel</h2>
            <p className="text-lg sm:text-xl text-gray-600 font-ios">La seule plateforme qui vous donne un devis personnalisé instantanément</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" aria-hidden="true">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 font-ios-semibold">Devis instantané</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Répondez à quelques questions et obtenez votre devis personnalisé en temps réel</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" aria-hidden="true">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 font-ios-semibold">Validation immédiate</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Confirmez votre devis en temps réel et réservez votre créneau instantanément</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" aria-hidden="true">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 font-ios-semibold">Intervention rapide</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Notre équipe intervient selon le planning confirmé en temps réel</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" aria-hidden="true">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 font-ios-semibold">Satisfaction garantie</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Service réalisé avec facturation transparente et suivi en temps réel</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 py-8" aria-labelledby="cta-heading">
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
           
           {/* Note sur les conditions tarifaires */}
           <div className="mt-8 max-w-4xl mx-auto">
             <p className="text-xs text-emerald-100 text-center font-ios leading-relaxed">
               * Les prix peuvent varier selon les contraintes spécifiques de votre logement (escaliers étroits, absence d'ascenseur, sols fragiles, etc.). 
               Notre système de devis en temps réel vous fournit une estimation précise, avec possibilité d'ajustement lors de l'intervention si nécessaire.
             </p>
           </div>
         </div>
       </section>
     </div>
   )
 }
