# 📊 Structure de la réponse `POST /api/quotation/multi-offers`

## Vue d'ensemble

L'endpoint `POST /api/quotation/multi-offers` retourne un objet JSON contenant :

- ✅ 6 variantes de devis (par défaut) avec leurs détails complets
- ✅ Un résumé comparatif (moins cher, plus cher, recommandé)
- ✅ Métadonnées de génération

---

## Structure complète

```typescript
{
  // ============================================================================
  // MÉTADONNÉES
  // ============================================================================
  success: boolean;                    // true si succès
  generatedAt: string;                 // ISO 8601: "2026-03-20T10:00:00.000Z"

  // ============================================================================
  // VARIANTS - Tableau de 6 variantes (par défaut)
  // ============================================================================
  variants: Array<{
    // Identification du scénario
    scenarioId: string;                // "ECO" | "STANDARD" | "CONFORT" | "SECURITY" | "PREMIUM" | "FLEX"
    label: string;                      // "Économique" | "Standard" | "Confort" | etc.
    description: string;                 // Description du scénario

    // Prix
    finalPrice: number;                  // Prix final (€)
    basePrice: number;                   // Prix de base avant ajustements (€)
    marginRate: number;                 // Taux de marge (ex: 0.25 = 25%)

    // Tags marketing
    tags: string[];                      // ["BUDGET", "RECOMMENDED"], ["COMFORT", "UPSELL"], etc.

    // CONTEXTE COMPLET DU DEVIS (même structure que /calculate)
    context: {
      // Identification
      quoteId?: string;                  // "quote-ECO", "quote-STANDARD", etc.
      generatedAt: string;              // ISO 8601

      // Informations client
      movingDate: string;                // ISO 8601
      departureAddress: string;         // Adresse complète de départ
      arrivalAddress: string;            // Adresse complète d'arrivée
      distanceKm: number;                // Distance en kilomètres

      // PRIX DÉTAILLÉ
      pricing: {
        totalCosts: number;              // Coûts bruts totaux (€)
        basePrice: number;                // Prix de base (coûts + marge) (€)
        finalPrice: number;              // Prix final (base + ajustements) (€)
        marginRate: number;              // Taux de marge appliqué

        breakdown: {
          // Coûts par catégorie
          costsByCategory: {
            TRANSPORT: number;            // Coûts transport (carburant, péages)
            VEHICLE: number;              // Location véhicules
            LABOR: number;                // Main-d'œuvre
            INSURANCE: number;             // Prime d'assurance
            RISK: number;                 // Surcoûts risques
            ADMINISTRATIVE: number;       // Frais administratifs
            TEMPORAL: number;             // Surcharges temporelles (fin de mois, weekend)
          };

          // Détail par module
          costsByModule: Array<{
            moduleId: string;             // "fuel-cost", "vehicle-selection", etc.
            label: string;                // "Coût carburant", "Location véhicule CAMIONNETTE_COMPACT (×3)", etc.
            amount: number;               // Montant (€)
            category: string;             // "TRANSPORT", "VEHICLE", etc.
          }>;

          // Ajustements (surcharges/réductions)
          adjustments: Array<{
            moduleId: string;             // "end-of-month", "weekend", etc.
            label: string;                // "Surcharge fin de mois", etc.
            amount: number;               // Montant ajustement (€)
            type: string;                 // "SURCHARGE" | "DISCOUNT"
            reason: string;               // Raison de l'ajustement
          }>;
        };
      };

      // LOGISTIQUE
      logistics: {
        baseVolume: number;               // Volume de base estimé (m³)
        adjustedVolume: number;          // Volume ajusté avec incertitude (m³)
        vehicleCount: number;             // Nombre de véhicules nécessaires
        vehicleTypes: string[];           // ["CAMIONNETTE_COMPACT"], ["CAMIONNETTE_COMPACT", "CAMION_LIGHT"], etc.
        workersCount: number;             // Nombre de déménageurs
        estimatedDurationHours: number;  // Durée estimée (heures)
      };

      // RISQUE
      risk: {
        riskScore: number;                // Score de risque (0-100)
        manualReviewRequired: boolean;    // true si revérification manuelle nécessaire
        riskContributions: Array<{        // Contributions au risque
          moduleId: string;               // "volume-uncertainty-risk", "monte-meubles-refusal-impact", etc.
          amount: number;                 // Contribution au score (0-100)
          reason: string;                 // "Confiance moyenne sur le volume estimé", etc.
        }>;
      };

      // REQUIREMENTS (Checklist terrain)
      requirements: Array<{
        type: string;                    // "LIFT_RECOMMENDED", "CLEANING_RECOMMENDED", "PACKING_RECOMMENDED", etc.
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        reason: string;                   // Message détaillé expliquant le requirement
        moduleId: string;                 // "monte-meubles-recommendation", "cleaning-end-requirement", etc.
      }>;

      // IMPACTS JURIDIQUES
      legalImpacts: Array<{
        type: string;                    // "LIABILITY_LIMITATION", "INSURANCE_CAP", "CO_OWNERSHIP_RULES", etc.
        severity: "INFO" | "WARNING" | "CRITICAL";
        message: string;                  // Message détaillé pour le client
        moduleId: string;                 // "monte-meubles-refusal-impact", "co-ownership-rules", etc.
      }>;

      // NOTES ASSURANCE
      insuranceNotes: string[];           // ["Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)", etc.]

      // CROSS-SELLING
      crossSellProposals: Array<{
        id: string;                       // "MONTE_MEUBLES_OPTION", "CLEANING_END_OPTION", etc.
        label: string;                    // "Location Monte-Meubles", "Nettoyage de fin de chantier", etc.
        reason: string;                   // Pourquoi c'est recommandé
        benefit: string;                   // Bénéfice pour le client
        priceImpact: number;              // Impact sur le prix (€)
        optional: boolean;                // true si optionnel
      }>;

      // TRAÇABILITÉ
      traceability: {
        activatedModules: string[];       // Liste des modules activés pour ce scénario
        operationalFlags: string[];       // Flags opérationnels ("LIFT_REFUSAL_LEGAL_IMPACT", etc.)
      };
    };

    // CHECKLIST TERRAIN FORMATÉE
    checklist: {
      title: string;                      // "Checklist Terrain - Déménagement"
      generatedAt: string;                // ISO 8601
      items: Array<{
        id: string;                       // "req-1", "req-2", etc.
        type: string;                     // "LIFT_RECOMMENDED", "CLEANING_RECOMMENDED", etc.
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        description: string;               // Message détaillé
        required: boolean;                // true si HIGH ou CRITICAL
        moduleId: string;                 // Module source
      }>;
    };

    // DONNÉES CONTRAT FORMATÉES
    contract: {
      quoteId?: string;                   // "quote-ECO", "quote-STANDARD", etc.
      generatedAt: string;                // ISO 8601
      legalImpacts: Array<{
        type: string;                     // "LIABILITY_LIMITATION", "INSURANCE_CAP", etc.
        severity: string;                  // "INFO" | "WARNING" | "CRITICAL"
        message: string;                   // Message détaillé pour le client
        moduleId: string;                  // Module source
        timestamp: string;                 // ISO 8601
      }>;
      insurance: {
        declaredValue: number;             // Valeur déclarée (€)
        premium: number;                   // Prime d'assurance (€)
        coverage: number;                  // Couverture effective (€) - peut être réduite si assurance plafonnée
        notes: string[];                   // Notes assurance
      };
      operationalConstraints: string[];   // Contraintes opérationnelles
    };

    // AUDIT JURIDIQUE FORMATÉ
    audit: {
      quoteId?: string;                   // "quote-ECO", "quote-STANDARD", etc.
      generatedAt: string;                // ISO 8601
      decisions: Array<{
        moduleId: string;                  // Module source
        decision: string;                  // "ACTIVATED", "LIABILITY_LIMITATION", etc.
        reason: string;                    // Raison de la décision
        timestamp: string;                 // ISO 8601
        impact: "COST" | "RISK" | "LEGAL" | "OPERATIONAL";
      }>;
      riskScore: number;                   // Score de risque (0-100)
      manualReviewRequired: boolean;       // true si revérification manuelle nécessaire
      legalFlags: string[];                // Flags juridiques
    };
  }>;

  // ============================================================================
  // COMPARISON - Résumé comparatif
  // ============================================================================
  comparison: {
    cheapest: {
      scenarioId: string;                 // "ECO" généralement
      label: string;                      // "Économique"
      price: number;                      // Prix final (€)
    };
    mostExpensive: {
      scenarioId: string;                 // "PREMIUM" généralement
      label: string;                      // "Premium"
      price: number;                      // Prix final (€)
    };
    recommended: {
      scenarioId: string;                 // "STANDARD" généralement
      label: string;                      // "Standard"
      price: number;                      // Prix final (€)
    } | null;                             // null si aucun scénario STANDARD trouvé
    priceRange: number;                   // Écart entre plus cher et moins cher (€)
    averagePrice: number;                 // Prix moyen de toutes les variantes (€)
  };
}
```

