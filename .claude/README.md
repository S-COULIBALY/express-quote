# 📁 Dossier `.claude/` - Configuration Claude Code

Ce dossier contient la configuration pour **Claude Code** (l'agent IA dans VS Code).

---

## 📋 Fichiers

### `instructions.md` ⭐ **FICHIER PRINCIPAL**

**Rôle** : Équivalent de `.cursorrules` pour Claude Code.

**Contenu** :
- Instructions complètes pour Claude Code
- Contexte du projet (système modulaire de devis)
- Phases du pipeline (1-9)
- Règles et interdictions absolues
- Workflow de délégation aux agents autonomes
- Scripts npm disponibles
- Documentation de référence

**Usage** :
- ✅ Claude Code doit lire ce fichier au début de CHAQUE conversation
- ✅ Ce fichier est la **source de vérité** pour les instructions
- ✅ À jour avec la dernière architecture du système

---

### `settings.local.json`

**Rôle** : Configuration des permissions pour Claude Code.

**Contenu** :
```json
{
  "permissions": {
    "allow": [
      "Read(/C:\\Users\\scoul\\express-quote\\src\\quotation\\application\\services/**)",
      "Bash(npm run dev:*)"
    ],
    "deny": [],
    "ask": []
  }
}
```

**Permissions autorisées** :
- ✅ Lecture des fichiers dans `src/quotation/application/services/`
- ✅ Exécution de commandes `npm run dev:*`

---

## 🔄 Différence avec Cursor

| Aspect | Cursor | Claude Code |
|--------|--------|-------------|
| **Fichier de configuration** | `.cursorrules` | `.claude/instructions.md` |
| **Lecture automatique** | ✅ Oui | ✅ **CONFIGURÉ** (via permissions) |
| **Permissions** | Non applicable | `.claude/settings.local.json` |
| **Exécution de commandes** | ❌ Non | ✅ Oui (avec Bash tool) |

---

## ⚙️ Configuration recommandée

Pour que Claude Code lise automatiquement `instructions.md`, vous devez :

1. **Option 1 : Demander explicitement à chaque conversation**
   ```
   "Lis .claude/instructions.md pour avoir le contexte complet"
   ```

2. **Option 2 : Configurer VS Code pour l'inclure automatiquement**
   - Ajouter dans les paramètres de Claude Code
   - (Nécessite vérification de la documentation officielle)

3. **Option 3 : Référencer dans le premier message**
   - Toujours commencer par "Contexte : voir .claude/instructions.md"

---

## 🚀 Utilisation

### À chaque nouvelle conversation avec Claude Code

```
Vous : "Bonjour Claude Code, lis .claude/instructions.md pour avoir le contexte complet"

Claude Code : *lit le fichier et a maintenant tout le contexte*

Vous : "Crée le module VolumeEstimationModule"

Claude Code :
"Je recommande d'utiliser le script de délégation automatique :
npm run delegate-module -- 'VolumeEstimationModule'
Voulez-vous que je l'exécute ?"
```

---

## 📝 Maintenance

**Quand mettre à jour `instructions.md` :**
- ✅ Après modification de l'architecture modulaire
- ✅ Après ajout de nouveaux scripts npm
- ✅ Après modification des phases du pipeline
- ✅ Après ajout de nouvelles règles métier

**Synchronisation avec `.cursorrules` :**
- ⚠️ `.claude/instructions.md` et `.cursorrules` doivent rester **synchronisés**
- ⚠️ Toute modification dans l'un doit être reportée dans l'autre

---

## 🔗 Liens utiles

- Documentation complète : `src/quotation-module/docs/README.md`
- Prompt système : `docs/PROMPT_SYSTEME_AGENT_IA.md`
- Guide agents : `docs/GUIDE_AGENTS_AUTONOMES.md`
- Script délégation : `scripts/cursor-delegate-module.ts`

---

## 🎯 Résumé

Ce dossier `.claude/` permet à **Claude Code** d'avoir le même niveau de contexte que **Cursor**, garantissant ainsi une **cohérence totale** entre les deux assistants IA.

**Fichier clé** : `.claude/instructions.md` = `.cursorrules` pour Claude Code
