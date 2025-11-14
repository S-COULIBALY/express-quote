# Éléments Footer Mobile - Page Détail Catalogue

## 📍 Localisation
**Fichier :** `src/components/form-generator/layouts/SidebarLayout.tsx`

---

## 🔵 Élément 1 : Barre d'Actions Fixe (Bottom Bar)

### Identification
```html
<div class="bg-white border-t border-gray-200 p-6 space-y-4">
```

### Localisation dans le code
- **Ligne :** 471-492
- **Composant :** `SidebarLayout.tsx`

### Description
Barre fixe en bas de page sur mobile qui contient les actions principales du formulaire.

### Contenu conditionnel
1. **Bouton "Voir le récapitulatif"** (si `modalRecap && view`)
   - Affiche le prix calculé
   - Ouvre le modal récapitulatif au clic
   - Bouton vert émeraude (`bg-emerald-600`)

2. **Actions du formulaire** (si `actions` existe)
   - Boutons de soumission/annulation
   - Centrés horizontalement

### Classes CSS clés
- `bg-white` : Fond blanc
- `border-t border-gray-200` : Bordure supérieure
- `p-6` : Padding 24px
- `space-y-4` : Espacement vertical entre enfants

### Visibilité
- Visible uniquement sur mobile (dans le layout mobile)
- Peut paraître vide si les conditions ne sont pas remplies

---

## 🟢 Élément 2 : Modal Récapitulatif Mobile

### Identification
```html
<div class="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
  <div class="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
```

### Localisation dans le code
- **Ligne :** 496-536
- **Composant :** `SidebarLayout.tsx`

### Description
Modal overlay qui s'affiche en plein écran sur mobile pour montrer le récapitulatif complet avec le prix.

### Structure

#### 1. Backdrop (Fond sombre)
- Fond noir semi-transparent (`bg-black bg-opacity-50`)
- Position fixe plein écran
- z-index 50

#### 2. Conteneur Modal
- Fond blanc avec coins arrondis en haut (`rounded-t-3xl`)
- Largeur pleine, hauteur max 85vh
- Ombres importantes (`shadow-2xl`)

#### 3. En-tête (Sticky)
- Titre : "Récapitulatif"
- Sous-titre : "Détails de votre commande"
- Bouton de fermeture (✕)

#### 4. Contenu Scrollable
- Affiche `{view}` (le récapitulatif complet)
- Scroll vertical si contenu trop long
- Hauteur : `calc(85vh - 80px)`

#### 5. Barre d'Action (Sticky en bas)
- Bouton "Continuer la commande"
- Vert émeraude, plein largeur

### Conditions d'affichage
Le modal s'affiche uniquement si :
- `isMobile === true` (écran < 768px)
- `modalRecap === true`
- `showMobileSummary === true` (état local)
- `view` existe (contenu du récap)

### Déclenchement
- Ouvert depuis le bouton "Voir le récapitulatif" dans l'Élément 1
- Fermé via le bouton ✕ ou le bouton "Continuer la commande"

---

## 🔗 Relation entre les deux éléments

```
Élément 1 (Barre fixe)
    ↓
Bouton "Voir le récapitulatif"
    ↓
setShowMobileSummary(true)
    ↓
Élément 2 (Modal) s'affiche
```

---

## 🎯 Utilisation

### Pour identifier l'Élément 1 (Barre fixe)
Rechercher dans le code :
- `bg-white border-t border-gray-200 p-6 space-y-4`
- Ou chercher "Actions mobiles + Bouton récap fixe"

### Pour identifier l'Élément 2 (Modal)
Rechercher dans le code :
- `Modal récapitulatif mobile amélioré`
- Ou chercher `showMobileSummary && view`
- Ou chercher `fixed inset-0 z-50` avec `rounded-t-3xl`

---

## 📝 Notes importantes

- Ces éléments sont spécifiques à la page de détail catalogue
- Ils fonctionnent uniquement sur mobile (< 768px)
- Le modal peut être vide si `view` n'est pas fourni
- La barre fixe peut être vide si les conditions ne sont pas remplies

---

**Dernière mise à jour :** Analyse du code le 2025-01-22