---

## Exemple de réponse complète

```json
{
  "success": true,
  "generatedAt": "2026-03-20T10:00:00.000Z",
  "variants": [
    {
      "scenarioId": "ECO",
      "label": "Économique",
      "description": "Prix optimisé, services essentiels uniquement",
      "finalPrice": 1203.98,
      "basePrice": 1203.98,
      "marginRate": 0.25,
      "tags": ["BUDGET", "ESSENTIAL"],
      "context": {
        "quoteId": "quote-ECO",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "movingDate": "2026-03-20T10:00:00Z",
        "departureAddress": "123 Rue de Paris, 75001 Paris",
        "arrivalAddress": "456 Avenue Montaigne, 75008 Paris",
        "distanceKm": 15,
        "pricing": {
          "totalCosts": 1003.06,
          "basePrice": 1203.98,
          "finalPrice": 1203.98,
          "marginRate": 0.25,
          "breakdown": {
            "costsByCategory": {
              "TRANSPORT": 3.06,
              "VEHICLE": 360.0,
              "LABOR": 540.0,
              "INSURANCE": 67.5,
              "RISK": 0,
              "ADMINISTRATIVE": 0,
              "TEMPORAL": 0
            },
            "costsByModule": [
              {
                "moduleId": "fuel-cost",
                "label": "Coût carburant",
                "amount": 3.06,
                "category": "TRANSPORT"
              },
              {
                "moduleId": "vehicle-selection",
                "label": "Location véhicule CAMIONNETTE_COMPACT (×3)",
                "amount": 360.0,
                "category": "VEHICLE"
              },
              {
                "moduleId": "labor-base",
                "label": "Main-d'œuvre de base",
                "amount": 540.0,
                "category": "LABOR"
              },
              {
                "moduleId": "insurance-premium",
                "label": "Prime d'assurance",
                "amount": 67.5,
                "category": "INSURANCE"
              }
            ],
            "adjustments": []
          }
        },
        "logistics": {
          "baseVolume": 30,
          "adjustedVolume": 31.5,
          "vehicleCount": 3,
          "vehicleTypes": ["CAMIONNETTE_COMPACT"],
          "workersCount": 3,
          "estimatedDurationHours": 6
        },
        "risk": {
          "riskScore": 8,
          "manualReviewRequired": false,
          "riskContributions": [
            {
              "moduleId": "volume-uncertainty-risk",
              "amount": 8,
              "reason": "Confiance moyenne sur le volume estimé"
            }
          ]
        },
        "requirements": [],
        "legalImpacts": [],
        "insuranceNotes": [
          "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)"
        ],
        "crossSellProposals": [],
        "traceability": {
          "activatedModules": [
            "input-sanitization",
            "date-validation",
            "address-normalization",
            "volume-estimation",
            "volume-uncertainty-risk",
            "distance-calculation",
            "long-distance-threshold",
            "fuel-cost",
            "vehicle-selection",
            "workers-calculation",
            "labor-base",
            "declared-value-validation",
            "insurance-premium"
          ],
          "operationalFlags": []
        }
      },
      "checklist": {
        "title": "Checklist Terrain - Déménagement",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "items": []
      },
      "contract": {
        "quoteId": "quote-ECO",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "legalImpacts": [],
        "insurance": {
          "declaredValue": 15000,
          "premium": 67.5,
          "coverage": 15000,
          "notes": [
            "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)"
          ]
        },
        "operationalConstraints": []
      },
      "audit": {
        "quoteId": "quote-ECO",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "decisions": [
          {
            "moduleId": "input-sanitization",
            "decision": "ACTIVATED",
            "reason": "Module activé selon conditions métier",
            "timestamp": "2026-03-20T10:00:00.000Z",
            "impact": "OPERATIONAL"
          },
          {
            "moduleId": "volume-estimation",
            "decision": "ACTIVATED",
            "reason": "Volume estimé : 30 m³",
            "timestamp": "2026-03-20T10:00:00.000Z",
            "impact": "COST"
          }
        ],
        "riskScore": 8,
        "manualReviewRequired": false,
        "legalFlags": []
      }
    },
    {
      "scenarioId": "STANDARD",
      "label": "Standard",
      "description": "Offre équilibrée, recommandée",
      "finalPrice": 1303.98,
      "basePrice": 1303.98,
      "marginRate": 0.3,
      "tags": ["RECOMMENDED", "BALANCED"],
      "context": {
        "quoteId": "quote-STANDARD",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "movingDate": "2026-03-20T10:00:00Z",
        "departureAddress": "123 Rue de Paris, 75001 Paris",
        "arrivalAddress": "456 Avenue Montaigne, 75008 Paris",
        "distanceKm": 15,
        "pricing": {
          "totalCosts": 1003.06,
          "basePrice": 1303.98,
          "finalPrice": 1303.98,
          "marginRate": 0.3,
          "breakdown": {
            "costsByCategory": {
              "TRANSPORT": 3.06,
              "VEHICLE": 360.0,
              "LABOR": 540.0,
              "INSURANCE": 67.5,
              "RISK": 0,
              "ADMINISTRATIVE": 0,
              "TEMPORAL": 0
            },
            "costsByModule": [
              {
                "moduleId": "fuel-cost",
                "label": "Coût carburant",
                "amount": 3.06,
                "category": "TRANSPORT"
              },
              {
                "moduleId": "vehicle-selection",
                "label": "Location véhicule CAMIONNETTE_COMPACT (×3)",
                "amount": 360.0,
                "category": "VEHICLE"
              },
              {
                "moduleId": "labor-base",
                "label": "Main-d'œuvre de base",
                "amount": 540.0,
                "category": "LABOR"
              },
              {
                "moduleId": "insurance-premium",
                "label": "Prime d'assurance",
                "amount": 67.5,
                "category": "INSURANCE"
              }
            ],
            "adjustments": []
          }
        },
        "logistics": {
          "baseVolume": 30,
          "adjustedVolume": 31.5,
          "vehicleCount": 3,
          "vehicleTypes": ["CAMIONNETTE_COMPACT"],
          "workersCount": 3,
          "estimatedDurationHours": 6
        },
        "risk": {
          "riskScore": 8,
          "manualReviewRequired": false,
          "riskContributions": [
            {
              "moduleId": "volume-uncertainty-risk",
              "amount": 8,
              "reason": "Confiance moyenne sur le volume estimé"
            }
          ]
        },
        "requirements": [
          {
            "type": "CLEANING_RECOMMENDED",
            "severity": "LOW",
            "reason": "Nettoyage de fin de chantier recommandé : volume important, déménagement complet.",
            "moduleId": "cleaning-end-requirement"
          }
        ],
        "legalImpacts": [],
        "insuranceNotes": [
          "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)"
        ],
        "crossSellProposals": [
          {
            "id": "CLEANING_END_OPTION",
            "label": "Nettoyage de fin de chantier",
            "reason": "Recommandé pour volume important",
            "benefit": "Remise en état du logement pour faciliter la remise des clés",
            "priceImpact": 520,
            "optional": true
          }
        ],
        "traceability": {
          "activatedModules": [
            "input-sanitization",
            "date-validation",
            "address-normalization",
            "volume-estimation",
            "volume-uncertainty-risk",
            "distance-calculation",
            "long-distance-threshold",
            "fuel-cost",
            "vehicle-selection",
            "workers-calculation",
            "labor-base",
            "declared-value-validation",
            "insurance-premium",
            "cleaning-end-requirement"
          ],
          "operationalFlags": []
        }
      },
      "checklist": {
        "title": "Checklist Terrain - Déménagement",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "items": [
          {
            "id": "req-1",
            "type": "CLEANING_RECOMMENDED",
            "severity": "LOW",
            "description": "Nettoyage de fin de chantier recommandé : volume important, déménagement complet.",
            "required": false,
            "moduleId": "cleaning-end-requirement"
          }
        ]
      },
      "contract": {
        "quoteId": "quote-STANDARD",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "legalImpacts": [],
        "insurance": {
          "declaredValue": 15000,
          "premium": 67.5,
          "coverage": 15000,
          "notes": [
            "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)"
          ]
        },
        "operationalConstraints": []
      },
      "audit": {
        "quoteId": "quote-STANDARD",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "decisions": [
          {
            "moduleId": "cleaning-end-requirement",
            "decision": "ACTIVATED",
            "reason": "Nettoyage de fin de chantier recommandé : volume important, déménagement complet.",
            "timestamp": "2026-03-20T10:00:00.000Z",
            "impact": "COST"
          }
        ],
        "riskScore": 8,
        "manualReviewRequired": false,
        "legalFlags": []
      }
    },
    {
      "scenarioId": "CONFORT",
      "label": "Confort",
      "description": "Plus de services pour plus de tranquillité",
      "finalPrice": 1823.98,
      "basePrice": 1823.98,
      "marginRate": 0.35,
      "tags": ["COMFORT", "UPSELL"],
      "context": {
        "quoteId": "quote-CONFORT",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "movingDate": "2026-03-20T10:00:00Z",
        "departureAddress": "123 Rue de Paris, 75001 Paris",
        "arrivalAddress": "456 Avenue Montaigne, 75008 Paris",
        "distanceKm": 15,
        "pricing": {
          "totalCosts": 1351.06,
          "basePrice": 1823.98,
          "finalPrice": 1823.98,
          "marginRate": 0.35,
          "breakdown": {
            "costsByCategory": {
              "TRANSPORT": 3.06,
              "VEHICLE": 360.0,
              "LABOR": 540.0,
              "INSURANCE": 67.5,
              "RISK": 0,
              "ADMINISTRATIVE": 280.0,
              "TEMPORAL": 0
            },
            "costsByModule": [
              {
                "moduleId": "fuel-cost",
                "label": "Coût carburant",
                "amount": 3.06,
                "category": "TRANSPORT"
              },
              {
                "moduleId": "vehicle-selection",
                "label": "Location véhicule CAMIONNETTE_COMPACT (×3)",
                "amount": 360.0,
                "category": "VEHICLE"
              },
              {
                "moduleId": "labor-base",
                "label": "Main-d'œuvre de base",
                "amount": 540.0,
                "category": "LABOR"
              },
              {
                "moduleId": "insurance-premium",
                "label": "Prime d'assurance",
                "amount": 67.5,
                "category": "INSURANCE"
              },
              {
                "moduleId": "packing-cost",
                "label": "Service d'emballage professionnel",
                "amount": 200.0,
                "category": "ADMINISTRATIVE"
              },
              {
                "moduleId": "dismantling-cost",
                "label": "Service de démontage de meubles",
                "amount": 80.0,
                "category": "ADMINISTRATIVE"
              }
            ],
            "adjustments": []
          }
        },
        "logistics": {
          "baseVolume": 30,
          "adjustedVolume": 31.5,
          "vehicleCount": 3,
          "vehicleTypes": ["CAMIONNETTE_COMPACT"],
          "workersCount": 3,
          "estimatedDurationHours": 6
        },
        "risk": {
          "riskScore": 8,
          "manualReviewRequired": false,
          "riskContributions": [
            {
              "moduleId": "volume-uncertainty-risk",
              "amount": 8,
              "reason": "Confiance moyenne sur le volume estimé"
            }
          ]
        },
        "requirements": [
          {
            "type": "PACKING_RECOMMENDED",
            "severity": "MEDIUM",
            "reason": "Emballage professionnel recommandé : déménagement longue distance ou objets fragiles détectés.",
            "moduleId": "packing-requirement"
          }
        ],
        "legalImpacts": [],
        "insuranceNotes": [
          "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)"
        ],
        "crossSellProposals": [
          {
            "id": "PACKING_OPTION",
            "label": "Emballage professionnel",
            "reason": "Recommandé pour déménagement longue distance",
            "benefit": "Protection optimale de vos biens, gain de temps",
            "priceImpact": 200,
            "optional": true
          }
        ],
        "traceability": {
          "activatedModules": [
            "input-sanitization",
            "date-validation",
            "address-normalization",
            "volume-estimation",
            "volume-uncertainty-risk",
            "distance-calculation",
            "long-distance-threshold",
            "fuel-cost",
            "vehicle-selection",
            "workers-calculation",
            "labor-base",
            "declared-value-validation",
            "insurance-premium",
            "packing-requirement",
            "packing-cost",
            "dismantling-cost"
          ],
          "operationalFlags": []
        }
      },
      "checklist": {
        "title": "Checklist Terrain - Déménagement",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "items": [
          {
            "id": "req-1",
            "type": "PACKING_RECOMMENDED",
            "severity": "MEDIUM",
            "description": "Emballage professionnel recommandé : déménagement longue distance ou objets fragiles détectés.",
            "required": false,
            "moduleId": "packing-requirement"
          }
        ]
      },
      "contract": {
        "quoteId": "quote-CONFORT",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "legalImpacts": [],
        "insurance": {
          "declaredValue": 15000,
          "premium": 67.5,
          "coverage": 15000,
          "notes": [
            "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)"
          ]
        },
        "operationalConstraints": []
      },
      "audit": {
        "quoteId": "quote-CONFORT",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "decisions": [
          {
            "moduleId": "packing-cost",
            "decision": "ACTIVATED",
            "reason": "Service d'emballage professionnel activé",
            "timestamp": "2026-03-20T10:00:00.000Z",
            "impact": "COST"
          },
          {
            "moduleId": "dismantling-cost",
            "decision": "ACTIVATED",
            "reason": "Service de démontage de meubles activé",
            "timestamp": "2026-03-20T10:00:00.000Z",
            "impact": "COST"
          }
        ],
        "riskScore": 8,
        "manualReviewRequired": false,
        "legalFlags": []
      }
    },
    {
      "scenarioId": "SECURITY",
      "label": "Sécurité",
      "description": "Protection maximale et assurance renforcée",
      "finalPrice": 1403.98,
      "basePrice": 1403.98,
      "marginRate": 0.32,
      "tags": ["SECURITY", "INSURANCE"],
      "context": {
        "quoteId": "quote-SECURITY",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "movingDate": "2026-03-20T10:00:00Z",
        "departureAddress": "123 Rue de Paris, 75001 Paris",
        "arrivalAddress": "456 Avenue Montaigne, 75008 Paris",
        "distanceKm": 15,
        "pricing": {
          "totalCosts": 1063.06,
          "basePrice": 1403.98,
          "finalPrice": 1403.98,
          "marginRate": 0.32,
          "breakdown": {
            "costsByCategory": {
              "TRANSPORT": 3.06,
              "VEHICLE": 360.0,
              "LABOR": 540.0,
              "INSURANCE": 67.5,
              "RISK": 0,
              "ADMINISTRATIVE": 0,
              "TEMPORAL": 0
            },
            "costsByModule": [
              {
                "moduleId": "fuel-cost",
                "label": "Coût carburant",
                "amount": 3.06,
                "category": "TRANSPORT"
              },
              {
                "moduleId": "vehicle-selection",
                "label": "Location véhicule CAMIONNETTE_COMPACT (×3)",
                "amount": 360.0,
                "category": "VEHICLE"
              },
              {
                "moduleId": "labor-base",
                "label": "Main-d'œuvre de base",
                "amount": 540.0,
                "category": "LABOR"
              },
              {
                "moduleId": "insurance-premium",
                "label": "Prime d'assurance",
                "amount": 67.5,
                "category": "INSURANCE"
              }
            ],
            "adjustments": []
          }
        },
        "logistics": {
          "baseVolume": 30,
          "adjustedVolume": 31.5,
          "vehicleCount": 3,
          "vehicleTypes": ["CAMIONNETTE_COMPACT"],
          "workersCount": 3,
          "estimatedDurationHours": 6
        },
        "risk": {
          "riskScore": 8,
          "manualReviewRequired": false,
          "riskContributions": [
            {
              "moduleId": "volume-uncertainty-risk",
              "amount": 8,
              "reason": "Confiance moyenne sur le volume estimé"
            }
          ]
        },
        "requirements": [],
        "legalImpacts": [],
        "insuranceNotes": [
          "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)",
          "Assurance renforcée incluse dans ce scénario"
        ],
        "crossSellProposals": [],
        "traceability": {
          "activatedModules": [
            "input-sanitization",
            "date-validation",
            "address-normalization",
            "volume-estimation",
            "volume-uncertainty-risk",
            "distance-calculation",
            "long-distance-threshold",
            "fuel-cost",
            "vehicle-selection",
            "workers-calculation",
            "labor-base",
            "declared-value-validation",
            "insurance-premium"
          ],
          "operationalFlags": []
        }
      },
      "checklist": {
        "title": "Checklist Terrain - Déménagement",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "items": []
      },
      "contract": {
        "quoteId": "quote-SECURITY",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "legalImpacts": [],
        "insurance": {
          "declaredValue": 15000,
          "premium": 67.5,
          "coverage": 15000,
          "notes": [
            "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)",
            "Assurance renforcée incluse dans ce scénario"
          ]
        },
        "operationalConstraints": []
      },
      "audit": {
        "quoteId": "quote-SECURITY",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "decisions": [
          {
            "moduleId": "insurance-premium",
            "decision": "ACTIVATED",
            "reason": "Assurance renforcée activée",
            "timestamp": "2026-03-20T10:00:00.000Z",
            "impact": "COST"
          }
        ],
        "riskScore": 8,
        "manualReviewRequired": false,
        "legalFlags": []
      }
    },
    {
      "scenarioId": "PREMIUM",
      "label": "Premium",
      "description": "Service clé en main tout inclus",
      "finalPrice": 2123.98,
      "basePrice": 2123.98,
      "marginRate": 0.4,
      "tags": ["PREMIUM", "ALL_INCLUSIVE"],
      "context": {
        "quoteId": "quote-PREMIUM",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "movingDate": "2026-03-20T10:00:00Z",
        "departureAddress": "123 Rue de Paris, 75001 Paris",
        "arrivalAddress": "456 Avenue Montaigne, 75008 Paris",
        "distanceKm": 15,
        "pricing": {
          "totalCosts": 1517.06,
          "basePrice": 2123.98,
          "finalPrice": 2123.98,
          "marginRate": 0.4,
          "breakdown": {
            "costsByCategory": {
              "TRANSPORT": 3.06,
              "VEHICLE": 360.0,
              "LABOR": 540.0,
              "INSURANCE": 67.5,
              "RISK": 0,
              "ADMINISTRATIVE": 446.0,
              "TEMPORAL": 0
            },
            "costsByModule": [
              {
                "moduleId": "fuel-cost",
                "label": "Coût carburant",
                "amount": 3.06,
                "category": "TRANSPORT"
              },
              {
                "moduleId": "vehicle-selection",
                "label": "Location véhicule CAMIONNETTE_COMPACT (×3)",
                "amount": 360.0,
                "category": "VEHICLE"
              },
              {
                "moduleId": "labor-base",
                "label": "Main-d'œuvre de base",
                "amount": 540.0,
                "category": "LABOR"
              },
              {
                "moduleId": "insurance-premium",
                "label": "Prime d'assurance",
                "amount": 67.5,
                "category": "INSURANCE"
              },
              {
                "moduleId": "packing-cost",
                "label": "Service d'emballage professionnel",
                "amount": 200.0,
                "category": "ADMINISTRATIVE"
              },
              {
                "moduleId": "cleaning-end-cost",
                "label": "Nettoyage de fin de chantier",
                "amount": 166.0,
                "category": "ADMINISTRATIVE"
              },
              {
                "moduleId": "dismantling-cost",
                "label": "Service de démontage de meubles",
                "amount": 80.0,
                "category": "ADMINISTRATIVE"
              }
            ],
            "adjustments": []
          }
        },
        "logistics": {
          "baseVolume": 30,
          "adjustedVolume": 31.5,
          "vehicleCount": 3,
          "vehicleTypes": ["CAMIONNETTE_COMPACT"],
          "workersCount": 3,
          "estimatedDurationHours": 6
        },
        "risk": {
          "riskScore": 8,
          "manualReviewRequired": false,
          "riskContributions": [
            {
              "moduleId": "volume-uncertainty-risk",
              "amount": 8,
              "reason": "Confiance moyenne sur le volume estimé"
            }
          ]
        },
        "requirements": [
          {
            "type": "PACKING_RECOMMENDED",
            "severity": "MEDIUM",
            "reason": "Emballage professionnel recommandé : déménagement longue distance ou objets fragiles détectés.",
            "moduleId": "packing-requirement"
          },
          {
            "type": "CLEANING_RECOMMENDED",
            "severity": "LOW",
            "reason": "Nettoyage de fin de chantier recommandé : volume important, déménagement complet.",
            "moduleId": "cleaning-end-requirement"
          }
        ],
        "legalImpacts": [],
        "insuranceNotes": [
          "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)"
        ],
        "crossSellProposals": [],
        "traceability": {
          "activatedModules": [
            "input-sanitization",
            "date-validation",
            "address-normalization",
            "volume-estimation",
            "volume-uncertainty-risk",
            "distance-calculation",
            "long-distance-threshold",
            "fuel-cost",
            "vehicle-selection",
            "workers-calculation",
            "labor-base",
            "declared-value-validation",
            "insurance-premium",
            "packing-requirement",
            "packing-cost",
            "cleaning-end-requirement",
            "cleaning-end-cost",
            "dismantling-cost"
          ],
          "operationalFlags": []
        }
      },
      "checklist": {
        "title": "Checklist Terrain - Déménagement",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "items": [
          {
            "id": "req-1",
            "type": "PACKING_RECOMMENDED",
            "severity": "MEDIUM",
            "description": "Emballage professionnel recommandé : déménagement longue distance ou objets fragiles détectés.",
            "required": false,
            "moduleId": "packing-requirement"
          },
          {
            "id": "req-2",
            "type": "CLEANING_RECOMMENDED",
            "severity": "LOW",
            "description": "Nettoyage de fin de chantier recommandé : volume important, déménagement complet.",
            "required": false,
            "moduleId": "cleaning-end-requirement"
          }
        ]
      },
      "contract": {
        "quoteId": "quote-PREMIUM",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "legalImpacts": [],
        "insurance": {
          "declaredValue": 15000,
          "premium": 67.5,
          "coverage": 15000,
          "notes": [
            "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)"
          ]
        },
        "operationalConstraints": []
      },
      "audit": {
        "quoteId": "quote-PREMIUM",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "decisions": [
          {
            "moduleId": "packing-cost",
            "decision": "ACTIVATED",
            "reason": "Service d'emballage professionnel activé",
            "timestamp": "2026-03-20T10:00:00.000Z",
            "impact": "COST"
          },
          {
            "moduleId": "cleaning-end-cost",
            "decision": "ACTIVATED",
            "reason": "Nettoyage de fin de chantier activé",
            "timestamp": "2026-03-20T10:00:00.000Z",
            "impact": "COST"
          },
          {
            "moduleId": "dismantling-cost",
            "decision": "ACTIVATED",
            "reason": "Service de démontage de meubles activé",
            "timestamp": "2026-03-20T10:00:00.000Z",
            "impact": "COST"
          }
        ],
        "riskScore": 8,
        "manualReviewRequired": false,
        "legalFlags": []
      }
    },
    {
      "scenarioId": "FLEX",
      "label": "Flexible",
      "description": "Adaptable selon vos besoins",
      "finalPrice": 1303.98,
      "basePrice": 1303.98,
      "marginRate": 0.3,
      "tags": ["FLEXIBLE", "CUSTOMIZABLE"],
      "context": {
        "quoteId": "quote-FLEX",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "movingDate": "2026-03-20T10:00:00Z",
        "departureAddress": "123 Rue de Paris, 75001 Paris",
        "arrivalAddress": "456 Avenue Montaigne, 75008 Paris",
        "distanceKm": 15,
        "pricing": {
          "totalCosts": 1003.06,
          "basePrice": 1303.98,
          "finalPrice": 1303.98,
          "marginRate": 0.3,
          "breakdown": {
            "costsByCategory": {
              "TRANSPORT": 3.06,
              "VEHICLE": 360.0,
              "LABOR": 540.0,
              "INSURANCE": 67.5,
              "RISK": 0,
              "ADMINISTRATIVE": 0,
              "TEMPORAL": 0
            },
            "costsByModule": [
              {
                "moduleId": "fuel-cost",
                "label": "Coût carburant",
                "amount": 3.06,
                "category": "TRANSPORT"
              },
              {
                "moduleId": "vehicle-selection",
                "label": "Location véhicule CAMIONNETTE_COMPACT (×3)",
                "amount": 360.0,
                "category": "VEHICLE"
              },
              {
                "moduleId": "labor-base",
                "label": "Main-d'œuvre de base",
                "amount": 540.0,
                "category": "LABOR"
              },
              {
                "moduleId": "insurance-premium",
                "label": "Prime d'assurance",
                "amount": 67.5,
                "category": "INSURANCE"
              }
            ],
            "adjustments": []
          }
        },
        "logistics": {
          "baseVolume": 30,
          "adjustedVolume": 31.5,
          "vehicleCount": 3,
          "vehicleTypes": ["CAMIONNETTE_COMPACT"],
          "workersCount": 3,
          "estimatedDurationHours": 6
        },
        "risk": {
          "riskScore": 8,
          "manualReviewRequired": false,
          "riskContributions": [
            {
              "moduleId": "volume-uncertainty-risk",
              "amount": 8,
              "reason": "Confiance moyenne sur le volume estimé"
            }
          ]
        },
        "requirements": [],
        "legalImpacts": [],
        "insuranceNotes": [
          "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)"
        ],
        "crossSellProposals": [],
        "traceability": {
          "activatedModules": [
            "input-sanitization",
            "date-validation",
            "address-normalization",
            "volume-estimation",
            "volume-uncertainty-risk",
            "distance-calculation",
            "long-distance-threshold",
            "fuel-cost",
            "vehicle-selection",
            "workers-calculation",
            "labor-base",
            "declared-value-validation",
            "insurance-premium"
          ],
          "operationalFlags": []
        }
      },
      "checklist": {
        "title": "Checklist Terrain - Déménagement",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "items": []
      },
      "contract": {
        "quoteId": "quote-FLEX",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "legalImpacts": [],
        "insurance": {
          "declaredValue": 15000,
          "premium": 67.5,
          "coverage": 15000,
          "notes": [
            "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)"
          ]
        },
        "operationalConstraints": []
      },
      "audit": {
        "quoteId": "quote-FLEX",
        "generatedAt": "2026-03-20T10:00:00.000Z",
        "decisions": [
          {
            "moduleId": "input-sanitization",
            "decision": "ACTIVATED",
            "reason": "Module activé selon conditions métier",
            "timestamp": "2026-03-20T10:00:00.000Z",
            "impact": "OPERATIONAL"
          }
        ],
        "riskScore": 8,
        "manualReviewRequired": false,
        "legalFlags": []
      }
    }
  ],
  "comparison": {
    "cheapest": {
      "scenarioId": "ECO",
      "label": "Économique",
      "price": 1203.98
    },
    "mostExpensive": {
      "scenarioId": "PREMIUM",
      "label": "Premium",
      "price": 2123.98
    },
    "recommended": {
      "scenarioId": "STANDARD",
      "label": "Standard",
      "price": 1303.98
    },
    "priceRange": 920.0,
    "averagePrice": 1526.98
  }
}
```

