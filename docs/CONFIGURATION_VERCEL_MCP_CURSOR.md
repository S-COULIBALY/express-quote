# 🔧 Configuration Vercel MCP dans Cursor - Guide Pratique

**Date** : 2026-01-10  
**Version** : 1.0  
**Plateforme** : Windows

---

## 📋 Prérequis

- ✅ Cursor installé et à jour
- ✅ Compte Vercel actif
- ✅ Projet GitHub connecté à Vercel (optionnel mais recommandé)

---

## 🎯 Méthode 1 : Configuration via Interface Cursor (Recommandé)

### Étape 1 : Ouvrir les Paramètres MCP

1. **Ouvrir Cursor**
2. **Ouvrir la palette de commandes** :
   - Appuyer sur `Ctrl + Shift + P` (ou `Cmd + Shift + P` sur Mac)
   - Taper : `MCP Settings` ou `MCP: Configure Servers`
   - Sélectionner la commande

3. **Ou via le menu** :
   - `File` → `Preferences` → `Settings`
   - Rechercher : `MCP` ou `Model Context Protocol`

### Étape 2 : Ajouter le Serveur Vercel MCP

1. **Cliquer sur "Add MCP Server"** ou le bouton `+`

2. **Remplir les informations suivantes** :

   ```json
   {
     "name": "Vercel",
     "url": "https://mcp.vercel.com",
     "auth": {
       "type": "oauth"
     }
   }
   ```

3. **Sauvegarder la configuration**

### Étape 3 : Autoriser l'Accès OAuth

1. **Cursor ouvrira automatiquement votre navigateur**
2. **Se connecter avec votre compte Vercel**
3. **Autoriser l'accès à Cursor**
4. **Confirmer dans Cursor** que la connexion est établie

### Étape 4 : Vérifier la Configuration

Dans Cursor, demander à l'assistant IA :

```
"Liste mes projets Vercel"
```

Si la configuration est correcte, l'assistant devrait pouvoir lister vos projets.

---

## 🎯 Méthode 2 : Configuration via Fichier (Alternative)

Si la méthode 1 ne fonctionne pas, vous pouvez configurer manuellement.

### Étape 1 : Localiser le Fichier de Configuration

Sur Windows, le fichier de configuration MCP se trouve généralement à :

```
%APPDATA%\Cursor\User\globalStorage\mcp.json
```

Ou :

```
C:\Users\VOTRE_NOM\AppData\Roaming\Cursor\User\globalStorage\mcp.json
```

### Étape 2 : Créer/Modifier le Fichier de Configuration

1. **Créer le dossier si nécessaire** :

   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:APPDATA\Cursor\User\globalStorage"
   ```

2. **Créer ou modifier le fichier `mcp.json`** :

   ```json
   {
     "mcpServers": {
       "vercel": {
         "url": "https://mcp.vercel.com",
         "auth": {
           "type": "oauth"
         }
       }
     }
   }
   ```

3. **Sauvegarder le fichier**

### Étape 3 : Redémarrer Cursor

1. **Fermer complètement Cursor**
2. **Rouvrir Cursor**
3. **Vérifier que Vercel MCP est chargé**

---

## 🎯 Méthode 3 : Configuration via Settings.json de Cursor

### Étape 1 : Ouvrir Settings.json

1. **Ouvrir la palette de commandes** : `Ctrl + Shift + P`
2. **Taper** : `Preferences: Open User Settings (JSON)`
3. **Sélectionner** la commande

### Étape 2 : Ajouter la Configuration MCP

Ajouter dans le fichier `settings.json` :

```json
{
  "mcp.servers": {
    "vercel": {
      "url": "https://mcp.vercel.com",
      "auth": {
        "type": "oauth"
      }
    }
  }
}
```

### Étape 3 : Sauvegarder et Redémarrer

1. **Sauvegarder** le fichier (`Ctrl + S`)
2. **Redémarrer Cursor**

---

## ✅ Vérification de la Configuration

### Test 1 : Vérifier que le Serveur est Connecté

Dans Cursor, demander :

```
"Peux-tu me dire si Vercel MCP est configuré ?"
```

### Test 2 : Lister les Projets Vercel

```
"Liste tous mes projets Vercel"
```

### Test 3 : Obtenir les Informations d'un Projet

```
"Montre-moi les détails du projet express-quote sur Vercel"
```

Si ces commandes fonctionnent, la configuration est réussie ! ✅

---

## 🐛 Dépannage

### Problème : "MCP server not found"

**Solution** :

1. Vérifier que l'URL est correcte : `https://mcp.vercel.com`
2. Vérifier votre connexion internet
3. Redémarrer Cursor

