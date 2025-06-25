'use client';

import React from 'react';

const NotificationTimeline = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Flux de Notifications et Documents
        </h1>

        {/* En-têtes fixes */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-blue-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-blue-500 text-2xl">📧</span>
              <h2 className="text-xl font-semibold text-blue-900">Notifications Email & Documents</h2>
            </div>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-green-500 text-2xl">💬</span>
              <h2 className="text-xl font-semibold text-green-900">Notifications WhatsApp</h2>
            </div>
          </div>
        </div>

        {/* Timeline avec ligne centrale */}
        <div className="relative">
          {/* Ligne verticale centrale */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>

          {timelineSteps.map((step, index) => (
            <div key={step.id} className="relative mb-12">
              {/* Point central de l'étape */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-gray-500 border-4 border-white shadow-lg z-20">
                <span className="absolute top-8 left-1/2 transform -translate-x-1/2 text-sm font-semibold text-gray-600 whitespace-nowrap">
                  Étape {step.id}
                </span>
              </div>

              {/* Conteneur des deux colonnes */}
              <div className="grid grid-cols-2 gap-8 pt-16">
                {/* Colonne Email */}
                <div className="pr-8">
                  <div className="bg-white p-4 rounded-lg shadow-lg border border-blue-100">
                    <div className="flex items-center space-x-2 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    </div>

                    {/* Documents section */}
                    {step.documents && step.documents.length > 0 && (
                      <div className="mb-4 bg-orange-50 p-3 rounded-md">
                        <div className="flex items-center mb-2">
                          <span className="text-orange-500 mr-2">📄</span>
                          <span className="font-semibold text-orange-800">Documents</span>
                        </div>
                        <ul className="space-y-1">
                          {step.documents.map((doc, i) => (
                            <li key={i} className="flex items-start space-x-2 text-sm text-orange-700">
                              <span>•</span>
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Notifications section */}
                    <div className="space-y-2">
                      {step.email.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                          <span className="text-blue-500">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Colonne WhatsApp */}
                <div className="pl-8">
                  <div className="bg-white p-4 rounded-lg shadow-lg border border-green-100">
                    <div className="flex items-center space-x-2 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                      {step.hasQuickActions && (
                        <div className="flex items-center text-green-500 text-sm">
                          <span className="mr-1">🔔</span>
                          <span>Action rapide</span>
                        </div>
                      )}
                    </div>

                    {/* Documents section pour WhatsApp */}
                    {step.whatsappDocuments && step.whatsappDocuments.length > 0 && (
                      <div className="mb-4 bg-orange-50 p-3 rounded-md">
                        <div className="flex items-center mb-2">
                          <span className="text-orange-500 mr-2">📄</span>
                          <span className="font-semibold text-orange-800">Documents</span>
                        </div>
                        <ul className="space-y-1">
                          {step.whatsappDocuments.map((doc, i) => (
                            <li key={i} className="flex items-start space-x-2 text-sm text-orange-700">
                              <span>•</span>
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Notifications section */}
                    <div className="space-y-2">
                      {step.whatsapp.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                          <span className="text-green-500">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ligne de connexion vers l'étape suivante */}
              {index < timelineSteps.length - 1 && (
                <div className="absolute left-1/2 transform -translate-x-1/2 top-24 h-[calc(100%-4rem)] w-1 bg-gray-100"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const timelineSteps = [
  {
    id: 1,
    title: "Demande de Devis",
    hasQuickActions: true,
    documents: [],
    whatsappDocuments: [],
    email: [
      "Confirmation de réception",
      "Numéro de devis",
      "Type de service",
      "Notification équipe commerciale"
    ],
    whatsapp: [
      "Confirmation instantanée",
      "Numéro de devis",
      "Type de service"
    ]
  },
  {
    id: 2,
    title: "Confirmation de Devis",
    hasQuickActions: true,
    documents: [
      "Devis détaillé au format PDF",
      "Conditions générales de vente",
      "Fiche descriptive des services"
    ],
    whatsappDocuments: [
      "Devis détaillé au format PDF",
      "Conditions générales de vente"
    ],
    email: [
      "Devis détaillé en PDF",
      "Montant total",
      "Lien de paiement",
      "Copie à la comptabilité"
    ],
    whatsapp: [
      "Confirmation",
      "Montant",
      "Lien de paiement rapide"
    ]
  },
  {
    id: 3,
    title: "Réservation Confirmée",
    hasQuickActions: true,
    documents: [
      "Confirmation de réservation PDF",
      "Facture d'acompte",
      "Guide de préparation"
    ],
    whatsappDocuments: [
      "Confirmation de réservation PDF",
      "Facture d'acompte",
      "Guide de préparation"
    ],
    email: [
      "Numéro de réservation",
      "Date et heure",
      "Adresse",
      "Détails complets du service",
      "Notification prestataire"
    ],
    whatsapp: [
      "Numéro de réservation",
      "Date et heure",
      "Adresse"
    ]
  },
  {
    id: 4,
    title: "Confirmation de Paiement",
    hasQuickActions: true,
    documents: [
      "Facture finale détaillée",
      "Reçu de paiement",
      "Garantie de service"
    ],
    whatsappDocuments: [
      "Facture finale détaillée",
      "Reçu de paiement"
    ],
    email: [
      "Reçu de paiement PDF",
      "Montant payé",
      "Détails transaction",
      "Copie service comptable"
    ],
    whatsapp: [
      "Confirmation paiement",
      "Montant",
      "Numéro transaction"
    ]
  },
  {
    id: 5,
    title: "Rappels de Rendez-vous",
    hasQuickActions: true,
    documents: [
      "Check-list de préparation",
      "Instructions spécifiques"
    ],
    whatsappDocuments: [
      "Check-list de préparation",
      "Instructions spécifiques"
    ],
    email: [
      "Rappel date/heure",
      "Adresse",
      "Instructions détaillées",
      "Contact prestataire"
    ],
    whatsapp: [
      "Rappel date/heure",
      "Adresse",
      "Contact rapide"
    ]
  },
  {
    id: 6,
    title: "Service Terminé",
    hasQuickActions: true,
    documents: [
      "Rapport de service",
      "Facture finale",
      "Certificat de garantie",
      "Enquête de satisfaction"
    ],
    whatsappDocuments: [
      "Rapport de service",
      "Facture finale",
      "Certificat de garantie"
    ],
    email: [
      "Remerciements",
      "Lien feedback détaillé",
      "Enquête satisfaction",
      "Offres futures"
    ],
    whatsapp: [
      "Remerciements",
      "Lien rapide feedback",
      "Note rapide"
    ]
  }
];

export default NotificationTimeline; 