---

## Différences entre scénarios

### ECO (Économique)

- **Marge** : 25%
- **Modules activés** : Uniquement les modules essentiels
- **Modules désactivés** : Tous les modules optionnels (packing, cleaning, dismantling, etc.)
- **Prix** : Le moins cher

### STANDARD (Recommandé)

- **Marge** : 30%
- **Modules activés** : Modules essentiels + recommandations métier
- **Modules désactivés** : Options payantes uniquement
- **Prix** : Équilibré

### CONFORT

- **Marge** : 35%
- **Modules activés** : STANDARD + `packing-cost`, `dismantling-cost`, `high-value-item-handling`
- **Prix** : Plus élevé mais plus de services

### SECURITY

- **Marge** : 32%
- **Modules activés** : STANDARD + modules sécurité/assurance renforcée
- **Prix** : Modéré avec protection maximale

### PREMIUM

- **Marge** : 40%
- **Modules activés** : Tous les modules disponibles (`packing-cost`, `cleaning-end-cost`, `dismantling-cost`, `high-value-item-handling`, etc.)
- **Prix** : Le plus cher, service complet

### FLEX

- **Marge** : 30%
- **Modules activés** : STANDARD avec possibilité de personnalisation
- **Prix** : Équilibré, adaptable

---

## Utilisation pratique

