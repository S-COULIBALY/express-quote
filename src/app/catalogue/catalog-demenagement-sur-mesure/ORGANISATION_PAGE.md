# 📐 Organisation de la Page - Déménagement Sur Mesure

**Page** : `http://localhost:3000/catalogue/catalog-demenagement-sur-mesure`  
**Fichier** : `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx`

---

## 🎯 Structure Globale

### Conteneur Principal
```tsx
<div className="w-full mt-6 sm:mt-8">
  <div className="w-full px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {/* Colonnes */}
    </div>
  </div>
</div>
```

---

## 📊 Organisation des Colonnes

### Responsive Design

| Breakpoint | Nombre de colonnes | Largeur |
|------------|-------------------|---------|
| **Mobile** (`< 1024px`) | **1 colonne** | 100% du conteneur |
| **Desktop** (`≥ 1024px` / `lg:`) | **2 colonnes** | 50% chacune |

### Détails Techniques

#### 1. Conteneur Principal
- **Classe** : `w-full` → **100% de la largeur du viewport**
- **Padding** : `px-4 sm:px-6 lg:px-8` (responsive)

#### 2. Conteneur Principal
- **Classe** : `w-full`
  - `w-full` = **100% de la largeur du viewport**
- **Résultat** : Le contenu occupe **100% du viewport** (moins le padding)

#### 3. Grid Layout
- **Mobile** : `grid-cols-1` → **1 colonne pleine largeur**
- **Desktop** : `lg:grid-cols-2` → **2 colonnes égales (50% chacune)**
- **Gap** : `gap-6 lg:gap-8` (24px / 32px)

---

## 📐 Occupation du Viewport

### ✅ Les colonnes occupent **100% du viewport**

**Raison** : Le conteneur utilise `w-full` sans limitation de largeur maximale

### Calcul de l'occupation réelle

```
Viewport largeur (ex: 1920px)
  ↓
Conteneur w-full (100% du viewport)
  ↓
Padding horizontal (px-8 = 32px de chaque côté)
  ↓
Largeur disponible pour le contenu : 1920px - 64px = 1856px
  ↓
2 colonnes égales : 1856px / 2 = 928px chacune
```

### Exemples Concrets

| Largeur viewport | Largeur conteneur | Largeur par colonne |
|------------------|-------------------|---------------------|
| 1920px (Full HD) | 1920px - 64px = 1856px | 928px chacune |
| 1440px | 1440px - 64px = 1376px | 688px chacune |
| 1280px | 1280px - 64px = 1216px | 608px chacune |
| 1024px | 1024px - 48px = 976px | 488px chacune |
| 768px (tablet) | 768px - 48px = 720px | 720px (1 colonne) |
| 375px (mobile) | 375px - 32px = 343px | 343px (1 colonne) |

---

## 🏗️ Structure des Colonnes

### Colonne Gauche (50% sur desktop)
```tsx
<div className="w-full order-2 lg:order-1">
  {/* Formulaire de réservation */}
  <FormGenerator />
</div>
```

**Contenu** :
- Formulaire de déménagement sur mesure
- Layout "default" (sans sidebar intégrée)
- Sections en 2 colonnes internes

**Ordre responsive** :
- Mobile : Affichée en 2ème position (`order-2`)
- Desktop : Affichée en 1ère position (`lg:order-1`)

---

### Colonne Droite (50% sur desktop)
```tsx
<div className="w-full order-1 lg:order-2">
  <div className="sticky top-6 space-y-6">
    {/* Multi-offres (6 variantes) */}
    <MultiOffersDisplay />
    
    {/* Section paiement */}
    <PaymentCard />
  </div>
</div>
```

**Contenu** :
- Grille des 6 offres (3 colonnes sur desktop)
- Carte de paiement
- **Sticky** : Reste visible lors du scroll (`sticky top-6`)

**Ordre responsive** :
- Mobile : Affichée en 1ère position (`order-1`)
- Desktop : Affichée en 2ème position (`lg:order-2`)

---

## 📱 Comportement Responsive

### Mobile (`< 1024px`)
```
┌─────────────────────────────┐
│   Colonne Droite (100%)     │ ← order-1
│   - Multi-offres            │
│   - PaymentCard             │
├─────────────────────────────┤
│   Colonne Gauche (100%)     │ ← order-2
│   - Formulaire              │
└─────────────────────────────┘
```

### Desktop (`≥ 1024px`)
```
┌──────────────────────┬──────────────────────┐
│ Colonne Gauche (50%) │ Colonne Droite (50%) │
│ - Formulaire        │ - Multi-offres        │
│                     │ - PaymentCard (sticky)│
└──────────────────────┴──────────────────────┘
     max-w-7xl (1280px max, centré)
```

---

## 🎨 Classes CSS Clés

### Conteneur Principal
- `w-full` : 100% de la largeur du parent
- `max-w-7xl` : Limite à 1280px
- `mx-auto` : Centrage horizontal
- `px-4 sm:px-6 lg:px-8` : Padding responsive

### Grid Layout
- `grid` : Display grid
- `grid-cols-1` : 1 colonne sur mobile
- `lg:grid-cols-2` : 2 colonnes sur desktop
- `gap-6 lg:gap-8` : Espacement entre colonnes

### Colonnes
- `w-full` : 100% de la largeur du conteneur grid
- `order-1` / `order-2` : Ordre d'affichage responsive

---

## ✅ Résumé

| Question | Réponse |
|----------|---------|
| **Nombre de colonnes** | 1 sur mobile, **2 sur desktop** |
| **Occupation viewport** | ✅ **OUI**, **100% du viewport** (moins padding) |
| **Largeur par colonne** | 50% du conteneur (≈ 928px sur écran 1920px) |
| **Padding** | 32px de chaque côté sur desktop |
| **Largeur réelle contenu** | **100% viewport - 64px** (sur desktop) |

---

## 🔍 Points Importants

1. ✅ **2 colonnes égales** sur desktop (50% chacune)
2. ✅ **Occupent 100% du viewport** (moins le padding)
3. ✅ **Responsive** : 1 colonne sur mobile, 2 sur desktop
4. ✅ **Colonne droite sticky** : Reste visible au scroll
5. ✅ **Padding horizontal** : 32px de chaque côté sur desktop

---

**Version** : 1.0  
**Date** : 2025-12-25

