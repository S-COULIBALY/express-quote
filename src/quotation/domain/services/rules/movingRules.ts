import { Money } from '../../valueObjects/Money';

export const movingRules = {
    rules: [
        // Règles avec pourcentage
        {
            name: "Réduction pour petit volume",
            percentage: -10, // -10% (réduction ajustée)
            condition: (context: any) => context.volume < 10
        },
        {
            name: "Réduction pour grand volume",
            percentage: -5, // -5% (réduction ajustée)
            condition: (context: any) => context.volume > 50
        },
        {
            name: "Majoration week-end",
            percentage: 25, // +25%
            condition: (context: any) => {
                const date = new Date(context.movingDate);
                return date.getDay() === 0 || date.getDay() === 6; // Dimanche ou samedi
            }
        },
        {
            name: "Majoration haute saison",
            percentage: 30, // +30%
            condition: (context: any) => {
                const date = new Date(context.movingDate);
                const month = date.getMonth() + 1; // getMonth() retourne 0-11
                return month >= 6 && month <= 9; // Juin à Septembre
            }
        },

        // Règles d'accès (séparées pour départ et arrivée)
        {
            name: "Location monte-meuble (départ, après 3ᵉ étage)",
            amount: 100, // Forfait pour la location d'un monte-meuble
            condition: (context: any) => 
                !context.pickupElevator && context.pickupFloor > 3
        },
        {
            name: "Location monte-meuble (arrivée, après 3ᵉ étage)",
            amount: 100, // Forfait pour la location d'un monte-meuble
            condition: (context: any) => 
                !context.deliveryElevator && context.deliveryFloor > 3
        },
        {
            name: "Majoration pour distance de portage (départ)",
            amount: 30, // Forfait pour distance de portage > 100 mètres
            condition: (context: any) => context.pickupCarryDistance > 100
        },
        {
            name: "Majoration pour distance de portage (arrivée)",
            amount: 30, // Forfait pour distance de portage > 100 mètres
            condition: (context: any) => context.deliveryCarryDistance > 100
        },
        {
            name: "Majoration étages sans ascenseur (départ)",
            amount: 5, // 5€ par étage
            condition: (context: any) => 
                !context.pickupElevator && 
                context.pickupFloor > 0 && 
                context.pickupFloor <= 3 // Jusqu'au 3ᵉ étage
        },
        {
            name: "Majoration étages sans ascenseur (arrivée)",
            amount: 5, // 5€ par étage
            condition: (context: any) => 
                !context.deliveryElevator && 
                context.deliveryFloor > 0 && 
                context.deliveryFloor <= 3 // Jusqu'au 3ᵉ étage
        },
        {
            name: "Majoration pour escaliers étroits (départ)",
            amount: 50, // Forfait pour escaliers étroits
            condition: (context: any) => 
                context.pickupNarrowStairs && 
                !context.pickupElevator && 
                context.pickupFloor <= 3 // Jusqu'au 3ᵉ étage
        },
        {
            name: "Majoration pour escaliers étroits (arrivée)",
            amount: 50, // Forfait pour escaliers étroits
            condition: (context: any) => 
                context.deliveryNarrowStairs && 
                !context.deliveryElevator && 
                context.deliveryFloor <= 3 // Jusqu'au 3ᵉ étage
        },

        // Règles supplémentaires
        {
            name: "Majoration pour distance longue",
            amount: 1.5, // €/km au-delà de 50 km
            condition: (context: any) => context.distance > 50
        },
        {
            name: "Supplément pour objets fragiles",
            amount: 50, // Forfait ou montant par objet
            condition: (context: any) => context.fragileItems > 0
        },
        {
            name: "Majoration horaire (nuit ou soirée)",
            percentage: 15, // Ex: déménagement après 20h ou avant 8h
            condition: (context: any) => {
                const hour = new Date(context.movingDate).getHours();
                return hour < 8 || hour >= 20;
            }
        },
        {
            name: "Tarif minimum",
            amount: 150,
            condition: (context: any, currentPrice: Money) => currentPrice.getAmount() < 150
        }
    ]
};