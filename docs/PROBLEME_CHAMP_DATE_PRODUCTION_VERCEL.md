# Problème Champ "Date souhaitée" en Production Vercel

## 📋 Situation actuelle

### Problème observé

Le champ `input[type="date"]` ("Date souhaitée") s'affiche **correctement en local** mais **incorrectement en production Vercel**, spécifiquement sur les **petits écrans (mobiles)**.

**Symptômes en production** :

- Hauteur du champ réduite (environ la moitié des autres champs)
- Affichage compressé dans les grilles à 2 colonnes

**Comportement en local** :

- ✅ Hauteur correcte (52px mobile, 42px tablette/desktop)
- ✅ Texte complet visible
- ✅ Padding correct (12px 16px mobile)
- ✅ Affichage normal dans les grilles

## 🔍 Tentatives de correction effectuées

### 1. Correction initiale - Styles CSS spécifiques

**Fichier modifié** : `src/styles/form-compact-mobile.css`

- Ajout de styles spécifiques pour `input[type="date"]`
- Définition de `padding`, `min-height`, `width`, `overflow`
- Media queries pour responsive

**Résultat** : ❌ Problème persiste en production

### 2. Correction pour les grilles

**Fichier modifié** : `src/styles/form-compact-mobile.css`

- Ajout de styles spécifiques pour `.form-compact-fields .grid input[type="date"]`
- Forçage de `width: 100%`, `min-width: 0`, `box-sizing: border-box`
- Gestion du débordement avec `overflow: hidden`, `text-overflow: ellipsis`

**Résultat** : ❌ Problème persiste en production

### 3. Augmentation de la spécificité CSS

**Fichier modifié** : `src/styles/form-compact-mobile.css`

- Triple classe : `.form-compact-fields.form-compact-fields.form-compact-fields`
- Sélecteur d'attribut double : `input[type="date"][type="date"]`
- Tous les styles avec `!important`

**Résultat** : ❌ Problème persiste en production

### 4. Styles inline critiques

**Fichier modifié** : `src/components/form-generator/components/FormField.tsx`

- Ajout de styles inline dans l'attribut `style` :
  ```tsx
  style={{
    padding: "12px 16px",
    minHeight: "52px",
    height: "auto",
    fontSize: "16px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }}
  ```

**Résultat** : ❌ Problème persiste en production

### 5. Correction du masquage des labels flottants

**Fichier modifié** : `src/styles/form-compact-mobile.css`

- Suppression de `overflow: hidden` sur `.form-compact-fields .grid > *`
- Ajout de `overflow: visible` sur les conteneurs `.relative`
- Amélioration de la visibilité des labels flottants

**Résultat** : ✅ Labels flottants corrigés, mais problème du champ date persiste

## 🤔 Hypothèses sur la cause

### 1. Minification CSS de Next.js/Vercel

**Configuration** : `next.config.js` contient `optimizeCss: true`

**Problème potentiel** :

- La minification CSS peut réordonner les règles
- Suppression de règles considérées comme redondantes
- Modification de l'ordre de spécificité
- Mal gestion des sélecteurs complexes avec attributs

**Références** :

