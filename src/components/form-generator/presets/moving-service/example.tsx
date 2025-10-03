"use client";

import React from "react";
import { FormGenerator, FormConfig } from "../../";
import { DefaultValues } from '@/quotation/domain/configuration/DefaultValues';

const movingFormConfig: FormConfig = {
  preset: "moving", // ✨ Utilise automatiquement defaultValues, styles et summary
  title: "Devis de déménagement",
  description: "Obtenez un devis personnalisé pour votre déménagement",
  serviceType: "moving",
  
  layout: {
    type: "sidebar",
    autoSummary: "moving" // Sidebar automatique avec le preset moving
  },

  sections: [
    {
      title: "📅 Date et heure",
      fields: [
        {
          name: "scheduledDate",
          type: "date",
          label: "Date souhaitée",
          required: true,
          validation: {
            min: new Date().toISOString().split('T')[0] // Pas de date dans le passé
          } as any
        },
        {
          name: "timeSlot",
          type: "select",
          label: "Créneau horaire",
          required: true,
          options: [
            { value: "morning", label: "Matin (8h-12h)" },
            { value: "afternoon", label: "Après-midi (13h-17h)" },
            { value: "evening", label: "Soirée (18h-20h)" }
          ]
        }
      ]
    },
    
    {
      title: "🟢 Adresse de départ",
      className: "pickup-section",
      fields: [
        {
          name: "pickupAddress",
          type: "address-pickup",
          label: "🟢 Adresse de départ",
          required: true,
          columnSpan: 2,
          className: "pickup-field"
        },
        {
          name: "pickupFloor",
          type: "select",
          label: "Étage",
          required: true,
          className: "pickup-field",
          options: [
            { value: "0", label: "Rez-de-chaussée" },
            { value: "1", label: "1er étage" },
            { value: "2", label: "2ème étage" },
            { value: "3", label: "3ème étage" },
            { value: "4", label: "4ème étage" },
            { value: "5", label: "5ème étage et plus" }
          ]
        },
        {
          name: "pickupElevator",
          type: "select",
          label: "Ascenseur disponible",
          required: true,
          className: "pickup-field",
          options: [
            { value: "yes", label: "Oui" },
            { value: "no", label: "Non" }
          ]
        },

        {
          name: "pickupHighFloorWarning",
          type: "checkbox",
          label: "⚠️ Portage difficile (étage élevé sans ascenseur)",
          className: "pickup-field",
          conditional: {
            dependsOn: "pickupElevator",
            condition: (value, formData) => value === "no" && parseInt(formData?.pickupFloor || "0") > DefaultValues.FURNITURE_LIFT_WARNING_THRESHOLD
          }
        },
        {
          name: "pickupFurnitureLift",
          type: "checkbox",
          label: "🏗️ Monte-meuble OBLIGATOIRE (nouvelle logique économique)",
          className: "pickup-field",
          conditional: {
            dependsOn: "pickupElevator",
            condition: (value: any, formData: any) => {
              const floor = parseInt(formData?.pickupFloor || "0");
              const elevator = value || 'no';
              const constraints = formData?.pickupLogisticsConstraints || [];
              const services = formData?.additionalServices || [];
              
              // 🎯 NOUVELLE LOGIQUE ÉCONOMIQUE
              const ascenseur_present = elevator && elevator !== 'no';
              const ascenseur_type = elevator || 'no';
              
              // Contraintes d'ascenseur
              const ascenseur_indisponible = constraints.includes('elevator_unavailable');
              const ascenseur_inadapte = constraints.includes('elevator_unsuitable_size');
              const ascenseur_interdit_demenagement = constraints.includes('elevator_forbidden_moving');
              
              // Contraintes d'accès
              const escalier_difficile = constraints.includes('difficult_stairs');
              const couloirs_etroits = constraints.includes('narrow_corridors');
              const sortie_indirecte = constraints.includes('indirect_exit');
              
              // Services/objets
              const meubles_encombrants = services.includes('bulky_furniture');
              const objet_tres_lourd = services.includes('fragile_valuable_items') || services.includes('heavy_items');
              
              // CAS 1: Ascenseur medium/large fonctionnel → PAS de monte-meuble
              if (ascenseur_present && ['medium', 'large'].includes(ascenseur_type) &&
                  !ascenseur_indisponible && !ascenseur_inadapte && !ascenseur_interdit_demenagement) {
                return false;
              }
              
              // CAS 2: Ascenseur small avec contraintes spécifiques
              if (ascenseur_present && ascenseur_type === 'small' &&
                  !ascenseur_indisponible && !ascenseur_inadapte && !ascenseur_interdit_demenagement &&
                  (escalier_difficile || couloirs_etroits || sortie_indirecte) &&
                  floor >= 1 &&
                  (meubles_encombrants || objet_tres_lourd)) {
                return true;
              }
              
              // CAS 3: Aucun ascenseur avec contraintes
              if (!ascenseur_present &&
                  (escalier_difficile || couloirs_etroits || sortie_indirecte) &&
                  ((floor > 3 && !meubles_encombrants && !objet_tres_lourd) ||
                   (floor >= 1 && (meubles_encombrants || objet_tres_lourd)))) {
                return true;
              }
              
              // CAS 4: Ascenseur indisponible/inadapté/interdit → Traiter comme "aucun ascenseur"
              if (ascenseur_indisponible || ascenseur_inadapte || ascenseur_interdit_demenagement) {
                if ((escalier_difficile || couloirs_etroits || sortie_indirecte) &&
                    ((floor > 3 && !meubles_encombrants && !objet_tres_lourd) ||
                     (floor >= 1 && (meubles_encombrants || objet_tres_lourd)))) {
                  return true;
                }
              }
              
              return false;
            },
            validation: {
              required: true
            }
          }
        },
        {
          name: "pickupLogisticsConstraints",
          type: "logistics-modal",
          label: "Difficultés d'accès - Départ",
          columnSpan: 2,
          componentProps: {
            id: "pickup",
            modalTitle: "Difficultés d'accès au départ"
          }
        }
      ]
    },
    
    {
      title: "🔵 Adresse d'arrivée",
      className: "delivery-section",
      fields: [
        {
          name: "deliveryAddress",
          type: "address-delivery",
          label: "🔵 Adresse d'arrivée",
          required: true,
          columnSpan: 2,
          className: "delivery-field"
        },
        {
          name: "deliveryFloor",
          type: "select",
          label: "Étage",
          required: true,
          className: "delivery-field",
          options: [
            { value: "0", label: "Rez-de-chaussée" },
            { value: "1", label: "1er étage" },
            { value: "2", label: "2ème étage" },
            { value: "3", label: "3ème étage" },
            { value: "4", label: "4ème étage" },
            { value: "5", label: "5ème étage et plus" }
          ]
        },
        {
          name: "deliveryElevator",
          type: "select",
          label: "Ascenseur disponible",
          required: true,
          className: "delivery-field",
          options: [
            { value: "yes", label: "Oui" },
            { value: "no", label: "Non" }
          ]
        },
        {
          name: "deliveryHighFloorWarning",
          type: "checkbox",
          label: "⚠️ Portage difficile (étage élevé sans ascenseur)",
          className: "delivery-field",
          conditional: {
            dependsOn: "deliveryElevator",
            condition: (value, formData) => value === "no" && parseInt(formData?.deliveryFloor || "0") > DefaultValues.FURNITURE_LIFT_WARNING_THRESHOLD
          }
        },
        {
          name: "deliveryFurnitureLift",
          type: "checkbox",
          label: "🏗️ Monte-meuble OBLIGATOIRE (nouvelle logique économique)",
          className: "delivery-field",
          conditional: {
            dependsOn: "deliveryElevator",
            condition: (value: any, formData: any) => {
              const floor = parseInt(formData?.deliveryFloor || "0");
              const elevator = value || 'no';
              const constraints = formData?.deliveryLogisticsConstraints || [];
              const services = formData?.additionalServices || [];
              
              // 🎯 NOUVELLE LOGIQUE ÉCONOMIQUE
              const ascenseur_present = elevator && elevator !== 'no';
              const ascenseur_type = elevator || 'no';
              
              // Contraintes d'ascenseur
              const ascenseur_indisponible = constraints.includes('elevator_unavailable');
              const ascenseur_inadapte = constraints.includes('elevator_unsuitable_size');
              const ascenseur_interdit_demenagement = constraints.includes('elevator_forbidden_moving');
              
              // Contraintes d'accès
              const escalier_difficile = constraints.includes('difficult_stairs');
              const couloirs_etroits = constraints.includes('narrow_corridors');
              const sortie_indirecte = constraints.includes('indirect_exit');
              
              // Services/objets
              const meubles_encombrants = services.includes('bulky_furniture');
              const objet_tres_lourd = services.includes('fragile_valuable_items') || services.includes('heavy_items');
              
              // CAS 1: Ascenseur medium/large fonctionnel → PAS de monte-meuble
              if (ascenseur_present && ['medium', 'large'].includes(ascenseur_type) &&
                  !ascenseur_indisponible && !ascenseur_inadapte && !ascenseur_interdit_demenagement) {
                return false;
              }
              
              // CAS 2: Ascenseur small avec contraintes spécifiques
              if (ascenseur_present && ascenseur_type === 'small' &&
                  !ascenseur_indisponible && !ascenseur_inadapte && !ascenseur_interdit_demenagement &&
                  (escalier_difficile || couloirs_etroits || sortie_indirecte) &&
                  floor >= 1 &&
                  (meubles_encombrants || objet_tres_lourd)) {
                return true;
              }
              
              // CAS 3: Aucun ascenseur avec contraintes
              if (!ascenseur_present &&
                  (escalier_difficile || couloirs_etroits || sortie_indirecte) &&
                  ((floor > 3 && !meubles_encombrants && !objet_tres_lourd) ||
                   (floor >= 1 && (meubles_encombrants || objet_tres_lourd)))) {
                return true;
              }
              
              // CAS 4: Ascenseur indisponible/inadapté/interdit → Traiter comme "aucun ascenseur"
              if (ascenseur_indisponible || ascenseur_inadapte || ascenseur_interdit_demenagement) {
                if ((escalier_difficile || couloirs_etroits || sortie_indirecte) &&
                    ((floor > 3 && !meubles_encombrants && !objet_tres_lourd) ||
                     (floor >= 1 && (meubles_encombrants || objet_tres_lourd)))) {
                  return true;
                }
              }
              
              return false;
            },
            validation: {
              required: true
            }
          }
        },
        {
          name: "deliveryLogisticsConstraints",
          type: "logistics-modal",
          label: "Difficultés d'accès - Arrivée",
          columnSpan: 2,
          componentProps: {
            id: "delivery",
            modalTitle: "Difficultés d'accès à l'arrivée"
          }
        }
      ]
    },

    {
      title: "🏠 Détails du logement",
      fields: [
        {
          name: "propertyType",
          type: "select",
          label: "Type de logement",
          required: true,
          options: [
            { value: "apartment", label: "Appartement" },
            { value: "house", label: "Maison" },
            { value: "office", label: "Bureau" }
          ]
        },
        {
          name: "surface",
          type: "number",
          label: "Surface (m²)",
          validation: {
            min: 10,
            max: 1000
          }
        },
        {
          name: "rooms",
          type: "number",
          label: "Nombre de pièces",
          validation: {
            min: 1,
            max: 20
          }
        }
      ]
    },

    {
      title: "⭐ Services supplémentaires",
      conditional: {
        dependsOn: "wantsAdditionalServices",
        condition: (value) => value === true
      },
      columns: 3,
      fields: [
        {
          name: "wantsAdditionalServices",
          type: "checkbox",
          label: "Je souhaite des services supplémentaires",
          columnSpan: 3
        },
        {
          name: "packaging",
          type: "checkbox",
          label: "📦 Emballage professionnel"
        },
        {
          name: "furniture",
          type: "checkbox", 
          label: "🪑 Montage/démontage mobilier"
        },
        {
          name: "fragile",
          type: "checkbox",
          label: "🛡️ Assurance objets fragiles"
        },
        {
          name: "storage",
          type: "checkbox",
          label: "📦 Stockage temporaire"
        },
        {
          name: "supplies",
          type: "checkbox",
          label: "📋 Fournitures d'emballage"
        },
        {
          name: "fragileItems",
          type: "checkbox",
          label: "🏺 Manutention objets d'art"
        }
      ]
    },

    {
      title: "📞 Vos coordonnées",
      fields: [
        {
          name: "email",
          type: "email",
          label: "Email",
          required: true
        },
        {
          name: "phone",
          type: "text",
          label: "Téléphone",
          required: true
        },
        {
          name: "whatsappOptIn",
          type: "whatsapp-consent",
          label: "Notifications WhatsApp",
          columnSpan: 2
        }
      ]
    },

    {
      title: "💬 Commentaires",
      fields: [
        {
          name: "additionalComments",
          type: "textarea",
          label: "Informations complémentaires",
          columnSpan: 2
        }
      ]
    }
  ],

  onSubmit: async (data) => {
    console.log("Données du déménagement:", data);
    alert("Devis envoyé avec succès ! Nous vous recontacterons rapidement.");
  },

  submitLabel: "Obtenir mon devis",
  cancelLabel: "Effacer"
};

export const MovingFormExample: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            🚚 Service: {movingFormConfig.serviceType}
          </span>
        </div>
      </div>
      <FormGenerator config={movingFormConfig} />
    </div>
  );
}; 