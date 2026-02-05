/**
 * QuoteScenario - Scénario de devis avec stratégie marketing
 *
 * Permet de générer plusieurs devis parallèles avec des stratégies différentes
 * (marge, modules activés, overrides)
 */

import { QuoteContext } from "../core/QuoteContext";

export interface QuoteScenario {
  /**
   * Identifiant unique du scénario
   */
  id: string;

  /**
   * Libellé client
   */
  label: string;

  /**
   * Description marketing courte
   */
  description: string;

  /**
   * Modules explicitement activés (optionnel)
   * Si vide, tous les modules applicables sont utilisés
   */
  enabledModules?: string[];

  /**
   * Modules explicitement désactivés (optionnel)
   * PRIORITAIRE sur enabledModules
   */
  disabledModules?: string[];

  /**
   * Overrides contrôlés du contexte (optionnel)
   * Permet de modifier certains champs du contexte avant exécution
   */
  overrides?: Partial<QuoteContext>;

  /**
   * Taux de marge à appliquer (0.20 = 20%)
   */
  marginRate: number;

  /**
   * Si true, les sélections cross-selling du client (catalogue) sont appliquées au contexte.
   * Si false ou non défini, seuls les overrides du scénario et les enabled/disabled modules comptent.
   * Un seul scénario utilise la sélection client : FLEX (sur-mesure).
   */
  useClientSelection?: boolean;

  /**
   * Tags marketing pour classification
   */
  tags: string[];
}

/**
 * Les 6 scénarios standards pour multi-offres
 *
 * Chaque scénario définit clairement :
 * - CE QUE LE CLIENT DOIT FAIRE
 * - CE QU'APPORTE LE DÉMÉNAGEUR
 */
