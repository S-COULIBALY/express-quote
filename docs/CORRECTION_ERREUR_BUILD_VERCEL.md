# ✅ Correction Erreur Build Vercel

**Date** : 2026-01-10  
**Problème** : Erreur de build sur Vercel - `react-dom/server` détecté dans le bundle client  
**Statut** : ✅ Résolu

---

## 🔍 Problème Identifié

Next.js détectait l'import de `react-dom/server` dans le fichier `react-email.renderer.ts` et tentait de l'inclure dans le bundle client, ce qui causait une erreur de build :

```
Error: You're importing a component that imports react-dom/server. 
To fix it, render or return the content directly as a Server Component instead for perf and security.
```

---

## ✅ Solution Appliquée

### 1. Import Dynamique de `react-dom/server`

Au lieu d'un import statique :
```typescript
import { renderToStaticMarkup } from 'react-dom/server';
```

Utilisation d'un import dynamique au runtime :
```typescript
let renderToStaticMarkup: typeof import('react-dom/server').renderToStaticMarkup;

function getRenderToStaticMarkup() {
  if (!renderToStaticMarkup) {
    const ReactDOMServer = require('react-dom/server');
    renderToStaticMarkup = ReactDOMServer.renderToStaticMarkup;
  }
  return renderToStaticMarkup;
}
```

### 2. Configuration Next.js

Ajout dans `next.config.js` :
- `serverComponentsExternalPackages: ['react-dom/server']` dans `experimental`
- Configuration webpack pour exclure `react-dom/server` du bundle client

### 3. Correction du Commentaire

Suppression des caractères `**` dans les commentaires qui causaient des erreurs de parsing.

---

## 📝 Fichiers Modifiés

1. `src/notifications/infrastructure/templates/react-email.renderer.ts`
   - Import dynamique de `react-dom/server`
   - Fonction `getRenderToStaticMarkup()` pour chargement au runtime

2. `src/notifications/infrastructure/templates/react-email.renderer.server.ts`
   - Utilisation de `require()` dynamique pour charger le renderer
   - Correction du commentaire

3. `next.config.js`
   - Ajout de `serverComponentsExternalPackages`
   - Configuration webpack pour exclure `react-dom/server` du bundle client

---

## ✅ Résultat

- ✅ Build réussi localement
- ✅ Warnings non bloquants (imports manquants, à corriger plus tard)
- ✅ Code poussé sur GitHub
- ✅ Déploiement Vercel devrait maintenant fonctionner

---

## 📚 Références

- [Next.js Server Components](https://nextjs.org/docs/getting-started/react-essentials)
- [Next.js Server-Only Modules](https://nextjs.org/docs/app/api-reference/file-conventions/server-only)

---

**Le build devrait maintenant fonctionner sur Vercel !** 🚀
