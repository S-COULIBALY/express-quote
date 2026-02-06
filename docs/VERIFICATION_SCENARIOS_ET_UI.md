# Vérification scénarios (QuoteScenario) et cohérence UI

**Date** : 2026-02  
**Fichiers** : `QuoteScenario.ts`, `scenarioServicesHelper.ts`, `MultiOffersDisplay.tsx`

---

## 1. Stratégie d’upsell derrière les 6 scénarios

### Objectif business

Les 6 formules (ECO → STANDARD → CONFORT → PREMIUM → SÉCURITÉ+ → FLEX) forment un **entonnoir de valeur** :

1. **Ancrer le prix** : ECO montre le prix plancher (transport + main-d’œuvre uniquement). Le client voit immédiatement la fourchette min.
2. **Mettre en avant le “meilleur rapport qualité-prix”** : STANDARD et surtout **CONFORT** (badge “Le plus choisi”) orientent vers la formule la plus rentable pour l’entreprise et la plus rassurante pour le client.
3. **Monter en gamme** : PREMIUM et SÉCURITÉ+ ciblent les clients prêts à payer plus pour la délégation totale ou la protection maximale (assurance, nettoyage, objets de valeur).
4. **Capturer les cas atypiques** : FLEX (Sur-mesure) récupère les besoins spécifiques sans forcer des options inutiles ; la marge (38 %) compense la complexité.

### Mécanismes d’upsell

| Mécanisme                       | Rôle                                                                                                                                                                                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Marge progressive**           | 20 % (ECO) → 30 % (STANDARD) → 35 % (CONFORT) → 32–40 % (SÉCURITÉ+/PREMIUM) → 38 % (FLEX). Plus le client délègue, plus la marge est élevée (sauf SÉCURITÉ+ volontairement un peu sous PREMIUM pour positionnement “sécurité” plutôt que “luxe”).                                  |
| **Formules fixes vs FLEX**      | ECO à SÉCURITÉ+ = formules **fixes** (`useClientSelection: false`) : le client ne peut pas retirer d’options. Il compare des packs. FLEX = **seul scénario** où la sélection client (catalogue / cross-selling) pilote le calcul ; tout le reste est “inclus” ou “non disponible”. |
| **“Non disponible”**            | Pour les formules fixes, les options non incluses sont **désactivées** (❌) : pas d’achat à la carte. Pour monter en gamme, le client doit changer de formule.                                                                                                                     |
| **Recommandation intelligente** | L’algorithme (contexte : volume, étage, distance, objets de valeur, etc.) suggère une formule (ex. CONFORT) pour augmenter la conversion vers la formule cible.                                                                                                                    |
| **Prix dynamique**              | Chaque scénario recalcule le prix à partir du même `baseCost` ; la différence de prix entre ECO et PREMIUM illustre la “valeur” des options incluses.                                                                                                                              |

### Résumé par cible

| Scénario    | Cible                                     | Message upsell                                           |
| ----------- | ----------------------------------------- | -------------------------------------------------------- |
| ECO         | Petit budget, étudiant, prêt à tout faire | “L’essentiel à petit prix”                               |
| STANDARD    | Majorité, premier “pro”                   | “Le minimum professionnel”                               |
| **CONFORT** | **Familles, “le plus choisi”**            | **“La tranquillité”** – point d’équilibre prix / service |
| PREMIUM     | Cadres, expatriés, délégation totale      | “Clé en main”                                            |
| SÉCURITÉ+   | Objets de valeur, assurance maximale      | “Protection maximale”                                    |
| FLEX        | Cas atypiques, besoins précis             | “Choisissez uniquement ce dont vous avez besoin”         |

---

## 2. QuoteScenario.ts – Détail par scénario et impact sur les formules

Pour chaque scénario, **impact sur les formules** = quels modules de coût sont **activés** (entrent dans le calcul), **désactivés** (ignorés), et quels **overrides** forcent des options dans le contexte (donc déclenchent ou modifient des coûts).

---

### ECO – L’essentiel à petit prix