### Accéder au prix d'une variante

```typescript
const response = await fetch('/api/quotation/multi-offers', { ... });
const data = await response.json();

// Prix de la variante ECO
const ecoPrice = data.variants.find(v => v.scenarioId === 'ECO')?.finalPrice;

// Prix recommandé
const recommendedPrice = data.comparison.recommended?.price;
```

### Afficher toutes les variantes avec leurs prix

```typescript
data.variants.forEach((variant) => {
  console.log(`${variant.label}: ${variant.finalPrice} €`);
});
```

### Obtenir le détail complet d'une variante

```typescript
const premiumVariant = data.variants.find((v) => v.scenarioId === "PREMIUM");
console.log(
  "Modules activés:",
  premiumVariant.context.traceability.activatedModules,
);
console.log(
  "Coûts détaillés:",
  premiumVariant.context.pricing.breakdown.costsByModule,
);
```

### Accéder à la checklist terrain d'une variante

```typescript
const standardVariant = data.variants.find((v) => v.scenarioId === "STANDARD");
console.log("Checklist terrain:", standardVariant.checklist.items);
// Affiche les requirements formatés pour l'équipe de déménagement
standardVariant.checklist.items.forEach((item) => {
  console.log(`${item.id}: ${item.description} (${item.severity})`);
  if (item.required) {
    console.log("  ⚠️ REQUIS");
  }
});
```

