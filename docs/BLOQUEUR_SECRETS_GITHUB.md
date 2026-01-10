# ⚠️ Blocage Push GitHub - Secrets Détectés

**Date** : 2026-01-10  
**Problème** : GitHub bloque le push car des secrets Stripe sont détectés dans l'historique Git

---

## 🔍 Problème Identifié

GitHub Push Protection a détecté des **Stripe Test API Secret Keys** dans l'historique Git :

- **Commit** : `6a725150f787123b6a3748c32c9b8bc7e4cd7f64`
  - Fichier : `docs/FLUX_PAIEMENT_STRIPE.md:618`
  - Fichier : `docs/FLUX_PAIEMENT_STRIPE.md:633`

- **Commit** : `39bdee6a168ae8ad5ca6b2cfea7622e81a16c3d8`
  - Fichier : `docs/FLUX_PAIEMENT_STRIPE.md:636`
  - Fichier : `docs/FLUX_PAIEMENT_STRIPE.md:652`

---

## ✅ Actions Déjà Effectuées

1. ✅ Secrets supprimés du fichier actuel `docs/FLUX_PAIEMENT_STRIPE.md`
2. ✅ Commit créé pour supprimer les secrets
3. ⚠️ **Problème** : Les secrets sont toujours dans l'historique Git

---

## 🔧 Solutions

### Option 1 : Autoriser Temporairement (Recommandé pour débloquer rapidement)

1. **Aller sur l'URL fournie par GitHub** :
   ```
   https://github.com/S-COULIBALY/express-quote/security/secret-scanning/unblock-secret/384XcC8xPCvXqP1PVOXluspDpVR
   ```

2. **Autoriser le secret** (c'est une clé de test, donc moins critique)

3. **Pousser à nouveau** :
   ```bash
   git push origin main
   ```

### Option 2 : Nettoyer l'Historique (Recommandé pour sécurité)

Utiliser `git filter-branch` ou BFG Repo-Cleaner pour supprimer les secrets de tout l'historique :

```bash
# Avec git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch docs/FLUX_PAIEMENT_STRIPE.md" \
  --prune-empty --tag-name-filter cat -- --all

# Puis réécrire le fichier sans secrets
# Et forcer le push
git push origin --force --all
```

⚠️ **Attention** : Cela réécrit l'historique Git. Tous les collaborateurs devront re-cloner le repository.

### Option 3 : Supprimer le Fichier de l'Historique

```bash
# Supprimer le fichier de tout l'historique
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch docs/FLUX_PAIEMENT_STRIPE.md" \
  --prune-empty --tag-name-filter cat -- --all

# Pousser
git push origin --force --all
```

---

## 📝 Recommandation

**Pour débloquer rapidement** : Utiliser l'Option 1 (autoriser temporairement)

**Pour une solution propre** : Utiliser l'Option 2 (nettoyer l'historique)

---

## 🔐 Bonnes Pratiques

1. ✅ **Ne jamais commiter de secrets** dans le code ou la documentation
2. ✅ **Utiliser des variables d'environnement** pour les secrets
3. ✅ **Utiliser `.gitignore`** pour exclure les fichiers contenant des secrets
4. ✅ **Utiliser des placeholders** dans la documentation (ex: `sk_test_***REDACTED***`)

---

**Une fois le push réussi, le déploiement Vercel se déclenchera automatiquement si le projet est connecté !** 🚀
