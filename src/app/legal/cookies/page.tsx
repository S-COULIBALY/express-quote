import { Metadata } from "next"
import Link from "next/link"
import { getLegalInformation } from "@/actions/adminLegal"

export const metadata: Metadata = {
  title: "Politique des Cookies | Express Quote",
  description: "Politique d'utilisation des cookies sur le site Express Quote",
}

export default async function CookiesPolicyPage() {
  // Récupérer les informations légales depuis la Server Action
  const legalInfo = await getLegalInformation()

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Politique des Cookies
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Comment nous utilisons les cookies sur notre site
          </p>
        </div>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Qu'est-ce qu'un cookie ?</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Un cookie est un petit fichier texte qui est stocké sur votre ordinateur ou appareil mobile lorsque vous visitez un site web. Les cookies sont largement utilisés par les propriétaires de sites web pour faire fonctionner leurs sites, ou pour les faire fonctionner plus efficacement, ainsi que pour fournir des informations de rapport.
            </p>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Comment utilisons-nous les cookies ?</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              {legalInfo.companyName} utilise des cookies pour plusieurs raisons. Voici les principaux types de cookies que nous utilisons :
            </p>
            <h3 className="font-bold">Cookies essentiels</h3>
            <p>
              Ces cookies sont nécessaires au fonctionnement de notre site web. Ils comprennent, par exemple, les cookies qui vous permettent de vous connecter à des zones sécurisées de notre site web, d'utiliser un panier d'achat ou d'utiliser des services de facturation électronique.
            </p>
            <h3 className="font-bold">Cookies analytiques/de performance</h3>
            <p>
              Ils nous permettent de reconnaître et de compter le nombre de visiteurs et de voir comment les visiteurs se déplacent sur notre site web lorsqu'ils l'utilisent. Cela nous aide à améliorer le fonctionnement de notre site web, par exemple en nous assurant que les utilisateurs trouvent facilement ce qu'ils recherchent.
            </p>
            <h3 className="font-bold">Cookies de fonctionnalité</h3>
            <p>
              Ces cookies sont utilisés pour vous reconnaître lorsque vous revenez sur notre site web. Cela nous permet de personnaliser notre contenu pour vous, de vous saluer par votre nom et de mémoriser vos préférences (par exemple, votre choix de langue ou de région).
            </p>
            <h3 className="font-bold">Cookies de ciblage</h3>
            <p>
              Ces cookies enregistrent votre visite sur notre site web, les pages que vous avez visitées et les liens que vous avez suivis. Nous utiliserons ces informations pour rendre notre site web et la publicité qui y est affichée plus pertinents pour vos intérêts.
            </p>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Comment gérer les cookies ?</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Vous pouvez paramétrer votre navigateur pour qu'il refuse tous les cookies ou pour qu'il vous avertisse lorsqu'un cookie est envoyé. Toutefois, si vous n'acceptez pas les cookies, il se peut que vous ne puissiez pas utiliser certaines parties de notre site.
            </p>
            <p>
              Voici comment modifier vos paramètres de cookies dans les principaux navigateurs :
            </p>
            <ul>
              <li>Chrome : Paramètres &gt; Confidentialité et sécurité &gt; Cookies et autres données de site</li>
              <li>Firefox : Options &gt; Vie privée et sécurité &gt; Protection contre le pistage</li>
              <li>Safari : Préférences &gt; Confidentialité</li>
              <li>Edge : Paramètres &gt; Confidentialité, recherche et services &gt; Autorisations</li>
            </ul>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Cookies tiers</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              En plus de nos propres cookies, nous pouvons également utiliser divers cookies tiers pour signaler les statistiques d'utilisation du site, diffuser des publicités, etc. Ces cookies sont susceptibles de suivre votre navigation sur d'autres sites si vous avez un compte actif et êtes connecté à leur service.
            </p>
            <p>
              Les services tiers que nous utilisons comprennent :
            </p>
            <ul>
              <li>Google Analytics (analytique)</li>
              <li>Google Ads (publicité)</li>
              <li>Facebook Pixel (publicité)</li>
              <li>Hotjar (analytique)</li>
            </ul>
          </div>
        </section>

        <section className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Modifications de notre politique de cookies</h2>
          </div>
          <div className="p-6 prose prose-slate max-w-none">
            <p>
              Toute modification que nous pourrions apporter à notre politique de cookies à l'avenir sera publiée sur cette page. Veuillez vérifier fréquemment pour voir les mises à jour ou les changements apportés à notre politique de cookies.
            </p>
          </div>
        </section>

        {/* Liens de navigation */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Link 
            href="/legal" 
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 shadow-sm transition-colors"
          >
            Mentions légales
          </Link>
          <Link 
            href="/legal/privacy" 
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 shadow-sm transition-colors"
          >
            Politique de confidentialité
          </Link>
          <Link 
            href="/legal/terms" 
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 shadow-sm transition-colors"
          >
            Conditions générales
          </Link>
        </div>
      </div>
    </div>
  )
} 