### Accéder aux données contrat d'une variante

```typescript
const variant = data.variants.find((v) => v.scenarioId === "PREMIUM");
console.log("Données contrat:", variant.contract);
console.log("Assurance:", {
  valeurDéclarée: variant.contract.insurance.declaredValue,
  prime: variant.contract.insurance.premium,
  couverture: variant.contract.insurance.coverage,
});
console.log("Impacts juridiques:", variant.contract.legalImpacts);
if (variant.contract.legalImpacts.length > 0) {
  variant.contract.legalImpacts.forEach((impact) => {
    console.log(`  ${impact.severity}: ${impact.message}`);
  });
}
```

### Accéder à l'audit juridique d'une variante

```typescript
const variant = data.variants.find((v) => v.scenarioId === "CONFORT");
console.log("Audit juridique:", variant.audit);
console.log("Score de risque:", variant.audit.riskScore);
console.log(
  "Revérification manuelle requise:",
  variant.audit.manualReviewRequired,
);
console.log("Décisions prises:", variant.audit.decisions);
variant.audit.decisions.forEach((decision) => {
  console.log(
    `  ${decision.moduleId}: ${decision.decision} (${decision.impact})`,
  );
  console.log(`    Raison: ${decision.reason}`);
});
console.log("Flags juridiques:", variant.audit.legalFlags);
```

