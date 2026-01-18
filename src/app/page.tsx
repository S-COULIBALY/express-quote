import Link from 'next/link'
import Image from 'next/image'
import { ImageCarousel } from '@/components/ImageCarousel'
import { ServicesNavigation } from '@/components/ServicesNavigation'
import { ScreenshotDisplay } from '@/components/ScreenshotDisplay'
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
      <div className="bg-white border-b border-gray-200 pt-16 sm:pt-20">
        <div className="w-full px-3 sm:px-4 md:px-5 lg:px-8 py-2 sm:py-2.5">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2 sm:gap-3">
            {/* Texte promotionnel principal */}
            <div className="text-center lg:text-left flex-1">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1">
                🚀 Devis Transparent en 2 minutes !
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-2xl">
                Obtenez votre devis personnalisé instantanément avec un détail complet de tous les coûts. Comparez 6 formules adaptées à votre situation. Aucun frais caché.
              </p>
            </div>

            {/* Encart promotionnel */}
            <div className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-2.5 sm:px-3 md:px-3 py-1.5 sm:py-2 rounded-lg shadow-lg">
              <div className="text-center">
                <div className="text-base sm:text-lg md:text-xl font-bold">⚡ 2min</div>
                <div className="text-[10px] sm:text-xs md:text-xs font-medium">Devis instantané</div>
                <div className="text-[10px] sm:text-xs md:text-xs opacity-90">Gratuit & sans engagement</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-gradient pt-12 sm:pt-16 md:pt-20" aria-labelledby="hero-heading">
        <div className="w-full px-3 sm:px-4 md:px-5 lg:px-8 py-0.5 sm:py-1 md:py-1.5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight font-extrabold text-gray-900 font-ios-bold" id="hero-heading">
                <span className="inline lg:block">Vos Devis</span>{' '}
                <span className="inline lg:block text-primary">en Temps Réel</span>
              </h1>
              <p className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg lg:text-lg text-gray-500 sm:max-w-xl mx-auto lg:mx-0 font-ios">
                <span className="font-semibold text-emerald-600">Transparence totale</span> : Devis détaillé en 2 minutes avec tous les coûts expliqués. Comparez 6 formules adaptées à votre situation. Aucun frais caché, prix clairs dès le départ.
              </p>
              <div className="mt-4 sm:mt-6 md:mt-6 lg:mt-8 flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center lg:justify-start">
                <Link
                  href="/catalogue/catalog-demenagement-sur-mesure"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 md:px-6 py-2.5 sm:py-3 md:py-3 border border-transparent text-sm sm:text-base md:text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 lg:py-3 lg:text-lg lg:px-8 shadow-lg hover:shadow-xl transition-all duration-200 font-ios min-h-[44px] sm:min-h-auto"
                  aria-label="Demander un devis déménagement instantané"
                >
                  Devis déménagement instantané
                </Link>
                <Link
                  href="/catalogue"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 md:px-6 py-2.5 sm:py-3 md:py-3 border border-transparent text-sm sm:text-base md:text-base font-medium rounded-xl text-white bg-orange-500 hover:bg-orange-600 lg:py-3 lg:text-lg lg:px-8 shadow-lg hover:shadow-xl transition-all duration-200 font-ios min-h-[44px] sm:min-h-auto"
                  aria-label="Voir nos forfaits avec devis instantané"
                >
                  Nos Forfaits Personnalisables
                </Link>
              </div>
            </div>
            <div className="relative mt-6 sm:mt-8 lg:mt-0">
              <ImageCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Section Démonstration - Capture d'écran du formulaire */}
      <section className="py-6 sm:py-8 md:py-10 lg:py-12 bg-white" aria-labelledby="demo-heading">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-8">
          <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-100 text-emerald-700 px-3 sm:px-4 md:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm md:text-sm font-semibold mb-3 sm:mb-4">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Démonstration en direct
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 font-ios-bold" id="demo-heading">Voyez la transparence en action</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 font-ios max-w-3xl mx-auto px-2">
              Découvrez comment notre système calcule votre devis en temps réel avec un détail complet de tous les coûts. Comparez 6 formules adaptées à votre situation.
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4 md:p-6 bg-gray-100 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                <div className="ml-2 sm:ml-4 text-xs sm:text-sm md:text-sm text-gray-600 font-ios truncate">
                  <span className="font-semibold">localhost:3000</span> / catalogue / catalog-demenagement-sur-mesure
                </div>
              </div>
            </div>

            {/* Capture d'écran du formulaire */}
            <div className="relative bg-white">
              {/* Conteneur avec scroll horizontal sur mobile si nécessaire */}
              <div className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Wrapper pour permettre le scroll horizontal sur mobile */}
                <div className="overflow-x-auto overflow-y-hidden">
                  {/* Conteneur interne pour centrer et dimensionner l'image */}
                  <div className="flex items-center justify-center min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[350px] xl:min-h-[400px] py-3 px-2 sm:py-4 sm:px-3 md:py-5 md:px-4">
                    <ScreenshotDisplay
                      src="/images/formulaire-devis-capture.png"
                      alt="Capture d'écran du formulaire de devis avec calcul en temps réel montrant 6 formules comparables (Éco, Standard, Confort, Sécurité, Premium, Flexible) avec prix détaillés, nombre de déménageurs, volume, distance, score de risque, et section de réservation avec options d'assurance et acompte"
                    />
                  </div>
                </div>
              </div>

              {/* Légende et points clés */}
              <div className="p-4 sm:p-5 md:p-6 lg:p-8 bg-gradient-to-br from-emerald-50 to-blue-50 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-base sm:text-lg font-bold">6</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base font-ios-semibold">6 formules comparables</h4>
                      <p className="text-xs sm:text-sm text-gray-600 font-ios">Éco, Standard, Confort, Sécurité, Premium, Flexible</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base font-ios-semibold">Détail complet</h4>
                      <p className="text-xs sm:text-sm text-gray-600 font-ios">Transport, main-d'œuvre, contraintes, options expliqués</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 sm:col-span-2 md:col-span-1">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base font-ios-semibold">Temps réel</h4>
                      <p className="text-xs sm:text-sm text-gray-600 font-ios">Prix mis à jour instantanément à chaque modification</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="text-center mt-6 sm:mt-8 md:mt-10 lg:mt-12">
            <Link
              href="/catalogue/catalog-demenagement-sur-mesure"
              className="inline-flex items-center justify-center px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-ios text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-auto"
            >
              <span>Essayez maintenant - Devis gratuit</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Section Solutions */}
      <section className="py-6 sm:py-8 md:py-10 lg:py-12 bg-gray-50" aria-labelledby="forfaits-heading">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 font-ios-bold" id="forfaits-heading">Nos solutions - Prix Transparents en Temps Réel</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 font-ios px-2">Deux approches pour tous vos besoins : services sur mesure et forfaits personnalisables avec tarification transparente</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Déménagement Sur Mesure */}
            <article className="card-ios relative hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white px-2.5 sm:px-3 md:px-3 py-0.5 sm:py-1 text-xs sm:text-sm md:text-sm font-semibold rounded-bl-lg">
                SUR MESURE
              </div>
              <div className="p-4 sm:p-6 md:p-8">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 font-ios-semibold">Déménagement Sur Mesure</h3>
                <p className="text-sm sm:text-base md:text-base text-gray-600 mb-4 sm:mb-5 md:mb-6 font-ios">
                  Expertise professionnelle pour votre déménagement. Équipe qualifiée, matériel adapté et suivi personnalisé.
                </p>
                <ul className="space-y-2 sm:space-y-3 md:space-y-4 mb-4 sm:mb-6 md:mb-8 font-ios text-sm sm:text-base" aria-label="Avantages du déménagement sur mesure">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Équipe professionnelle certifiée
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Matériel de protection inclus
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Assurance responsabilité civile
                  </li>
                </ul>
                <Link
                  href="/catalogue/catalog-demenagement-sur-mesure"
                  className="block w-full text-center px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl font-ios text-sm sm:text-base min-h-[44px] sm:min-h-auto"
                  aria-label="Commencer un devis déménagement sur mesure"
                >
                  Devis gratuit
                </Link>
              </div>
            </article>

            {/* Nettoyage Sur Mesure */}
            <article className="card-ios relative hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-2.5 sm:px-3 md:px-3 py-0.5 sm:py-1 text-xs sm:text-sm md:text-sm font-semibold rounded-bl-lg">
                SUR MESURE
              </div>
              <div className="p-4 sm:p-6 md:p-8">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 font-ios-semibold">Nettoyage Sur Mesure</h3>
                <p className="text-sm sm:text-base md:text-base text-gray-600 mb-4 sm:mb-5 md:mb-6 font-ios">
                  Service personnalisé pour tous vos besoins de nettoyage. Produits écologiques et techniques professionnelles.
                </p>
                <ul className="space-y-2 sm:space-y-3 md:space-y-4 mb-4 sm:mb-6 md:mb-8 font-ios text-sm sm:text-base" aria-label="Avantages du nettoyage sur mesure">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Produits écologiques certifiés
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Techniques professionnelles
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Flexibilité des horaires
                  </li>
                </ul>
                <Link
                  href="/catalogue/catalog-menage-sur-mesure"
                  className="block w-full text-center px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-ios text-sm sm:text-base min-h-[44px] sm:min-h-auto"
                  aria-label="Commencer un devis nettoyage sur mesure"
                >
                  Devis gratuit
                </Link>
              </div>
            </article>

            {/* Forfaits Personnalisables */}
            <article className="card-ios relative hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 bg-purple-600 text-white px-2.5 sm:px-3 md:px-3 py-0.5 sm:py-1 text-xs sm:text-sm md:text-sm font-semibold rounded-bl-lg">
                FORFAITS
              </div>
              <div className="p-4 sm:p-6 md:p-8">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 font-ios-semibold">Forfaits Personnalisables</h3>
                <p className="text-sm sm:text-base md:text-base text-gray-600 mb-4 sm:mb-5 md:mb-6 font-ios">
                  Services avec prix fixes et options personnalisables pour répondre à vos besoins spécifiques. Tarification transparente.
                </p>
                <ul className="space-y-2 sm:space-y-3 md:space-y-4 mb-4 sm:mb-6 md:mb-8 font-ios text-sm sm:text-base" aria-label="Avantages des forfaits personnalisables">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Prix fixes et transparents
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Options personnalisables
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Services variés disponibles
                  </li>
                </ul>
                <Link
                  href="/catalogue"
                  className="block w-full text-center px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-ios text-sm sm:text-base min-h-[44px] sm:min-h-auto"
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
      <section className="py-6 sm:py-8 md:py-10 lg:py-12 bg-white" aria-labelledby="why-choose-heading">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 font-ios-bold" id="why-choose-heading">Pourquoi nous choisir</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 font-ios px-2">Des services professionnels avec une approche personnalisée et transparente</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {/* Expertise Professionnelle */}
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-emerald-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 font-ios-semibold">Expertise Professionnelle</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 font-ios px-2">Équipes certifiées et formées aux meilleures pratiques du secteur</p>
            </div>

            {/* Tarification Transparente */}
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 font-ios-semibold">Tarification Transparente</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 font-ios px-2">Détail complet de chaque coût : transport, main-d'œuvre, contraintes, options. Aucun frais caché.</p>
            </div>

            {/* Flexibilité */}
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-purple-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 font-ios-semibold">Flexibilité Totale</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 font-ios px-2">Services adaptés à vos horaires et contraintes spécifiques</p>
            </div>

            {/* Satisfaction Garantie */}
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-orange-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 font-ios-semibold">Satisfaction Garantie</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 font-ios px-2">Engagement qualité avec suivi personnalisé et garantie</p>
            </div>
          </div>

          {/* Statistiques */}
          <div className="mt-10 sm:mt-12 md:mt-14 lg:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-600 mb-1 sm:mb-2 font-ios-bold">1000+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 font-ios">Clients satisfaits</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 mb-1 sm:mb-2 font-ios-bold">24/7</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 font-ios">Support client</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-600 mb-1 sm:mb-2 font-ios-bold">5★</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 font-ios">Note moyenne</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Innovation - Transparence totale */}
      <section className="py-6 sm:py-8 md:py-10 lg:py-12 bg-gradient-to-br from-emerald-50 to-blue-50" aria-labelledby="innovation-heading">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-100 to-blue-100 text-gray-800 px-3 sm:px-4 md:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm md:text-sm font-semibold mb-3 sm:mb-4">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Innovation Exclusive - Transparence Totale
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 font-ios-bold" id="innovation-heading">Transparence totale : Voir exactement ce que vous payez</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 font-ios max-w-3xl mx-auto px-2">Chaque coût est détaillé : transport, main-d'œuvre, contraintes d'accès, options. Comparez 6 formules adaptées à votre situation. Aucun frais caché.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            {/* Contenu gauche */}
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 font-ios-semibold">Pourquoi c'est révolutionnaire ?</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base font-ios-semibold">Détail complet de tous les coûts</h4>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 font-ios">Transport, main-d'œuvre, contraintes d'accès, options... Chaque élément de votre devis est expliqué clairement. Aucun frais caché.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base font-ios-semibold">6 formules adaptées à votre situation</h4>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 font-ios">Comparez Éco, Standard, Confort, Sécurité, Premium et Flexible. Chaque formule est adaptée à vos besoins spécifiques avec recommandation personnalisée.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base font-ios-semibold">Prix mis à jour en temps réel</h4>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 font-ios">Modifiez vos options et voyez le prix se mettre à jour instantanément. Pas de surprise, vous savez exactement ce que vous payez.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base font-ios-semibold">Devis en 2 minutes vs 24-48h ailleurs</h4>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 font-ios">Pendant que la concurrence vous fait attendre des jours, nous vous donnons votre devis détaillé instantanément. 95% de temps économisé.</p>
                  </div>
                </div>
              </div>
      </div>

            {/* Contenu droite - Comparaison */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg sm:text-xl md:text-xl font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 text-center font-ios-semibold">Notre engagement : Transparence totale</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800 text-sm sm:text-base font-ios-semibold">Aucun frais caché</h4>
                      <p className="text-[10px] sm:text-xs text-emerald-600 font-ios">Tous les coûts sont visibles dès le départ</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-base sm:text-lg font-bold">6</span>
                    </div>
                  <div>
                      <h4 className="font-semibold text-blue-800 text-sm sm:text-base font-ios-semibold">Formules comparables</h4>
                      <p className="text-[10px] sm:text-xs text-blue-600 font-ios">Éco, Standard, Confort, Sécurité...</p>
                    </div>
                  </div>
                  </div>
                <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                </div>
                  <div>
                      <h4 className="font-semibold text-purple-800 text-sm sm:text-base font-ios-semibold">Détail de chaque coût</h4>
                      <p className="text-[10px] sm:text-xs text-purple-600 font-ios">Transport, main-d'œuvre, contraintes...</p>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                  <div className="text-2xl sm:text-3xl md:text-3xl font-bold text-orange-600 font-ios-bold mb-1">2 min</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-ios">vs 24-48h ailleurs</div>
                  <div className="text-[10px] sm:text-xs text-orange-600 font-ios-semibold mt-2">95% de temps économisé</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Comment ça marche */}
      <section className="py-6 sm:py-8 md:py-10 lg:py-12 bg-gray-50" aria-labelledby="process-heading">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 font-ios-bold" id="process-heading">Comment ça marche : Simple et transparent</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 font-ios px-2">Un système intelligent qui calcule votre devis en analysant chaque détail de votre situation</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg" aria-hidden="true">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 font-ios-semibold">Devis instantané</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 font-ios px-2">Répondez à quelques questions et obtenez votre devis détaillé en temps réel avec tous les coûts expliqués</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg" aria-hidden="true">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 font-ios-semibold">6 formules adaptées</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 font-ios px-2">Comparez 6 formules (Éco à Premium) avec recommandation personnalisée selon votre situation</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg" aria-hidden="true">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 font-ios-semibold">Transparence totale</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 font-ios px-2">Chaque coût est expliqué clairement : transport, main-d'œuvre, contraintes d'accès, options, assurance. Aucun frais caché.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg" aria-hidden="true">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 font-ios-semibold">Satisfaction garantie</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 font-ios px-2">Service réalisé avec facturation transparente et suivi en temps réel</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 py-6 sm:py-8 md:py-8" aria-labelledby="cta-heading">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 font-ios-bold" id="cta-heading">
            Prêt à commencer ?
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-xl text-emerald-100 mb-6 sm:mb-8 max-w-3xl mx-auto font-ios px-2">
            Obtenez votre devis instantané et bénéficiez de nos services professionnels dès aujourd'hui.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/catalogue/catalog-demenagement-sur-mesure"
              className="inline-flex items-center justify-center px-6 sm:px-7 md:px-8 py-2.5 sm:py-3 border border-transparent text-sm sm:text-base md:text-base font-medium rounded-xl text-emerald-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl font-ios min-h-[44px] sm:min-h-auto"
            >
              Déménagement sur mesure
            </Link>
            <Link
              href="/catalogue/catalog-menage-sur-mesure"
              className="inline-flex items-center justify-center px-6 sm:px-7 md:px-8 py-2.5 sm:py-3 border border-white text-sm sm:text-base md:text-base font-medium rounded-xl text-white hover:bg-white hover:text-emerald-700 transition-all duration-200 font-ios min-h-[44px] sm:min-h-auto"
            >
              Ménage sur mesure
            </Link>
           </div>

           {/* Note sur les conditions tarifaires */}
           <div className="mt-6 sm:mt-8 max-w-4xl mx-auto px-2">
             <p className="text-[10px] sm:text-xs md:text-xs text-emerald-100 text-center font-ios leading-relaxed">
               * Les prix peuvent varier selon les contraintes spécifiques de votre logement (escaliers étroits, absence d'ascenseur, sols fragiles, etc.).
               Notre système de devis en temps réel vous fournit une estimation précise, avec possibilité d'ajustement lors de l'intervention si nécessaire.
             </p>
           </div>
         </div>
       </section>
     </div>
   )
}
