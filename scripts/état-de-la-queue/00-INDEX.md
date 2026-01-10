# 📋 Index des Outils de Gestion des Queues

## 📁 Structure du Dossier

```
scripts/état-de-la-queue/
├── 00-INDEX.md                          ← Ce fichier
├── README.md                            ← Documentation complète
├── 01-test-connexion-redis.ts          ← Test connexion Redis
├── 02-vérifier-état-queues.ts          ← Vérifier état queues
├── 03-vider-queues.ts                  ← Vider toutes les queues
├── 04-jobs-échoués.ts                  ← Liste jobs échoués
├── 05-détails-job.ts                   ← Détails d'un job
├── 06-workers-actifs.ts                ← Workers actifs
├── 07-statistiques-détaillées.ts       ← Statistiques avancées
├── 08-santé-système.ts                 ← Santé globale
└── 09-analyse-notifications-reçues.ts   ← Analyse notifications reçues
```

## 🚀 Commandes Rapides

| Commande                                                                  | Description                   | Fichier                              |
| ------------------------------------------------------------------------- | ----------------------------- | ------------------------------------ |
| `npm run queue:test`                                                      | Tester la connexion Redis     | `01-test-connexion-redis.ts`         |
| `npm run queue:status`                                                    | Vérifier l'état des queues    | `02-vérifier-état-queues.ts`         |
| `npm run queue:clear`                                                     | Vider toutes les queues       | `03-vider-queues.ts`                 |
| `npx ts-node scripts/état-de-la-queue/09-analyse-notifications-reçues.ts` | Analyser notifications reçues | `09-analyse-notifications-reçues.ts` |

## 📖 Documentation

Consultez le fichier **README.md** pour :

- ✅ Guide d'utilisation détaillé
- ✅ Exemples d'utilisation
- ✅ Dépannage
- ✅ Interprétation des résultats

## 🎯 Workflow Recommandé

1. **Vérification quotidienne** : `npm run queue:status`
2. **En cas de problème** : `npm run queue:test`
3. **Nettoyage** : `npm run queue:clear` (⚠️ attention)

---

**Créé le** : Janvier 2025  
**Dernière mise à jour** : Janvier 2025
