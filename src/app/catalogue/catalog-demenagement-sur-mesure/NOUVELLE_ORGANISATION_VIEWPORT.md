# 📐 Nouvelle Organisation du Viewport

**Page** : `http://localhost:3000/catalogue/catalog-demenagement-sur-mesure`  
**Fichier** : `src/app/catalogue/catalog-demenagement-sur-mesure/page.tsx`  
**Date** : 2025-12-25

---

## 🎯 Structure Globale du Viewport

### Hiérarchie Complète

```
Viewport (100% largeur, 100% hauteur)
  ↓
<div className="form-generator min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
  │
  ├─ ServicesNavigation (Barre de navigation)
  │
  ├─ Section Promotionnelle (pt-16 sm:pt-20)
  │  └─ En-tête avec texte promotionnel et badge
  │
  └─ Layout Principal (mt-6 sm:mt-8)
     │
     └─ <div className="w-full">
        │
        └─ Grid 2 Colonnes (grid-cols-1 lg:grid-cols-2)
           │
           ├─ COLONNE GAUCHE (50% desktop, 100% mobile)
           │  └─ <div className="sticky top-6">
           │     └─ Conteneur blanc (bg-white rounded-lg border shadow-sm p-4 sm:p-6)
           │        └─ FormGenerator (layout: "default")
           │
           └─ COLONNE DROITE (50% desktop, 100% mobile)
              └─ <div className="sticky top-6 space-y-6">
                 ├─ MultiOffersDisplay (conteneur blanc)
                 └─ PaymentCard (conteneur blanc)
```

---

## 📊 Détails des Colonnes

### Colonne Gauche - Formulaire

```tsx
<div className="w-full order-2 lg:order-1">
  <div className="sticky top-6">
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
      <FormGenerator />
    </div>
  </div>
</div>
```

**Caractéristiques** :
- ✅ **Sticky** : `sticky top-6` (décalé de 24px du haut)
- ✅ **Design** : Conteneur blanc avec border et shadow
- ✅ **Padding** : `p-4 sm:p-6` (16px mobile, 24px desktop)
- ✅ **Largeur** : 100% de la colonne (50% viewport sur desktop)
- ✅ **Ordre** : 2ème sur mobile, 1ère sur desktop

---

### Colonne Droite - Offres & Paiement

```tsx
<div className="w-full order-1 lg:order-2">
  <div className="sticky top-6 space-y-6">
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
      <MultiOffersDisplay />
    </div>
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <PaymentCard />
    </div>
  </div>
</div>
```

**Caractéristiques** :
- ✅ **Sticky** : `sticky top-6` (décalé de 24px du haut)
- ✅ **Design** : Conteneurs blancs avec border et shadow
- ✅ **Espacement** : `space-y-6` (24px entre les éléments)
- ✅ **Largeur** : 100% de la colonne (50% viewport sur desktop)
- ✅ **Ordre** : 1ère sur mobile, 2ème sur desktop

---

## 📐 Occupation du Viewport

### Desktop (≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│                    VIEWPORT (100%)                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ServicesNavigation                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Section Promotionnelle (pt-16)                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────┬──────────────────────┐          │
│  │  COLONNE GAUCHE      │  COLONNE DROITE      │          │
│  │  (50% viewport)      │  (50% viewport)      │          │
│  │                      │                      │          │
│  │  ┌────────────────┐ │  ┌────────────────┐ │          │
│  │  │ sticky top-6   │ │  │ sticky top-6   │ │          │
│  │  │ ┌────────────┐ │ │  │ ┌────────────┐ │ │          │
│  │  │ │ Formulaire │ │ │  │ │ Multi-     │ │ │          │
│  │  │ │ (blanc)    │ │ │  │ │ Offres     │ │ │          │
│  │  │ └────────────┘ │ │  │ └────────────┘ │ │          │
│  │  └────────────────┘ │  │ ┌────────────┐ │ │          │
│  │                      │  │ │ Payment    │ │ │          │
│  │                      │  │ │ Card       │ │ │          │
│  │                      │  │ └────────────┘ │ │          │
│  │                      │  └────────────────┘ │          │
│  └──────────────────────┴──────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (<1024px)