| Élément                | Valeur                                                                                                                                                                | Impact sur la formule                                                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **useClientSelection** | `false`                                                                                                                                                               | Les choix client (emballage, démontage, etc.) sont ignorés.                                                                                                                                   |
| **enabledModules**     | (aucun)                                                                                                                                                               | Seuls les modules “core” du pipeline s’appliquent (volume, distance, main-d’œuvre, accès, etc.).                                                                                              |
| **disabledModules**    | packing-requirement, packing-cost, cleaning-end-\*, dismantling-cost, reassembly-cost, high-value-item-handling, supplies-cost, overnight-stop-cost, crew-flexibility | **Aucun coût** emballage, démontage, remontage, fournitures, nettoyage, assurance optionnelle, nuit, flexibilité. Le prix = transport + main-d’œuvre + contraintes (monte-meubles si requis). |
| **overrides**          | (aucun)                                                                                                                                                               | Contexte non modifié.                                                                                                                                                                         |
| **marginRate**         | **0.20**                                                                                                                                                              | Marge la plus basse → prix le plus bas.                                                                                                                                                       |

**Formule résultante** : `baseCost (transport + MO + accès + monte-meubles si besoin) × (1 + 0.20)`.

---

### STANDARD – Le minimum professionnel

| Élément                | Valeur                                              | Impact sur la formule                                                                          |
| ---------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **useClientSelection** | `false`                                             | Formule fixe, pas de prise en compte des options client.                                       |
| **enabledModules**     | packing-requirement, packing-cost, dismantling-cost | **Coûts ajoutés** : emballage (objets fragiles) + démontage.                                   |
| **disabledModules**    | reassembly-cost, cleaning-end-\*, insurance-premium | Pas de remontage, pas de nettoyage, pas d’assurance renforcée.                                 |
| **overrides**          | packing: true, dismantling: true                    | Force emballage et démontage dans le contexte → les modules activés calculent bien ces postes. |
| **marginRate**         | **0.30**                                            | Marge intermédiaire.                                                                           |

**Formule résultante** : baseCost + **packing** + **démontage** ; pas de remontage / nettoyage / assurance renforcée. Prix = (baseCost + packing + dismantling) × (1 + 0.30).

---

### CONFORT – La tranquillité (⭐ Le plus choisi)

| Élément                | Valeur                                                                              | Impact sur la formule                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **useClientSelection** | `false`                                                                             | Formule fixe.                                                                                                                     |
| **enabledModules**     | packing-requirement, packing-cost, dismantling-cost, reassembly-cost, supplies-cost | **Coûts ajoutés** : emballage complet + démontage + **remontage** + **fournitures**.                                              |
| **disabledModules**    | overnight-stop-cost, crew-flexibility                                               | Pas de nuit sur place ni flexibilité équipe.                                                                                      |
| **overrides**          | packing, dismantling, reassembly, bulkyFurniture, forceSupplies: true               | Emballage, démontage, remontage et fournitures forcés ; forceSupplies assure un calcul de fournitures même sans sélection client. |
| **marginRate**         | **0.35**                                                                            | Marge élevée, formule très rentable et rassurante.                                                                                |

**Formule résultante** : baseCost + packing + dismantling + reassembly + supplies (calcul dynamique si besoin). Objets de valeur / assurance / nettoyage restent **non disponibles** (pas dans la formule). Prix = (baseCost + packing + dismantling + reassembly + supplies) × (1 + 0.35).

---

### SÉCURITÉ+ (SECURITY_PLUS) – Protection maximale

| Élément                | Valeur                                                                                                                                                       | Impact sur la formule                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **useClientSelection** | `false`                                                                                                                                                      | Formule fixe.                                                                                                                                                        |
| **enabledModules**     | packing, cleaning-end-\*, dismantling, reassembly, high-value-item-handling, supplies-cost, insurance-premium                                                | **Tous ces postes** entrent dans le calcul : emballage, **nettoyage fin de bail**, démontage, remontage, **objets de valeur**, fournitures, **assurance renforcée**. |
| **disabledModules**    | (aucun)                                                                                                                                                      | Aucun service optionnel désactivé pour cette formule.                                                                                                                |
| **overrides**          | packing, cleaningEnd, dismantling, reassembly, bulkyFurniture, artwork, surface: 80, declaredValueInsurance: true, declaredValue: 50000, forceSupplies: true | Contexte orienté “pro + assurance” : surface 80 m² (nettoyage recommandé), valeur déclarée 50 000 €, fournitures forcées, gros meubles et œuvres pris en compte.     |
| **marginRate**         | **0.32**                                                                                                                                                     | Légèrement sous PREMIUM pour positionnement “sécurité” plutôt que “premium luxe”.                                                                                    |