### Comparer les prix

```typescript
console.log(`Écart de prix: ${data.comparison.priceRange} €`);
console.log(`Prix moyen: ${data.comparison.averagePrice} €`);
console.log(
  `Moins cher: ${data.comparison.cheapest.label} - ${data.comparison.cheapest.price} €`,
);
console.log(
  `Plus cher: ${data.comparison.mostExpensive.label} - ${data.comparison.mostExpensive.price} €`,
);
```

---

## Notes importantes

1. **Chaque variante contient un contexte complet** : Le champ `context` de chaque variante contient exactement la même structure qu'une réponse de `/api/quotation/calculate`.

2. **Les modules activés varient** : Chaque scénario active/désactive des modules différents, ce qui explique les différences de prix.

3. **Le scénario STANDARD est recommandé par défaut** : Si présent, il apparaît dans `comparison.recommended`.

4. **Les tags permettent le filtrage** : Utilisez `tags` pour filtrer les variantes selon vos besoins (BUDGET, COMFORT, SECURITY, etc.).

5. **Tous les prix sont en euros** : Tous les montants sont en euros (€).

6. **Formats inclus dans chaque variante** : Chaque variante contient maintenant :
   - `checklist` : Checklist terrain formatée pour l'équipe de déménagement (basée sur `requirements`)
   - `contract` : Données contractuelles formatées pour la signature (basées sur `legalImpacts` et `insurance`)
   - `audit` : Audit juridique complet avec traçabilité (basé sur `decisions` et `traceability`)

7. **Pas besoin d'appels séparés** : Les formats checklist, contract et audit sont directement disponibles dans chaque variante, évitant les appels aux endpoints `/quote/{id}/checklist`, `/quote/{id}/contract`, `/quote/{id}/audit`.