- [GitHub Discussion #52018](https://github.com/vercel/next.js/discussions/52018) - CSS styles not being applied on Vercel
- [GitHub Discussion #66690](https://github.com/vercel/next.js/discussions/66690) - CSS specificity inconsistency between dev and prod
- [GitHub Discussion #15740](https://github.com/vercel/next.js/discussions/15740) - Style in local !== style in production

### 2. Styles natifs du navigateur

**Problème potentiel** :

- Les champs `input[type="date"]` ont des styles natifs spécifiques au navigateur
- Ces styles peuvent être différents entre local (Chrome Desktop) et production (Safari iOS, Chrome Mobile)
- Les styles natifs peuvent avoir une priorité élevée même avec `!important`

### 3. Ordre de chargement des styles

**Problème potentiel** :

- Le fichier `form-compact-mobile.css` peut être chargé avant ou après d'autres styles
- Les styles injectés via `FormStylesSimplified` peuvent interférer
- Les styles Tailwind peuvent écraser les styles personnalisés

### 4. Cache navigateur/CDN

**Problème potentiel** :

- Le cache du navigateur peut servir une ancienne version des styles
- Le CDN de Vercel peut avoir un cache agressif
- Les headers `Cache-Control` peuvent empêcher la mise à jour

## 📝 Fichiers concernés

### Fichiers modifiés (tentatives de correction)

1. **`src/styles/form-compact-mobile.css`**
   - Lignes 93-117 : Styles généraux pour `input[type="date"]`
   - Lignes 237-261 : Styles pour `input[type="date"]` dans les grilles
   - Lignes 129-141 : Media queries tablette pour `input[type="date"]`
   - Lignes 159-171 : Media queries desktop pour `input[type="date"]`

2. **`src/components/form-generator/components/FormField.tsx`**
   - Lignes 204-229 : Case "date" avec styles inline

### Fichiers de configuration

1. **`next.config.js`**
   - Ligne 27 : `optimizeCss: true` (peut causer des problèmes de minification)

2. **`src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx`**
   - Import de `@/styles/form-compact-mobile.css`

## 🔧 Solutions potentielles à explorer (non implémentées)

### 1. Désactiver temporairement `optimizeCss`

**Action** : Modifier `next.config.js`

```js
experimental: {
  // optimizeCss: true, // Désactivé temporairement pour tester
  ...
}
```

**Avantage** : Permet de vérifier si la minification CSS est la cause
**Inconvénient** : Augmente la taille du bundle CSS

### 2. Utiliser un composant wrapper personnalisé

**Action** : Créer un composant `DateInput` avec styles inline complets

```tsx
const DateInput = ({ ...props }) => (
  <input
    type="date"
    style={{
      padding: "12px 16px",
      minHeight: "52px",
      height: "auto",
      fontSize: "16px",
      // ... tous les styles nécessaires
    }}
    {...props}
  />
);
```

**Avantage** : Contrôle total sur les styles
**Inconvénient** : Duplication de code, maintenance

### 3. Utiliser CSS Modules au lieu de CSS global

**Action** : Créer `FormField.module.css` et importer dans le composant

```tsx
import styles from "./FormField.module.css";
```

**Avantage** : Scoping automatique, moins de conflits
**Inconvénient** : Refactoring important

### 4. Utiliser `styled-jsx` ou `emotion`

**Action** : Utiliser une solution CSS-in-JS avec scoping automatique

```tsx
<style jsx>{`
  input[type="date"] {
    padding: 12px 16px !important;
    min-height: 52px !important;
  }
`}</style>
```

**Avantage** : Styles scoped, moins de conflits
**Inconvénient** : Ajout d'une dépendance

### 5. Vérifier les styles injectés par `FormStylesSimplified`

**Action** : Examiner `src/components/form-generator/styles/FormStylesSimplified.tsx`

- Vérifier si des styles pour `input[type="date"]` sont injectés
- S'assurer que les exclusions `:not(.form-compact-fields)` fonctionnent correctement

### 6. Utiliser des media queries inline (non supporté)

**Note** : Les media queries ne peuvent pas être utilisées dans les styles inline React

### 7. Forcer le rechargement du cache

**Action** : Ajouter un paramètre de version au fichier CSS

```tsx
import "@/styles/form-compact-mobile.css?v=2.0.0";
```

**Avantage** : Force le rechargement du cache
**Inconvénient** : Solution temporaire

### 8. Utiliser `useEffect` pour appliquer les styles dynamiquement

**Action** : Appliquer les styles via JavaScript après le montage

```tsx
useEffect(() => {
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach((input) => {
    input.style.padding = "12px 16px";
    input.style.minHeight = "52px";
    // ...
  });
}, []);
```

**Avantage** : Contourne complètement la minification CSS
**Inconvénient** : Solution "hack", peut causer un flash de contenu

## 📊 État actuel du code

### Styles CSS appliqués

**Mobile (< 640px)** :

- `padding: 12px 16px !important`
- `min-height: 52px !important`
- `font-size: 16px !important`

**Tablette (≥ 640px)** :

- `padding: 10px 16px !important`
- `min-height: 42px !important`
- `font-size: 14px !important`

**Desktop (≥ 1024px)** :

- `padding: 10px 18px !important`
- `min-height: 42px !important`
- `font-size: 14px !important`

### Styles inline appliqués

**Tous les écrans** :

- `padding: "12px 16px"`
- `minHeight: "52px"`
- `height: "auto"`
- `fontSize: "16px"`
- `overflow: "hidden"`
- `textOverflow: "ellipsis"`
- `whiteSpace: "nowrap"`

## 🎯 Conclusion

Malgré toutes les tentatives de correction :

- ✅ Styles CSS avec spécificité maximale
- ✅ Styles inline critiques
- ✅ Media queries pour responsive
- ✅ Protection multi-niveaux

Le problème **persiste en production Vercel** sur les petits écrans mobiles.

**Hypothèse principale** : La minification CSS de Next.js (`optimizeCss: true`) ou un problème spécifique à Vercel modifie/ignore les styles pour `input[type="date"]` en production.

**Recommandation** : Explorer les solutions potentielles listées ci-dessus, en commençant par désactiver temporairement `optimizeCss` pour isoler la cause.

## ✅ SOLUTIONS APPLIQUÉES (2026-01-22)

### 1. Désactivation de `optimizeCss` ✅

**Fichier modifié** : `next.config.js`

```js
experimental: {
  // DÉSACTIVÉ: optimizeCss cause des problèmes avec input[type="date"] sur mobile en production
  // Critters (utilisé par optimizeCss) ne supporte pas bien l'App Router et peut supprimer/réordonner des styles
  // optimizeCss: true,
}
```

**Raison** : Critters (utilisé par `optimizeCss`) ne supporte pas le streaming de l'App Router et peut incorrectement modifier/supprimer les styles CSS en production.

### 2. Fixes WebKit/Safari pour pseudo-éléments ✅

**Fichier modifié** : `src/styles/form-compact-mobile.css`

Ajout de styles ciblant les pseudo-éléments WebKit internes du champ date :

- `::-webkit-datetime-edit` - Conteneur de la valeur
- `::-webkit-datetime-edit-fields-wrapper` - Wrapper des champs
- `::-webkit-calendar-picker-indicator` - Icône calendrier

```css
/* Fix WebKit - Bug #198959 */
.form-compact-fields input[type="date"]::-webkit-datetime-edit {
  line-height: 1.5 !important;
  padding: 0 !important;
}

/* Forcer display block au lieu de inline-flex (comportement Safari) */
.form-compact-fields input[type="date"] {
  -webkit-appearance: textfield !important;
  display: block !important;
}
```

### 3. Styles inline améliorés ✅

**Fichier modifié** : `src/components/form-generator/components/FormField.tsx`

Ajout des propriétés CSS pour contourner le bug Safari :

- `display: "block"` - Évite le `inline-flex` de Safari
- `WebkitAppearance: "textfield"` - Force le comportement standard
- `lineHeight: 1.5` - Garantit une hauteur cohérente

### 4. Valeur par défaut pour le champ date ✅

**Fichier modifié** : `src/components/form-generator/presets/demenagement-sur-mesure-service/index.ts`

Le champ `dateSouhaitee` a maintenant une valeur par défaut (date du jour + 7 jours) pour éviter le bug WebKit où un input date vide a une hauteur réduite.

```ts
const getDefaultDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split("T")[0];
};
```

## 📅 Historique

- **2026-01-22** : Création du document après échec de toutes les tentatives de correction
- **2026-01-22** : 5 tentatives de correction effectuées sans succès en production
- **2026-01-22** : **SOLUTIONS APPLIQUÉES** - Désactivation optimizeCss + Fixes WebKit + Valeur par défaut

## 🔗 Références

- [Documentation Next.js - CSS Optimization](https://nextjs.org/docs/app/api-reference/next-config-js/optimizeCss)
- [GitHub Issue - CSS Minification Problems](https://github.com/vercel/next.js/issues)
- [MDN - input type="date"](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)
