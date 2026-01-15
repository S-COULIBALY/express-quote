# 🚀 Guide Complet Vercel : CLI vs MCP

**Date** : 2026-01-10  
**Version** : 2.0  
**Source** : [Documentation Vercel MCP](https://vercel.com/docs/mcp)

---

## 📖 Vue d'Ensemble

Ce guide explique les deux méthodes principales pour interagir avec Vercel :
1. **Vercel CLI** : Outil en ligne de commande traditionnel
2. **Vercel MCP** : Intégration avec les assistants IA via Model Context Protocol

---

## 🔄 CLI Vercel vs MCP Vercel : Comparaison

### CLI Vercel (Command Line Interface)

**Qu'est-ce que c'est ?**
- Outil en ligne de commande installé localement sur votre machine
- Utilisé via le terminal (PowerShell, Bash, etc.)
- Nécessite l'installation de Node.js et npm

**Avantages :**
- ✅ Contrôle total via commandes explicites
- ✅ Scriptable et automatisable (CI/CD)
- ✅ Fonctionne dans tous les environnements (local, serveurs, CI)
- ✅ Accès direct à toutes les fonctionnalités Vercel
- ✅ Pas de dépendance à un IDE ou assistant IA

**Inconvénients :**
- ❌ Nécessite de connaître les commandes exactes
- ❌ Pas d'assistance contextuelle
- ❌ Interface en ligne de commande uniquement

**Quand l'utiliser :**
- Déploiements automatisés (CI/CD)
- Scripts de déploiement
- Environnements serveurs sans interface graphique
- Quand vous préférez le contrôle manuel

**Exemples d'utilisation :**
```bash
# Lister les projets
vercel projects ls

# Déployer en production
vercel --prod

# Voir les logs
vercel logs

# Configurer les variables d'environnement
vercel env add DATABASE_URL
```

---

### MCP Vercel (Model Context Protocol)

**Qu'est-ce que c'est ?**
- Serveur MCP officiel de Vercel
- Intégration native avec les assistants IA (Cursor, Claude, ChatGPT, etc.)
- Communication via protocole standardisé MCP

**Avantages :**
- ✅ Interaction naturelle en langage humain
- ✅ Assistance contextuelle intelligente
- ✅ Intégration native dans votre IDE
- ✅ Pas besoin de connaître les commandes exactes
- ✅ Automatisation intelligente des tâches complexes

**Inconvénients :**
- ❌ Nécessite un assistant IA compatible
- ❌ Dépend de la configuration MCP
- ❌ En version bêta (certaines fonctionnalités peuvent évoluer)

**Quand l'utiliser :**
- Développement interactif avec assistance IA
- Exploration et découverte de fonctionnalités
- Tâches complexes nécessitant de la réflexion
- Quand vous travaillez dans un IDE avec assistant IA

**Exemples d'utilisation :**
```
"Liste mes projets Vercel"
"Montre-moi les détails du projet express-quote"
"Déploie express-quote sur Vercel en production"
"Quels sont les logs du dernier déploiement ?"
```

---

## 📊 Tableau Comparatif

| Critère | CLI Vercel | MCP Vercel |
|---------|------------|------------|
| **Interface** | Terminal/Commande | Langage naturel |
| **Installation** | `npm i -g vercel` | Configuration dans l'IDE |
| **Authentification** | `vercel login` | OAuth via l'IDE |
| **Utilisation** | Commandes explicites | Requêtes en langage naturel |
| **Scriptabilité** | ✅ Excellente | ⚠️ Via assistant IA |
| **CI/CD** | ✅ Parfait | ❌ Non adapté |
| **Assistance** | ❌ Aucune | ✅ Intelligente |
| **Apprentissage** | ⚠️ Documentation requise | ✅ Intuitif |
| **Automatisation** | ✅ Scripts personnalisés | ✅ Intelligente |

---

## 🛠️ Installation et Configuration

### CLI Vercel

#### Installation

```bash
# Installation globale
npm i -g vercel

# Vérifier l'installation
vercel --version
```

#### Configuration

```bash
# Se connecter à Vercel
vercel login

# Lier un projet existant
vercel link

# Vérifier la connexion
vercel whoami
```

#### Utilisation de Base

```bash
# Déployer (preview)
vercel

# Déployer en production
vercel --prod

# Lister les projets
vercel projects ls

# Voir les déploiements
vercel ls

# Voir les logs
vercel logs [deployment-url]

# Variables d'environnement
vercel env ls
vercel env add VARIABLE_NAME
```

---

### MCP Vercel

#### Configuration dans Cursor

**Option A : Via l'Interface Cursor**

1. Ouvrir les paramètres MCP :
   - `Settings` → `Features` → `MCP Servers`
   - Ou `Ctrl + Shift + P` → "MCP Settings"

2. Ajouter le serveur Vercel :
   ```json
   {
     "name": "Vercel",
     "url": "https://mcp.vercel.com",
     "auth": {
       "type": "oauth"
     }
   }
   ```

3. Autoriser l'accès OAuth (Cursor ouvrira votre navigateur)

**Option B : Via Fichier de Configuration**

1. Localiser le fichier de configuration :
   - **Windows** : `%APPDATA%\Cursor\User\globalStorage\mcp.json`
   - **macOS** : `~/Library/Application Support/Cursor/User/globalStorage/mcp.json`
   - **Linux** : `~/.config/Cursor/User/globalStorage/mcp.json`

2. Ajouter la configuration :
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

3. Redémarrer Cursor

#### Vérification

Une fois configuré, testez avec :
```
"Liste mes projets Vercel"
```

---

## 🎯 Cas d'Usage Recommandés

### Utiliser CLI Vercel pour :

1. **CI/CD Pipelines**
   ```yaml
   # .github/workflows/deploy.yml
   - name: Deploy to Vercel
     run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
   ```

2. **Scripts de Déploiement**
   ```bash
   # deploy.sh
   vercel --prod
   vercel env pull .env.production
   ```

3. **Automatisation Serveur**
   ```bash
   # Sur un serveur de build
   vercel deploy --prod
   ```

### Utiliser MCP Vercel pour :

1. **Développement Interactif**
   ```
   "Montre-moi les erreurs du dernier déploiement"
   "Quels sont les projets qui ont échoué récemment ?"
   ```

2. **Exploration et Découverte**
   ```
   "Comment configurer les variables d'environnement pour express-quote ?"
   "Quelle est la différence entre preview et production ?"
   ```

3. **Tâches Complexes**
   ```
   "Déploie express-quote, vérifie les logs, et si tout est OK, 
    ajoute la variable DATABASE_URL avec la valeur [valeur]"
   ```

---

## 🛠️ Outils Disponibles via MCP Vercel

### Gestion des Projets

- `vercel_list_projects` : Lister tous vos projets
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

- `vercel_get_deployment_logs` : Logs d'un déploiement
- `vercel_get_build_logs` : Logs de build
- `vercel_get_function_logs` : Logs des fonctions

### Variables d'Environnement

- `vercel_list_env_vars` : Lister les variables
- `vercel_add_env_var` : Ajouter une variable
- `vercel_update_env_var` : Mettre à jour une variable
- `vercel_delete_env_var` : Supprimer une variable

### Documentation

- `vercel_search_docs` : Rechercher dans la documentation
- `vercel_get_doc` : Obtenir un document spécifique

---

## 💡 Exemples d'Utilisation MCP

### Exemple 1 : Déploiement avec Vérification

```
"Déploie express-quote sur Vercel en production et montre-moi les logs"
```

L'assistant IA va :
1. Déclencher le déploiement
2. Surveiller les logs en temps réel
3. Vous informer du résultat

### Exemple 2 : Diagnostic de Problème

```
"Le dernier déploiement de express-quote a échoué. 
 Analyse les logs et explique-moi l'erreur"
```

### Exemple 3 : Configuration Complète

```
"Configure le projet express-quote avec :
 - Variable DATABASE_URL = [valeur]
 - Variable NODE_ENV = production
 Puis déploie en production"
```

---

## 🔐 Sécurité et Authentification

### CLI Vercel

- Authentification via `vercel login`
- Token stocké localement
- Peut être utilisé avec tokens pour CI/CD

### MCP Vercel

- Authentification OAuth 2.0
- Géré automatiquement par l'IDE
- Tokens renouvelés automatiquement
- Révocable depuis le compte Vercel

**Bonnes Pratiques :**
- ✅ Ne partagez jamais vos tokens
- ✅ Révoquez l'accès si vous perdez l'accès à votre machine
- ✅ Utilisez des comptes séparés pour dev/prod si nécessaire

---

## 🚀 Workflow Recommandé

### Développement Local

1. **Utiliser MCP Vercel** pour :
   - Explorer les projets
   - Vérifier les logs
   - Configurer les variables d'environnement
   - Obtenir de l'aide contextuelle

2. **Utiliser CLI Vercel** pour :
   - Déploiements locaux de test
   - Scripts de build personnalisés
   - Automatisation locale

### Production et CI/CD

1. **Utiliser CLI Vercel** exclusivement :
   - Pipelines CI/CD
   - Déploiements automatisés
   - Scripts de déploiement
   - Environnements serveurs

### Développement Collaboratif

1. **MCP Vercel** pour l'exploration et l'aide
2. **CLI Vercel** pour les scripts partagés
3. **Dashboard Vercel** pour la visualisation

---

## ⚠️ Limitations

### CLI Vercel
- Aucune limitation majeure
- Outil stable et mature

### MCP Vercel
- ⚠️ Version bêta publique
- Certaines fonctionnalités peuvent évoluer
- Nécessite un assistant IA compatible
- Pas adapté pour CI/CD automatisé

---

## 📚 Ressources

### Documentation Officielle

- **Vercel CLI** : [vercel.com/docs/cli](https://vercel.com/docs/cli)
- **Vercel MCP** : [vercel.com/docs/mcp](https://vercel.com/docs/mcp)
- **Vercel MCP Server** : [vercel.com/docs/mcp/vercel-mcp](https://vercel.com/docs/mcp/vercel-mcp)

### Support

- **Changelog Vercel** : [vercel.com/changelog](https://vercel.com/changelog)
- **Community MCP** : [github.com/modelcontextprotocol](https://github.com/modelcontextprotocol)

---

## 📝 Notes Importantes

1. **CLI et MCP sont complémentaires** : Utilisez-les selon le contexte
2. **CLI pour l'automatisation** : Parfait pour CI/CD et scripts
3. **MCP pour l'interaction** : Idéal pour le développement avec assistance IA
4. **Les deux nécessitent un compte Vercel actif**
5. **L'authentification est différente mais sécurisée dans les deux cas**

---

**Dernière mise à jour** : 2026-01-10  
**Statut** : ✅ CLI et MCP opérationnels - Prêt à utiliser
