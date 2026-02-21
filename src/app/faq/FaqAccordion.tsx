"use client";

import { useState } from "react";
import Link from "next/link";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  id: string;
  icon: string;
  title: string;
  items: FaqItem[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "tarifs",
    icon: "💰",
    title: "Tarifs & Devis",
    items: [
      {
        question: "Quel est le tarif pour un déménagement ?",
        answer:
          "Nos tarifs dépendent du volume à déménager, de la distance entre les deux adresses, des étages, de la présence d'un ascenseur et des options choisies (emballage, démontage/montage, garde-meubles). Obtenez votre tarif exact en 3 minutes avec notre estimateur en ligne — c'est gratuit et sans engagement.",
      },
      {
        question: "Comment calculez-vous le prix ?",
        answer:
          "Le prix est calculé automatiquement selon le volume estimé de vos affaires (m³), la distance entre l'adresse de départ et d'arrivée, les étages et la présence d'un ascenseur, la distance de portage (du camion à la porte), et les options choisies. Notre outil effectue ce calcul instantanément en ligne.",
      },
      {
        question: "Comment obtenir un devis ?",
        answer:
          "Rendez-vous sur express-quote.com, renseignez vos adresses de départ et d'arrivée, indiquez votre date souhaitée et décrivez votre logement. Vous obtenez votre prix en 3 minutes. Le devis est valable 48h et peut être confirmé directement en ligne avec un acompte de 30 % par carte bancaire.",
      },
    ],
  },
  {
    id: "zones",
    icon: "📍",
    title: "Zones & Disponibilités",
    items: [
      {
        question: "Quelles zones géographiques couvrez-vous ?",
        answer:
          "Nous intervenons principalement en Île-de-France et dans les grandes agglomérations françaises. Pour vérifier si votre déménagement est réalisable, entrez vos adresses sur notre site. Si votre zone n'est pas encore couverte, nous vous le signalons immédiatement.",
      },
      {
        question: "Combien de temps à l'avance dois-je réserver ?",
        answer:
          "Nous recommandons de réserver au minimum 15 jours à l'avance pour garantir la disponibilité d'une équipe. En haute saison (mai-septembre), prévoyez 3 à 4 semaines. Pour un déménagement urgent, contactez-nous directement au 07 51 26 20 80.",
      },
      {
        question: "Intervenez-vous le week-end ou les jours fériés ?",
        answer:
          "Oui, nous intervenons le samedi et ponctuellement le dimanche sur demande. Les interventions les week-ends et jours fériés font l'objet d'un supplément (généralement +15 à +25 %). Vérifiez la disponibilité à votre date directement sur notre site.",
      },
    ],
  },
  {
    id: "visite",
    icon: "🏠",
    title: "Visite d'estimation",
    items: [
      {
        question: "La visite d'estimation à domicile est-elle gratuite ?",
        answer:
          "Oui, la visite d'estimation à domicile est entièrement gratuite et sans engagement. Elle dure environ 30 minutes. Notre expert évalue le volume exact de vos affaires, les contraintes d'accès (étages, ascenseur, parking) et vous remet un devis définitif sur place. Pour planifier une visite, contactez-nous avec vos disponibilités — nous intervenons de préférence l'après-midi.",
      },
    ],
  },
  {
    id: "services",
    icon: "📦",
    title: "Services & Prestations",
    items: [
      {
        question: "Que comprend votre service standard ?",
        answer:
          "Notre service standard comprend le chargement et déchargement de vos affaires, le transport entre les deux adresses, la protection des meubles (couvertures, film) et l'assurance de base (responsabilité civile). Options disponibles en supplément : emballage/déballage, démontage et remontage de meubles, garde-meubles, assurance renforcée valeur à neuf.",
      },
      {
        question: "Fournissez-vous les cartons et matériaux d'emballage ?",
        answer:
          "Oui, nous fournissons cartons standards et renforcés, papier bulle et kraft, film plastique et scotch de déménagement, housses pour vêtements et matelas. Les matériaux sont inclus dans les formules avec emballage. En option si vous faites vos cartons vous-même.",
      },
      {
        question: "Puis-je faire mes cartons moi-même ?",
        answer:
          "Absolument. Quelques conseils : étiquetez chaque carton avec la pièce de destination, ne dépassez pas 20 kg par carton, protégez les objets fragiles avec du papier bulle et indiquez « FRAGILE » sur les cartons concernés. Si vous gérez l'emballage vous-même, notre équipe s'occupe uniquement du transport — tarif allégé en conséquence.",
      },
      {
        question: "Déplacez-vous les objets lourds (piano, coffre-fort) ?",
        answer:
          "Oui, nos équipes sont équipées pour déplacer tous types d'objets lourds : piano droit ou à queue, coffre-fort, grands canapés, bibliothèques, armoires. Ces prestations font l'objet d'un tarif spécifique selon le poids et les contraintes d'accès. Précisez ces objets lors de votre devis en ligne.",
      },
      {
        question: "Proposez-vous un service de montage/démontage de meubles ?",
        answer:
          "Oui, en option. Lits, armoires, bibliothèques, dressings, meubles Ikea et autres marques — votre mobilier est démonté, transporté et remonté dans la pièce souhaitée. Cette option peut être ajoutée lors de votre devis en ligne.",
      },
      {
        question: "Proposez-vous un service de garde-meubles / stockage ?",
        answer:
          "Oui. Stockage sécurisé et assuré, durée flexible (de quelques jours à plusieurs mois), accès à vos affaires possible sur rendez-vous. Idéal si votre nouveau logement n'est pas encore disponible ou si vous avez des affaires en surplus.",
      },
    ],
  },
  {
    id: "duree",
    icon: "⏱️",
    title: "Durée & Équipe",
    items: [
      {
        question: "Combien de temps dure un déménagement en moyenne ?",
        answer:
          "La durée varie selon le volume : studio/F1 → 2 à 3 heures, F2/F3 → 4 à 6 heures, F4/maison → 6 à 10 heures, grande maison → 1 à 2 jours. Ces estimations incluent le chargement, le transport et le déchargement. Une estimation de durée précise est incluse dans votre devis en ligne.",
      },
      {
        question: "Combien de déménageurs seront présents le jour J ?",
        answer:
          "Le nombre dépend du volume et de la complexité : studio/F2 → 2 déménageurs, F3/F4 → 3 déménageurs, F5 et plus → 4 déménageurs et plus. Ce nombre est défini lors de votre estimation et inclus dans votre devis. Il ne varie pas le jour J sauf accord préalable.",
      },
    ],
  },
  {
    id: "paiement",
    icon: "💳",
    title: "Paiement & Acompte",
    items: [
      {
        question: "Quels modes de paiement acceptez-vous ?",
        answer:
          "Nous acceptons la carte bancaire en ligne via Stripe, le virement bancaire et le chèque. Le paiement s'effectue en deux temps : 30 % d'acompte à la réservation (en ligne, sécurisé) et 70 % du solde le jour du déménagement. Toutes les transactions en ligne sont sécurisées par Stripe.",
      },
      {
        question: "Comment fonctionne l'acompte ?",
        answer:
          "1️⃣ 30 % à la réservation (en ligne) → confirme votre réservation et bloque le créneau. 2️⃣ 70 % le jour du déménagement → payable par carte, chèque ou virement, réglé directement au chef d'équipe sur place. Aucune mauvaise surprise : le prix final est celui indiqué dans votre devis.",
      },
    ],
  },
  {
    id: "annulation",
    icon: "❌",
    title: "Annulation & Modification",
    items: [
      {
        question: "Puis-je annuler ou modifier ma réservation ?",
        answer:
          "Oui. Modification : gratuite jusqu'à 48h avant le déménagement (sous réserve de disponibilité). Annulation : remboursement intégral de l'acompte si annulation plus de 7 jours avant, remboursement à 50 % entre 3 et 7 jours avant, acompte non remboursable moins de 48h avant. Pour modifier ou annuler : appelez le 07 51 26 20 80 ou répondez à votre email de confirmation.",
      },
    ],
  },
  {
    id: "assurance",
    icon: "🛡️",
    title: "Assurance & Réclamations",
    items: [
      {
        question: "Êtes-vous assurés en cas de dommage ?",
        answer:
          "Oui, tous nos déménagements sont couverts par une assurance responsabilité civile professionnelle. En cas de dommage : signalez-le sur la lettre de voiture au moment de la livraison, confirmez par lettre recommandée dans les 10 jours, notre équipe traite votre réclamation sous 15 jours ouvrés. Nous proposons également une assurance valeur à neuf en option.",
      },
      {
        question:
          "Que faire si des objets sont endommagés pendant le déménagement ?",
        answer:
          "1) Le jour du déménagement : notez les réserves sur la lettre de voiture avant de signer. 2) Dans les 10 jours : confirmez par lettre recommandée avec AR en décrivant les dommages et en joignant des photos. 3) Notre réponse : sous 15 jours ouvrés. Conservez bien votre lettre de voiture — c'est le document contractuel clé. Pour toute réclamation urgente : 07 51 26 20 80.",
      },
    ],
  },
];

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 text-left bg-white hover:bg-gray-50 transition-colors duration-200 min-h-[56px]"
        aria-expanded={isOpen}
      >
        <span className="text-sm sm:text-base font-medium text-gray-900 pr-4 font-ios">
          {question}
        </span>
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
            isOpen ? "bg-emerald-600 rotate-180" : "bg-gray-100"
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 ${isOpen ? "text-white" : "text-gray-500"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 bg-white">
          <div className="pt-1 border-t border-gray-100">
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed font-ios">
              {answer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FaqAccordion() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string>("tarifs");

  const toggle = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalQuestions = FAQ_CATEGORIES.reduce(
    (sum, cat) => sum + cat.items.length,
    0,
  );

  return (
    <>
      {/* Stats bar */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 sm:p-6 mb-8 sm:mb-12">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 font-ios-bold">
              {totalQuestions}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1 font-ios">
              Questions répondues
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 font-ios-bold">
              {FAQ_CATEGORIES.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1 font-ios">
              Catégories
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 font-ios-bold">
              3 min
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1 font-ios">
              Pour un devis
            </div>
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div className="flex gap-2 flex-wrap mb-6 sm:mb-8">
        {FAQ_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              document.getElementById(`cat-${cat.id}`)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 font-ios ${
              activeCategory === cat.id
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          >
            <span>{cat.icon}</span>
            <span className="hidden sm:inline">{cat.title}</span>
            <span className="sm:hidden">{cat.title.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Accordion sections */}
      <div className="space-y-8 sm:space-y-12">
        {FAQ_CATEGORIES.map((category) => (
          <section key={category.id} id={`cat-${category.id}`}>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <span className="text-2xl">{category.icon}</span>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-ios-bold">
                {category.title}
              </h2>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-ios">
                {category.items.length} question
                {category.items.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {category.items.map((item, idx) => {
                const key = `${category.id}-${idx}`;
                return (
                  <AccordionItem
                    key={key}
                    question={item.question}
                    answer={item.answer}
                    isOpen={!!openItems[key]}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* CTA bottom */}
      <div className="mt-12 sm:mt-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 sm:p-10 text-center text-white">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 font-ios-bold">
          Vous n'avez pas trouvé votre réponse ?
        </h2>
        <p className="text-emerald-100 text-sm sm:text-base mb-6 font-ios">
          Notre équipe répond à toutes vos questions sous 30 minutes en semaine.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-emerald-700 rounded-xl font-medium text-sm sm:text-base hover:bg-emerald-50 transition-colors duration-200 shadow-md font-ios min-h-[44px]"
          >
            Nous contacter
          </Link>
          <Link
            href="/catalogue"
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium text-sm sm:text-base hover:bg-emerald-400 transition-colors duration-200 font-ios min-h-[44px]"
          >
            Obtenir un devis
          </Link>
        </div>
        <p className="mt-4 text-emerald-200 text-sm font-ios">
          📞 07 51 26 20 80 — Lun–Sam 8h–20h
        </p>
      </div>
    </>
  );
}