```
┌─────────────────────────────┐
│  VIEWPORT (100%)            │
│  ┌─────────────────────────┐│
│  │ ServicesNavigation      ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ Section Promotionnelle   ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ COLONNE DROITE (100%)   ││ ← order-1
│  │ ┌─────────────────────┐ ││
│  │ │ sticky top-6        │ ││
│  │ │ Multi-Offres        │ ││
│  │ │ PaymentCard         │ ││
│  │ └─────────────────────┘ ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ COLONNE GAUCHE (100%)   ││ ← order-2
│  │ ┌─────────────────────┐ ││
│  │ │ sticky top-6        │ ││
│  │ │ Formulaire          │ ││
│  │ └─────────────────────┘ ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

---

## 🎨 Classes CSS Clés

### Conteneur Principal
- `w-full` : 100% de la largeur du viewport
- `mt-6 sm:mt-8` : Marge supérieure (24px / 32px)

### Grid Layout
- `grid` : Display grid
- `grid-cols-1` : 1 colonne sur mobile
- `lg:grid-cols-2` : 2 colonnes sur desktop
- `gap-6 lg:gap-8` : Espacement entre colonnes (24px / 32px)

### Colonnes
- `w-full` : 100% de la largeur du conteneur grid
- `sticky top-6` : Position sticky avec offset de 24px
- `order-1` / `order-2` : Ordre d'affichage responsive

### Conteneurs Blancs
- `bg-white` : Fond blanc
- `rounded-lg` : Border radius
- `border border-gray-200` : Bordure grise
- `shadow-sm` : Ombre légère
- `p-4 sm:p-6` : Padding responsive (16px / 24px)

---

## 📏 Dimensions Réelles

### Desktop (1920px viewport)

| Élément | Largeur | Hauteur |
|---------|---------|---------|
| **Viewport** | 1920px | 100vh |
| **Colonne gauche** | 960px (50%) | Auto |
| **Colonne droite** | 960px (50%) | Auto |
| **Gap entre colonnes** | 32px | - |
| **Padding conteneur blanc** | 24px (chaque côté) | - |
| **Largeur contenu formulaire** | 960px - 48px = **912px** | - |
| **Largeur contenu offres** | 960px - 48px = **912px** | - |

### Mobile (375px viewport)

| Élément | Largeur | Hauteur |
|---------|---------|---------|
| **Viewport** | 375px | 100vh |
| **Colonne** | 375px (100%) | Auto |
| **Padding conteneur blanc** | 16px (chaque côté) | - |
| **Largeur contenu** | 375px - 32px = **343px** | - |

---

## 🔍 Comportement Sticky

### Position Sticky

Les deux colonnes utilisent `sticky top-6` :
- **Offset** : 24px depuis le haut du viewport
- **Comportement** : Restent visibles lors du scroll
- **Activation** : Dès que le conteneur dépasse le viewport

### Avantages

1. ✅ **Visibilité permanente** : Les deux colonnes restent visibles
2. ✅ **Décalage uniforme** : Même offset (24px) pour les deux colonnes
3. ✅ **Design cohérent** : Même style de conteneur blanc
4. ✅ **Responsive** : S'adapte automatiquement mobile/desktop

---

## 📱 Responsive Breakpoints

| Breakpoint | Colonnes | Ordre | Gap |
|------------|----------|-------|-----|
| **Mobile** (`< 640px`) | 1 colonne | Droite → Gauche | 24px |
| **Tablet** (`640px - 1023px`) | 1 colonne | Droite → Gauche | 24px |
| **Desktop** (`≥ 1024px`) | 2 colonnes | Gauche → Droite | 32px |

---

## ✅ Résumé

| Aspect | Valeur |
|--------|--------|
| **Occupation viewport** | ✅ **100%** (sans padding externe) |
| **Nombre de colonnes** | 1 mobile, **2 desktop** |
| **Largeur colonnes** | 100% mobile, **50% desktop** |
| **Position sticky** | ✅ **Oui** (`top-6` = 24px) |
| **Design conteneurs** | ✅ **Identique** (blanc, border, shadow) |
| **Padding conteneurs** | 16px mobile, 24px desktop |
| **Gap entre colonnes** | 24px mobile, 32px desktop |

---

## 🎯 Points Clés

1. ✅ **100% du viewport** : Pas de limitation de largeur
2. ✅ **2 colonnes égales** sur desktop (50% chacune)
3. ✅ **Sticky positioning** : Les deux colonnes restent visibles
4. ✅ **Design uniforme** : Conteneurs blancs identiques
5. ✅ **Responsive** : 1 colonne sur mobile, 2 sur desktop
6. ✅ **Ordre inversé** : Droite en premier sur mobile

---

**Version** : 2.0  
**Statut** : ✅ Organisation finale après toutes les modifications