**Formule résultante** : baseCost + packing + cleaning + dismantling + reassembly + high-value + supplies + insurance (valeur déclarée 50k). Prix = somme de tous ces coûts × (1 + 0.32).

---

### PREMIUM – Clé en main

| Élément                | Valeur                 | Impact sur la formule                                                        |
| ---------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| **useClientSelection** | `false`                | Formule fixe.                                                                |
| **enabledModules**     | Identiques à SÉCURITÉ+ | Même périmètre de services que SÉCURITÉ+.                                    |
| **disabledModules**    | (aucun)                | Idem.                                                                        |
| **overrides**          | Identiques à SÉCURITÉ+ | Même contexte (nettoyage, assurance 50k, fournitures, etc.).                 |
| **marginRate**         | **0.40**               | Marge la plus haute des formules fixes → positionnement “délégation totale”. |

**Formule résultante** : Même calcul que SÉCURITÉ+ (mêmes modules et overrides), mais **prix plus élevé** à cause de la marge 40 % au lieu de 32 %. Prix = même somme de coûts × (1 + 0.40).

---

### FLEX – Sur-mesure (100 % personnalisable)

| Élément                | Valeur   | Impact sur la formule                                                                                |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| **useClientSelection** | **true** | **Seul scénario** où les sélections client (catalogue / cross-selling) sont appliquées au contexte.  |
| **enabledModules**     | (aucun)  | Aucune activation forcée ; le moteur utilise les modules applicables selon le contexte.              |
| **disabledModules**    | (aucun)  | Aucune désactivation forcée.                                                                         |
| **overrides**          | (aucun)  | Contexte = uniquement ce que le client a coché (emballage, démontage, fournitures, assurance, etc.). |
| **marginRate**         | **0.38** | Marge élevée pour compenser la personnalisation et les cas complexes.                                |

**Formule résultante** : baseCost + **uniquement les coûts correspondant aux options sélectionnées par le client**. Chaque option cochée (packing, dismantling, supplies, insurance, etc.) active le module de coût correspondant. Prix = (baseCost + coûts des options choisies) × (1 + 0.38).

---

## 3. Synthèse : impact des scénarios sur le calcul

| Scénario  | Modules de coût ajoutés (vs base)                                           | Marge | Effet prix                                  |
| --------- | --------------------------------------------------------------------------- | ----- | ------------------------------------------- |
| ECO       | Aucun (core uniquement)                                                     | 20 %  | Le plus bas                                 |
| STANDARD  | packing, dismantling                                                        | 30 %  | Bas                                         |
| CONFORT   | packing, dismantling, reassembly, supplies                                  | 35 %  | Milieu                                      |
| SÉCURITÉ+ | packing, cleaning, dismantling, reassembly, high-value, supplies, insurance | 32 %  | Élevé                                       |
| PREMIUM   | Idem SÉCURITÉ+                                                              | 40 %  | Le plus élevé (formules fixes)              |
| FLEX      | Selon sélection client                                                      | 38 %  | Variable (entre ECO et PREMIUM selon choix) |

---

## 4. scenarioServicesHelper.ts – Cohérence avec QuoteScenario

