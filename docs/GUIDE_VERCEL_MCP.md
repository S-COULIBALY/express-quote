# 🚀 Guide d'Utilisation de Vercel MCP

**Date** : 2026-01-10  
**Version** : 1.0  
**Source** : [Documentation Vercel MCP](https://vercel.com/docs/mcp)

---

## 📖 Qu'est-ce que Vercel MCP ?

**Model Context Protocol (MCP)** est un protocole standard qui permet aux assistants IA d'interagir avec des outils et services externes de manière standardisée.

**Vercel MCP** est le serveur MCP officiel de Vercel qui permet de :

- ✅ Gérer vos projets Vercel
- ✅ Déployer des applications
- ✅ Analyser les logs de déploiement
- ✅ Naviguer dans la documentation Vercel
- ✅ Interagir avec vos applications déployées

**Référence** : [vercel.com/docs/mcp](https://vercel.com/docs/mcp)

---

## 🎯 Avantages de Vercel MCP

### Pour le Déploiement

1. **Déploiement simplifié** : Déployer directement depuis votre assistant IA
2. **Gestion des projets** : Créer, configurer et gérer vos projets Vercel
3. **Analyse des logs** : Consulter les logs de build et de déploiement en temps réel
4. **Gestion des variables d'environnement** : Configurer les variables directement depuis l'IA

### Pour le Développement

1. **Intégration native** : Fonctionne avec Cursor, Claude Code, ChatGPT, etc.
2. **Authentification sécurisée** : OAuth pour sécuriser l'accès
3. **API complète** : Accès à toutes les fonctionnalités Vercel via MCP

---

## 🔧 Configuration de Vercel MCP avec Cursor

### Étape 1 : Vérifier la Compatibilité

Vercel MCP est compatible avec :

- ✅ **Cursor** (votre IDE actuel)
- ✅ Claude Code
- ✅ ChatGPT
- ✅ VS Code avec Copilot
- ✅ Devin
- ✅ Raycast
- ✅ Windsurf
- ✅ Goose

**Source** : [vercel.com/docs/mcp/vercel-mcp](https://vercel.com/docs/mcp/vercel-mcp)

### Étape 2 : Configurer Vercel MCP dans Cursor

#### Option A : Configuration via Interface Cursor

1. **Ouvrir les paramètres MCP de Cursor** :
   - Aller dans **Settings** → **Features** → **MCP Servers**
   - Ou utiliser le raccourci : `Cmd/Ctrl + Shift + P` → "MCP Settings"

2. **Ajouter un nouveau serveur MCP** :
   - Cliquer sur **"Add MCP Server"**
   - Remplir les informations suivantes :

   ```json
   {
     "name": "Vercel",
     "url": "https://mcp.vercel.com",
     "auth": {
       "type": "oauth"
     }
   }
   ```

3. **Autoriser l'accès OAuth** :
   - Cursor ouvrira votre navigateur
   - Connectez-vous avec votre compte Vercel
   - Autorisez l'accès à votre compte

#### Option B : Configuration via Fichier de Configuration

1. **Localiser le fichier de configuration MCP** :
   - Sur macOS : `~/Library/Application Support/Cursor/User/globalStorage/mcp.json`
   - Sur Windows : `%APPDATA%\Cursor\User\globalStorage\mcp.json`
   - Sur Linux : `~/.config/Cursor/User/globalStorage/mcp.json`

2. **Ajouter la configuration** :

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

3. **Redémarrer Cursor** pour appliquer les changements

---

## 🛠️ Outils Disponibles via Vercel MCP

Une fois configuré, vous pouvez utiliser les outils suivants via votre assistant IA :

### Gestion des Projets

- `vercel_list_projects` : Lister tous vos projets Vercel
- `vercel_get_project` : Obtenir les détails d'un projet
- `vercel_create_project` : Créer un nouveau projet
- `vercel_update_project` : Mettre à jour un projet

### Déploiements

- `vercel_deploy` : Déployer un projet
- `vercel_list_deployments` : Lister les déploiements
- `vercel_get_deployment` : Obtenir les détails d'un déploiement
- `vercel_promote_deployment` : Promouvoir un déploiement en production
- `vercel_rollback` : Effectuer un rollback

### Logs et Monitoring

- `vercel_get_deployment_logs` : Obtenir les logs d'un déploiement
- `vercel_get_build_logs` : Obtenir les logs de build
- `vercel_get_function_logs` : Obtenir les logs des fonctions

### Variables d'Environnement

- `vercel_list_env_vars` : Lister les variables d'environnement
- `vercel_add_env_var` : Ajouter une variable d'environnement
- `vercel_update_env_var` : Mettre à jour une variable
- `vercel_delete_env_var` : Supprimer une variable

### Documentation

- `vercel_search_docs` : Rechercher dans la documentation Vercel
- `vercel_get_doc` : Obtenir un document spécifique

---

## 💡 Exemples d'Utilisation

### Exemple 1 : Déployer le Projet Express Quote

Une fois Vercel MCP configuré, vous pouvez simplement demander :

```
"Déploie le projet express-quote sur Vercel en production"
```

L'assistant IA utilisera automatiquement les outils MCP pour :

1. Vérifier que le projet existe
2. Déclencher un nouveau déploiement
3. Surveiller les logs de build
4. Vous informer du résultat

### Exemple 2 : Vérifier les Logs de Déploiement

```
"Montre-moi les logs du dernier déploiement de express-quote"
```

### Exemple 3 : Configurer les Variables d'Environnement

```
"Ajoute la variable DATABASE_URL au projet express-quote avec la valeur [valeur]"
```

### Exemple 4 : Promouvoir un Déploiement Preview

```
"Promouvoir le déploiement [deployment-id] en production"
```

---

## 🔐 Sécurité et Authentification

### OAuth avec Vercel

Vercel MCP utilise **OAuth 2.0** pour sécuriser l'accès :

1. **Première connexion** :
   - Cursor vous redirige vers Vercel pour autoriser l'accès
   - Vous devez vous connecter avec votre compte Vercel
   - Autoriser l'application Cursor

2. **Renouvellement du token** :
   - Les tokens OAuth sont automatiquement renouvelés
   - Pas besoin de vous reconnecter régulièrement

3. **Permissions** :
   - Vercel MCP demande uniquement les permissions nécessaires
   - Vous pouvez révoquer l'accès à tout moment depuis votre compte Vercel

### Bonnes Pratiques

- ✅ Ne partagez jamais vos tokens OAuth
- ✅ Révoquez l'accès si vous perdez l'accès à votre machine
- ✅ Utilisez des comptes Vercel séparés pour dev/prod si nécessaire

---

## 📚 Ressources Supplémentaires

### Documentation Officielle

- **Vercel MCP** : [vercel.com/docs/mcp](https://vercel.com/docs/mcp)
- **Vercel MCP Server** : [vercel.com/docs/mcp/vercel-mcp](https://vercel.com/docs/mcp/vercel-mcp)
- **Déployer des serveurs MCP** : [vercel.com/docs/mcp/deploy-mcp-servers-to-vercel](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel)

### Support

- **Changelog Vercel** : [vercel.com/changelog](https://vercel.com/changelog)
- **Community** : [github.com/modelcontextprotocol](https://github.com/modelcontextprotocol)

---

## ⚠️ Limitations Actuelles

### Statut Beta

Vercel MCP est actuellement en **version bêta publique** :

- ✅ Disponible sur tous les plans Vercel
- ⚠️ Certaines fonctionnalités peuvent évoluer
- ⚠️ L'API peut changer légèrement

### Compatibilité

- ✅ Compatible avec la plupart des clients IA modernes
- ⚠️ Certains outils peuvent nécessiter des mises à jour

---

## 🚀 Prochaines Étapes

### Pour Utiliser Vercel MCP Maintenant

1. **Configurer Vercel MCP dans Cursor** (voir section ci-dessus)
2. **Tester la connexion** en demandant : "Liste mes projets Vercel"
3. **Déployer express-quote** en utilisant les outils MCP

### Alternative : Déploiement Traditionnel

Si vous préférez ne pas utiliser MCP pour l'instant, vous pouvez toujours :

- ✅ Utiliser le dashboard Vercel
- ✅ Utiliser la CLI Vercel (`vercel --prod`)
- ✅ Utiliser l'intégration GitHub (déploiement automatique)

**Voir** : `docs/DEPLOIEMENT_VERCEL.md` pour les méthodes traditionnelles

---

## 📝 Notes Importantes

1. **Vercel MCP nécessite un compte Vercel actif**
2. **L'authentification OAuth est requise**
3. **Les outils MCP sont disponibles uniquement après configuration**
4. **Le projet doit être connecté à Vercel (via GitHub ou CLI)**

---

**Dernière mise à jour** : 2026-01-10  
**Statut** : ✅ Configuration possible - Prêt à utiliser
