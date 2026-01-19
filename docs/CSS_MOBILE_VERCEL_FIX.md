# Fix CSS Mobile - Problème de rendu Vercel/Production

## Problème rencontré

### Symptômes

- **En local** : Le formulaire s'affiche correctement avec des champs bien dimensionnés
- **En production (Vercel)** :
  - Champs rétrécis et mal dimensionnés
  - Labels flottants mal positionnés (chevauchant les bordures)
  - Texte tronqué dans les selects
  - Instabilité au scroll vertical/horizontal

### Captures d'écran

- Local (iPhone 12 Pro) : Champs avec padding 12px, hauteur 52px, labels bien positionnés
- Production : Champs compressés, styles partiellement appliqués

## Cause racine

Le problème est un **bug connu de Next.js/Vercel** concernant la minification CSS en production.

### Explication technique

Les styles injectés via `<style dangerouslySetInnerHTML={{__html: `...`}} />` sont traités différemment entre :

- **Développement** : Les styles sont injectés directement sans minification
- **Production** : Le minificateur CSS de Next.js peut :
  - Réordonner les règles CSS
  - Supprimer des règles considérées comme redondantes
  - Mal gérer les sélecteurs imbriqués (CSS nesting)
  - Modifier l'ordre de spécificité

### Sources

- [GitHub Discussion #52018](https://github.com/vercel/next.js/discussions/52018) - CSS styles not being applied on Vercel
- [GitHub Discussion #66690](https://github.com/vercel/next.js/discussions/66690) - CSS specificity inconsistency between dev and prod
- [GitHub Discussion #15740](https://github.com/vercel/next.js/discussions/15740) - Style in local !== style in production

## Solution appliquée

### 1. Création d'un fichier CSS externe

**Fichier créé** : `src/styles/form-compact-mobile.css`

Ce fichier contient tous les styles du formulaire mobile, organisés en sections :

- Layout Grid 2fr/3fr pour desktop
- Styles mobile-first pour les champs (input, select, textarea)
- Corrections max-width
- Espacement entre les champs
- Composant WhatsApp
- Section durée de stockage
- Animation de clignotement
- Labels flottants
- Fix Safari iOS (zoom au focus)

### 2. Import du fichier CSS dans la page

```tsx
// src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx

// Import CSS externe pour les styles mobile (évite les problèmes de minification Vercel)
import "@/styles/form-compact-mobile.css";
```

### 3. Suppression des balises `<style dangerouslySetInnerHTML>`

Avant :

```tsx
<div className="form-compact-fields">
  <style dangerouslySetInnerHTML={{__html: `
    .form-compact-fields .form-generator input { ... }
  `}} />
  <FormGenerator ... />
</div>
```

Après :

```tsx
<div className="form-compact-fields">
  {/* Styles externalisés dans @/styles/form-compact-mobile.css */}
  <FormGenerator ... />
</div>
```

### 4. Ajout de la classe `form-layout-grid`

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-3 form-layout-grid">
```

Cette classe permet d'appliquer les styles de grid depuis le fichier CSS externe.

## Structure du fichier CSS

```css
/* =============================================================================
   LAYOUT GRID 2fr/3fr POUR DESKTOP
   ============================================================================= */
@media (min-width: 1024px) {
  .form-layout-grid { ... }
}

/* =============================================================================
   STYLES MOBILE FIRST - CHAMPS FORMULAIRE
   ============================================================================= */
.form-compact-fields .form-generator input { ... }

@media (min-width: 640px) { /* TABLETTE+ */ }
@media (min-width: 1024px) { /* DESKTOP */ }

/* ... autres sections ... */
```

## Pourquoi cette solution fonctionne

1. **Fichier CSS séparé** : Next.js traite les fichiers CSS importés différemment des styles inline. Ils passent par le pipeline PostCSS/Tailwind standard.

2. **Ordre de chargement prévisible** : Les imports CSS sont chargés dans l'ordre de leur déclaration, garantissant la bonne priorité.

3. **Minification correcte** : Le minificateur CSS traite les fichiers `.css` de manière plus fiable que les chaînes de caractères inline.

4. **Cache navigateur** : Le fichier CSS peut être mis en cache séparément, améliorant les performances.

## Leçons apprises

1. **Éviter `dangerouslySetInnerHTML` pour les styles** en production Next.js/Vercel
2. **Toujours tester le build de production localement** (`npm run build && npm run start`)
3. **Utiliser des fichiers CSS externes** pour les styles complexes avec media queries
4. **Préférer Tailwind CSS** avec `tailwind-merge` pour éviter les conflits de spécificité

## Fichiers modifiés

| Fichier                                                      | Modification                           |
| ------------------------------------------------------------ | -------------------------------------- |
| `src/styles/form-compact-mobile.css`                         | Nouveau fichier - 450+ lignes de CSS   |
| `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx` | Import CSS + suppression styles inline |

## Commit

```
fix: Externaliser CSS mobile pour corriger rendu production Vercel

- Créer src/styles/form-compact-mobile.css avec tous les styles du formulaire
- Supprimer les balises <style dangerouslySetInnerHTML> problématiques
- Ajouter import CSS externe dans la page
- Résout le problème de minification CSS en production
```