| Scénario      | Inclus (helper)                                                             | Disabled (helper)                                                                                   | Optionnel                                                                                           | Conditionnel   | Alignement |
| ------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------- | ---------- |
| ECO           | –                                                                           | packing, dismantling, supplies, reassembly, high-value, insurance, cleaning, overnight, flexibility | –                                                                                                   | furniture-lift | ✅         |
| STANDARD      | packing, dismantling                                                        | reassembly, supplies, high-value, insurance, cleaning, overnight, flexibility                       | –                                                                                                   | furniture-lift | ✅         |
| CONFORT       | packing, dismantling, supplies, reassembly                                  | high-value, insurance, cleaning, overnight, flexibility                                             | –                                                                                                   | furniture-lift | ✅         |
| PREMIUM       | packing, dismantling, supplies, reassembly, high-value, insurance, cleaning | overnight, flexibility                                                                              | –                                                                                                   | furniture-lift | ✅         |
| SECURITY_PLUS | idem PREMIUM                                                                | –                                                                                                   | overnight, flexibility                                                                              | furniture-lift | ✅         |
| FLEX          | –                                                                           | –                                                                                                   | packing, dismantling, supplies, reassembly, high-value, insurance, cleaning, overnight, flexibility | furniture-lift | ✅         |

Les libellés et le découpage inclus / non dispo / optionnel reflètent les modules et overrides de `QuoteScenario.ts`.

---

## 5. MultiOffersDisplay.tsx – Cohérence UI

| Élément                       | Vérification                                                                                                                                                                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SCENARIO_ORDER                | ECO, STANDARD, CONFORT, SECURITY_PLUS, PREMIUM, FLEX (Sécurité+ avant Premium, prix croissant) ✅                                                                                                                                                                                               |
| SCENARIO_MICRO_COPY           | Une phrase par scénario + alias SECURITY pour SÉCURITÉ+ ✅                                                                                                                                                                                                                                      |
| FLEX_OPTIONS_LABELS           | Liste des options configurables FLEX (fournitures, emballage, démontage, etc.) ✅                                                                                                                                                                                                               |
| getDisplayLabel               | CONFORT → "Confort ⭐", SECURITY → "Sécurité+" ✅                                                                                                                                                                                                                                               |
| getRecommendationMessage      | Messages par scénario ; FLEX = "Choisissez uniquement ce dont vous avez besoin" ✅                                                                                                                                                                                                              |
| Carte FLEX                    | Options configurables affichées ; getIncludedServicesLabels(FLEX) = [] donc pas de bloc "Inclus" ✅                                                                                                                                                                                             |
| Tableau                       | getServiceStatus / getScenarioServices pour ✅ / ❌ / ⚙️ / ⭕ ✅                                                                                                                                                                                                                                |
| Note contraintes              | Monte-meubles, garde-meubles mentionnés en bas ✅                                                                                                                                                                                                                                               |
| **Ordre des lignes (upsell)** | Tableau et helper partagent le même ordre : **Emballage → Démontage → Fournitures → Remontage** → Objets de valeur → Assurance → Nettoyage → Monte-meubles → Étape/nuit → Flexibilité. Cohérent au premier coup d’œil avec la logique d’upsell (chaîne métier puis valeur puis contraintes). ✅ |

---

## 6. Corrections appliquées lors de la vérification

- **CONFORT (QuoteScenario)** : ajout de `disabledModules: ['overnight-stop-cost', 'crew-flexibility']` pour aligner le moteur sur le doc et avec `scenarioServicesHelper`.
- **CONFORT (commentaire)** : précision « Non disponible : Nuit sur place, flexibilité planning ».
- **MultiOffersDisplay** : message recommandation FLEX mis à jour en « Choisissez uniquement ce dont vous avez besoin ».

---

## 7. Synthèse finale

- **QuoteScenario.ts** : Chaque scénario est cohérent avec sa fiche (inclus / non dispo / optionnel / useClientSelection). Commentaires alignés avec l’impact sur les formules.
- **scenarioServicesHelper.ts** : Inclus / disabled / optional / conditional reflètent les scénarios (FLEX = 100 % optionnel côté affichage). Ordre des services aligné sur l’upsell (démontage avant fournitures) et identique à `MultiOffersDisplay` (tableau).
- **MultiOffersDisplay.tsx** : Ordre, micro-textes, options FLEX, libellés et messages reflètent les formules ; FLEX affiche bien « options configurables » et aucun « inclus » d’office.
- **Upsell** : Les 6 scénarios forment un entonnoir (ancrage prix → meilleur rapport qualité-prix → gamme supérieure → sur-mesure), avec formules fixes pour pousser les packs et FLEX pour capter les besoins spécifiques.