export const STANDARD_SCENARIOS: QuoteScenario[] = [
  /**
   * ════════════════════════════════════════════════════════════════════════════
   * SCÉNARIO ECO - L'ESSENTIEL À PETIT PRIX
   * ════════════════════════════════════════════════════════════════════════════
   *
   * ┌─────────────────────────────────────────────────────────────────────────┐
   * │ CE QUE LE CLIENT FAIT                                                   │
   * ├─────────────────────────────────────────────────────────────────────────┤
   * │ • Emballe TOUTES ses affaires lui-même                                  │
   * │ • Fournit ses propres cartons et protections                            │
   * │ • Démonte TOUS les meubles lui-même                                     │
   * │ • Vide totalement le logement avant l'arrivée des déménageurs           │
   * │ • Gère son stress et le timing de préparation                           │
   * └─────────────────────────────────────────────────────────────────────────┘
   *
   * ┌─────────────────────────────────────────────────────────────────────────┐
   * │ CE QU'APPORTE LE DÉMÉNAGEUR                                             │
   * ├─────────────────────────────────────────────────────────────────────────┤
   * │ ✅ Transport sécurisé                                                    │
   * │ ✅ Main-d'œuvre pour chargement/déchargement                             │
   * │ ✅ Arrimage basique des biens                                            │
   * │ ✅ Prix le plus bas du marché                                            │
   * └─────────────────────────────────────────────────────────────────────────┘
   *
   * DURÉE TYPIQUE : 4-6 heures (dépend du volume)
   * IDÉAL POUR : Petits budgets, étudiants, personnes qui ont le temps
   */
  {
    id: "ECO",
    label: "Économique",
    description: "L'essentiel à petit prix",
    useClientSelection: false,
    // Désactive tous les modules optionnels pour le prix le plus bas
    disabledModules: [
      "packing-requirement",
      "packing-cost",
      "cleaning-end-requirement",
      "cleaning-end-cost",
      "dismantling-cost",
      "reassembly-cost",
      "high-value-item-handling",
      "supplies-cost",
      "overnight-stop-cost",
      "crew-flexibility",
    ],
    marginRate: 0.2,
    tags: ["LOW_PRICE", "ENTRY"],
  },

  /**
   * ════════════════════════════════════════════════════════════════════════════
   * SCÉNARIO STANDARD - MEILLEUR RAPPORT QUALITÉ-PRIX
   * ════════════════════════════════════════════════════════════════════════════
   *
   * Inclus de base : Transport pro, Emballage des objets fragiles, Démontage, Assurance standard.
   * Non disponible : Remontage, Nettoyage, Assurance renforcée.
   *
   * ┌─────────────────────────────────────────────────────────────────────────┐
   * │ CE QUE LE CLIENT FAIT                                                   │
   * ├─────────────────────────────────────────────────────────────────────────┤
   * │ • Emballe les objets fragiles et personnels                             │
   * │ • Vide armoires et commodes                                             │
   * │ • Indique les meubles à démonter                                        │
   * └─────────────────────────────────────────────────────────────────────────┘
   *
   * ┌─────────────────────────────────────────────────────────────────────────┐
   * │ CE QU'APPORTE LE DÉMÉNAGEUR                                             │
   * ├─────────────────────────────────────────────────────────────────────────┤
   * │ ✅ Protection renforcée des meubles                                      │
   * │ ✅ Démontage (remontage non inclus)                                      │
   * │ ✅ Emballage des objets fragiles                                         │
   * │ ✅ Organisation fluide du jour J                                         │
   * └─────────────────────────────────────────────────────────────────────────┘
   *
   * DURÉE TYPIQUE : 5-7 heures (dépend du volume)
   * IDÉAL POUR : La majorité des déménagements, bon équilibre prix/service
   */
  {
    id: "STANDARD",
    label: "Standard",
    description: "Le minimum professionnel",
    useClientSelection: false,
    enabledModules: ["packing-requirement", "packing-cost", "dismantling-cost"],
    disabledModules: [
      "reassembly-cost",
      "cleaning-end-requirement",
      "cleaning-end-cost",
      "insurance-premium",
    ],
    overrides: {
      packing: true,
      dismantling: true,
    },
    marginRate: 0.3,
    tags: ["RECOMMENDED", "BALANCED"],
  },

  /**
   * ════════════════════════════════════════════════════════════════════════════
   * SCÉNARIO CONFORT - EMBALLAGE ET DÉMONTAGE PROFESSIONNELS
   * ════════════════════════════════════════════════════════════════════════════
   *
   * Inclus : Emballage complet, Démontage & remontage, Fournitures, Assurance standard.
   * Non disponible : Nuit sur place, flexibilité planning.
   *
   * ┌─────────────────────────────────────────────────────────────────────────┐
   * │ CE QUE LE CLIENT FAIT                                                   │
   * ├─────────────────────────────────────────────────────────────────────────┤
   * │ • Signale les objets fragiles ou précieux                               │
   * │ • Vide frigo/congélateur                                                │
   * └─────────────────────────────────────────────────────────────────────────┘
   *
   * ┌─────────────────────────────────────────────────────────────────────────┐
   * │ CE QU'APPORTE LE DÉMÉNAGEUR                                             │
   * ├─────────────────────────────────────────────────────────────────────────┤
   * │ ✅ Emballage professionnel complet                                       │
   * │ ✅ Fourniture de tout le matériel (cartons, bulles, adhésif)             │
   * │ ✅ Démontage/remontage complet des meubles                               │
   * │ ✅ Manutention soignée et sans stress                                    │
   * └─────────────────────────────────────────────────────────────────────────┘
   *
   * DURÉE TYPIQUE : 7-10 heures (emballage + déménagement)
   * IDÉAL POUR : Familles, personnes pressées, déménagements complexes
   */
  {
    id: "CONFORT",
    label: "Confort",
    description: "La tranquillité",
    useClientSelection: false,
    enabledModules: [
      "packing-requirement",
      "packing-cost",
      "dismantling-cost",
      "reassembly-cost",
      "supplies-cost",
    ],
    disabledModules: ["overnight-stop-cost", "crew-flexibility"],
    overrides: {
      packing: true,
      dismantling: true,
      reassembly: true,
      bulkyFurniture: true,
      // Force les fournitures pour CONFORT (calcul dynamique selon volume si client n'a rien sélectionné)
      forceSupplies: true,
      // Note: high-value-item-handling reste conditionnel (⭕) selon présence piano/safe/artwork
    },
    marginRate: 0.35,
    tags: ["COMFORT", "UPSELL", "MOST_CHOSEN"],
  },

  /**
   * ════════════════════════════════════════════════════════════════════════════
   * SCÉNARIO SÉCURITÉ+ - PROTECTION MAXIMALE DE VOS BIENS
   * ════════════════════════════════════════════════════════════════════════════
   *
   * ┌─────────────────────────────────────────────────────────────────────────┐
   * │ CE QUE LE CLIENT FAIT                                                   │
   * ├─────────────────────────────────────────────────────────────────────────┤
   * │ • Signale les objets fragiles ou précieux                               │
   * │ • Libère l'accès fenêtres/balcon si monte-meubles nécessaire            │
   * └─────────────────────────────────────────────────────────────────────────┘
   *
   * ┌─────────────────────────────────────────────────────────────────────────┐
   * │ CE QU'APPORTE LE DÉMÉNAGEUR                                             │
   * ├─────────────────────────────────────────────────────────────────────────┤
   * │ ✅ Emballage professionnel complet                                       │
   * │ ✅ Nettoyage fin de bail inclus                                          │
   * │ ✅ Démontage/remontage professionnels                                    │
   * │ ✅ Fournitures d'emballage incluses                                      │
   * │ ✅ Assurance renforcée incluse (valeur déclarée 50 000€)                │
   * │ ✅ Manutention sécurisée objets de valeur                                │
   * │ ✅ Protocoles de manutention sécurisés                                   │
   * └─────────────────────────────────────────────────────────────────────────┘
   *
   * AVANTAGES SÉCURITÉ+ :
   * • Protection maximale avec emballage professionnel
   * • Assurance tous risques incluse par défaut
   * • Gestion sécurisée des objets fragiles et de valeur
   * • Responsabilité accrue et réduction drastique du risque
   *
   * NOTE : Le monte-meubles reste conditionnel selon les contraintes techniques
   * (étage ≥3 ou ≥5). Il n'est pas forcé par la formule mais recommandé si nécessaire.
   *
   * DURÉE TYPIQUE : 7-10 heures (emballage + déménagement)
   * IDÉAL POUR : Objets de valeur, biens fragiles, protection maximale souhaitée
   */
  {
    id: "SECURITY_PLUS",
    label: "Sécurité+",
    description: "Protection maximale",
    useClientSelection: false,
    enabledModules: [
      "packing-requirement",
      "packing-cost",
      "cleaning-end-requirement",
      "cleaning-end-cost",
      "dismantling-cost",
      "reassembly-cost",
      "high-value-item-handling",
      "supplies-cost",
      "insurance-premium",
    ],
    overrides: {
      packing: true,
      cleaningEnd: true,
      dismantling: true,
      reassembly: true,
      bulkyFurniture: true,
      artwork: true,
      surface: 80, // Assure que le nettoyage est recommandé (>60m²)
      // Assurance renforcée incluse
      declaredValueInsurance: true,
      declaredValue: 50000, // Valeur par défaut pour formules haut de gamme
      // Force les fournitures pour SECURITY_PLUS (calcul dynamique selon volume si client n'a rien sélectionné)
      forceSupplies: true,
    },
    marginRate: 0.32,
    tags: ["SECURITY_PLUS", "PRO", "INSURANCE_INCLUDED"],
  },

  /**
   * ════════════════════════════════════════════════════════════════════════════
   * SCÉNARIO PREMIUM - DÉLÉGATION TOTALE, CLÉS EN MAIN
   * ════════════════════════════════════════════════════════════════════════════
   *
   * ┌─────────────────────────────────────────────────────────────────────────┐
   * │ CE QUE LE CLIENT FAIT                                                   │
   * ├─────────────────────────────────────────────────────────────────────────┤
   * │ • Fournit le plan d'installation du nouveau logement                    │
   * │ • Est présent en début/fin de journée                                   │
   * └─────────────────────────────────────────────────────────────────────────┘
   *
   * ┌─────────────────────────────────────────────────────────────────────────┐
   * │ CE QU'APPORTE LE DÉMÉNAGEUR                                             │
   * ├─────────────────────────────────────────────────────────────────────────┤
   * │ ✅ Délégation totale du déménagement                                     │
   * │ ✅ Emballage + démontage + remontage intégral                            │
   * │ ✅ Nettoyage fin de bail inclus                                          │
   * │ ✅ Créneau horaire garanti + SAV dédié                                   │
   * └─────────────────────────────────────────────────────────────────────────┘
   *
   * SERVICES INCLUS :
   * • Chef d'équipe dédié (coordinateur)
   * • Récupération cartons vides sous 48h
   * • Support téléphonique prioritaire J-7 à J+7
   * • Assurance tous risques valeur maximale
   *
   * DURÉE TYPIQUE : 2-3 jours
   * - Jour J-1 : Emballage complet
   * - Jour J : Déménagement
   * - Jour J+1 : Nettoyage ancien logement
   *
   * IDÉAL POUR : Cadres pressés, familles nombreuses, expatriés
   */
  {
    id: "PREMIUM",
    label: "Premium",
    description: "Clé en main",
    useClientSelection: false,
    enabledModules: [
      "packing-requirement",
      "packing-cost",
      "cleaning-end-requirement",
      "cleaning-end-cost",
      "dismantling-cost",
      "reassembly-cost",
      "high-value-item-handling",
      "supplies-cost",
      "insurance-premium",
    ],
    overrides: {
      packing: true,
      cleaningEnd: true,
      dismantling: true,
      reassembly: true,
      bulkyFurniture: true,
      artwork: true,
      surface: 80, // Assure que le nettoyage est recommandé (>60m²)
      // Assurance renforcée incluse
      declaredValueInsurance: true,
      declaredValue: 50000, // Valeur par défaut pour formules haut de gamme
      // Force les fournitures pour PREMIUM (calcul dynamique selon volume si client n'a rien sélectionné)
      forceSupplies: true,
    },
    marginRate: 0.4,
    tags: ["PREMIUM", "ALL_INCLUSIVE", "INSURANCE_INCLUDED"],
  },

  /**
   * ════════════════════════════════════════════════════════════════════════════
   * SCÉNARIO FLEX - FORMULE 100 % PERSONNALISABLE
   * ════════════════════════════════════════════════════════════════════════════
   *
   * Aucun module inclus d'office, aucun override.
   * Tout est piloté par la sélection client : services (emballage, démontage, remontage,
   * nettoyage, stockage, assurance, etc.) et fournitures. Formulaire 100 % personnalisable.
   *
   * ┌─────────────────────────────────────────────────────────────────────────┐
   * │ CE QUE LE CLIENT FAIT                                                   │
   * ├─────────────────────────────────────────────────────────────────────────┤
   * │ • Choisit exactement les services et fournitures dont il a besoin       │
   * │ • Donne une estimation de volume                                        │
   * └─────────────────────────────────────────────────────────────────────────┘
   *
   * ┌─────────────────────────────────────────────────────────────────────────┐
   * │ CE QU'APPORTE LE DÉMÉNAGEUR                                             │
   * ├─────────────────────────────────────────────────────────────────────────┤
   * │ ✅ Transport professionnel (socle)                                       │
   * │ ✅ Uniquement les services et fournitures sélectionnés par le client    │
   * └─────────────────────────────────────────────────────────────────────────┘
   *
   * IDÉAL POUR : Cas atypiques, besoins spécifiques, contraintes complexes
   */
  {
    id: "FLEX",
    label: "Sur-mesure",
    description: "Solution personnalisée selon vos besoins",
    useClientSelection: true,
    marginRate: 0.38,
    tags: ["FLEXIBILITY", "CUSTOM"],
  },
];