### Problème : "OAuth authentication failed"

**Solution** :

1. Vérifier que vous êtes connecté à votre compte Vercel
2. Réessayer l'authentification OAuth
3. Vérifier que votre compte Vercel est actif

### Problème : "Cannot find MCP settings"

**Solution** :

1. Mettre à jour Cursor à la dernière version
2. Vérifier que MCP est activé dans les fonctionnalités
3. Utiliser la méthode 2 (configuration manuelle)

### Problème : Les outils MCP ne fonctionnent pas

**Solution** :

1. Vérifier que le serveur est bien connecté
2. Redémarrer Cursor complètement
3. Vérifier les logs Cursor pour les erreurs

---

## 📚 Commandes Utiles avec Vercel MCP

Une fois configuré, vous pouvez utiliser ces commandes :

### Gestion des Projets

```
"Liste mes projets Vercel"
"Crée un nouveau projet Vercel nommé express-quote-test"
"Montre-moi les détails du projet express-quote"
```

### Déploiements

```
"Déploie express-quote sur Vercel en production"
"Montre-moi les derniers déploiements de express-quote"
"Promouvoir le déploiement [id] en production"
"Effectue un rollback du projet express-quote"
```

### Logs et Monitoring

```
"Montre-moi les logs du dernier déploiement de express-quote"
"Quels sont les logs de build du projet express-quote ?"
```

### Variables d'Environnement

```
"Liste les variables d'environnement du projet express-quote"
"Ajoute la variable DATABASE_URL au projet express-quote"
"Supprime la variable [NOM] du projet express-quote"
```

---

## 🔐 Sécurité

### Bonnes Pratiques

- ✅ Ne partagez jamais vos tokens OAuth
- ✅ Révoquez l'accès si vous perdez l'accès à votre machine
- ✅ Utilisez des comptes Vercel séparés pour dev/prod si nécessaire
- ✅ Vérifiez régulièrement les autorisations dans votre compte Vercel

### Révoquer l'Accès

Si vous devez révoquer l'accès :

1. Aller sur [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Trouver l'application "Cursor" ou "MCP"
3. Cliquer sur "Revoke"

---

## 📝 Notes Importantes

1. **Vercel MCP est en version bêta** : Certaines fonctionnalités peuvent évoluer
2. **Nécessite un compte Vercel actif** : Créez un compte sur [vercel.com](https://vercel.com) si nécessaire
3. **OAuth requis** : L'authentification OAuth est obligatoire pour la sécurité
4. **Compatible avec tous les plans Vercel** : Hobby, Pro, Enterprise

---

## 🚀 Prochaines Étapes

Une fois Vercel MCP configuré :

1. ✅ **Tester la connexion** avec une commande simple
2. ✅ **Déployer express-quote** via MCP si vous le souhaitez
3. ✅ **Explorer les autres outils** disponibles via MCP

**Alternative** : Vous pouvez continuer à utiliser le déploiement automatique via GitHub, qui fonctionne déjà parfaitement.

---

## 📚 Ressources

- **Documentation Vercel MCP** : [vercel.com/docs/mcp](https://vercel.com/docs/mcp)
- **Guide Vercel MCP** : `docs/GUIDE_VERCEL_MCP.md`
- **Support Vercel** : [vercel.com/support](https://vercel.com/support)

---

**Dernière mise à jour** : 2026-01-10  
**Statut** : ✅ Prêt à configurer
